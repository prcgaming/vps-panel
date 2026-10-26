import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { wsHub } from '../ws/hub.js';
const router = Router();
// GET /api/vps - List VPS instances
router.get('/', authenticate, (req, res) => {
    const user = req.user;
    let query = `
    SELECT v.*, 
      n.name as node_name, n.ip_address as node_ip, n.status as node_status, n.driver as node_driver,
      u.name as owner_name, u.email as owner_email
    FROM vps_instances v
    LEFT JOIN nodes n ON v.node_id = n.id
    LEFT JOIN users u ON v.user_id = u.id
  `;
    const params = [];
    if (user.role !== 'admin') {
        query += ' WHERE v.user_id = ?';
        params.push(user.id);
    }
    query += ' ORDER BY v.created_at DESC';
    const instances = db.prepare(query).all(...params);
    res.json({ instances });
});
// POST /api/vps - Create new VPS instance
router.post('/', authenticate, async (req, res) => {
    const user = req.user;
    const { name, hostname, virt_type = 'hvm', os_type: rawOsType, os_image = 'ubuntu:24.04', iso_url, cpu_cores = 1, ram_mb = 1024, disk_gb = 20, node_id, // optional: if not supplied, auto-scheduler chooses least loaded node
    root_password, ssh_key } = req.body;
    // Auto-detect OS Type (Windows, Desktop GUI, Custom ISO, or Linux)
    let os_type = rawOsType || 'linux';
    if (!rawOsType) {
        if (os_image.toLowerCase().includes('windows') || name.toLowerCase().includes('windows')) {
            os_type = 'windows';
        }
        else if (os_image.toLowerCase().includes('desktop') || os_image.toLowerCase().includes('gui')) {
            os_type = 'gui_desktop';
        }
        else if (iso_url || os_image.toLowerCase().includes('custom-iso')) {
            os_type = 'custom_iso';
        }
    }
    if (!name || !hostname) {
        res.status(400).json({ error: 'Name and hostname are required' });
        return;
    }
    // Permission & Quota Checks for Non-Admin Users
    if (user.role !== 'admin') {
        const allowCreate = db.prepare("SELECT value FROM system_settings WHERE key = 'allow_user_create_vps'").get();
        if (allowCreate && (allowCreate.value === '0' || allowCreate.value === 'false')) {
            res.status(403).json({ error: 'VPS deployment is currently restricted by the administrator.' });
            return;
        }
        const maxLimitRow = db.prepare("SELECT value FROM system_settings WHERE key = 'max_vps_per_user'").get();
        const maxLimit = maxLimitRow ? parseInt(maxLimitRow.value, 10) : 2;
        const userVpsCount = db.prepare('SELECT COUNT(*) as c FROM vps_instances WHERE user_id = ?').get(user.id).c;
        if (userVpsCount >= maxLimit) {
            res.status(403).json({ error: `You have reached your limit of ${maxLimit} VPS instance(s). Please contact an administrator to increase your quota.` });
            return;
        }
    }
    // 1. Select Node (Manual or Intelligent Auto-Scheduler)
    let targetNodeId = node_id;
    if (!targetNodeId) {
        // Select online, non-drained node with lowest allocated RAM
        const bestNode = db.prepare(`
      SELECT n.id, n.name,
        (SELECT COALESCE(SUM(v.ram_mb), 0) FROM vps_instances v WHERE v.node_id = n.id) as allocated_ram
      FROM nodes n
      WHERE n.is_drained = 0 AND n.status = 'online'
      ORDER BY allocated_ram ASC
      LIMIT 1
    `).get();
        if (!bestNode) {
            // Fallback to any node if none marked online yet
            const fallbackNode = db.prepare(`
        SELECT id FROM nodes WHERE is_drained = 0 LIMIT 1
      `).get();
            if (!fallbackNode) {
                res.status(400).json({ error: 'No active worker nodes found. Please add a node to the cluster first.' });
                return;
            }
            targetNodeId = fallbackNode.id;
        }
        else {
            targetNodeId = bestNode.id;
        }
    }
    // 2. IPAM: Allocate next available IP from pool
    let assignedIp = '198.51.100.10';
    let assignedGateway = '198.51.100.1';
    let assignedNetmask = '255.255.255.0';
    const freeIp = db.prepare(`
    SELECT a.id, a.ip_address, p.gateway, p.netmask
    FROM ip_allocations a
    JOIN ip_pools p ON a.pool_id = p.id
    WHERE a.vps_id IS NULL AND a.is_reserved = 0
    LIMIT 1
  `).get();
    if (freeIp) {
        assignedIp = freeIp.ip_address;
        assignedGateway = freeIp.gateway;
        assignedNetmask = freeIp.netmask;
    }
    const vpsId = `vps-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const password = root_password || `Pass_${Math.random().toString(36).substring(2, 10)}!`;
    const vncPort = 5900 + Math.floor(Math.random() * 2000);
    const vncPassword = Math.random().toString(36).substring(2, 10);
    // Insert into DB as creating
    db.prepare(`
    INSERT INTO vps_instances (
      id, name, hostname, node_id, user_id, status, virt_type, os_type, os_image, 
      iso_url, vnc_port, vnc_password, cpu_cores, ram_mb, disk_gb, ip_address, gateway, netmask, root_password, ssh_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(vpsId, name, hostname, targetNodeId, user.id, 'creating', virt_type, os_type, os_image, iso_url || '', vncPort, vncPassword, cpu_cores, ram_mb, disk_gb, assignedIp, assignedGateway, assignedNetmask, password, ssh_key || '');
    // Mark IP as used
    if (freeIp) {
        db.prepare('UPDATE ip_allocations SET vps_id = ? WHERE id = ?').run(vpsId, freeIp.id);
    }
    // Activity log
    db.prepare(`
    INSERT INTO activity_logs (id, user_id, action, target_type, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), user.id, 'vps_create', 'vps', vpsId, `Created ${virt_type.toUpperCase()} (${os_type}) VPS ${name} (${assignedIp}) on node ${targetNodeId}`, req.ip || '127.0.0.1');
    // 3. Dispatch creation to node agent if connected
    try {
        if (wsHub.isNodeOnline(targetNodeId)) {
            await wsHub.sendCommandToNode(targetNodeId, 'vps_create', {
                id: vpsId,
                name,
                hostname,
                virt_type,
                os_type,
                os_image,
                iso_url: iso_url || '',
                vnc_port: vncPort,
                vnc_password: vncPassword,
                cpu_cores,
                ram_mb,
                disk_gb,
                ip_address: assignedIp,
                root_password: password,
                ssh_key: ssh_key || ''
            });
            db.prepare(`UPDATE vps_instances SET status = 'running' WHERE id = ?`).run(vpsId);
        }
        else {
            // Mark as running for simulation/mock if agent is offline
            db.prepare(`UPDATE vps_instances SET status = 'running' WHERE id = ?`).run(vpsId);
        }
    }
    catch (err) {
        console.error('[VPS] Agent creation failed:', err.message);
        // Even if node agent is unreachable, instance is saved and marked ready for sync
        db.prepare(`UPDATE vps_instances SET status = 'running' WHERE id = ?`).run(vpsId);
    }
    const created = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId);
    res.status(201).json({ vps: created });
});
// GET /api/vps/:id - Get VPS instance details
router.get('/:id', authenticate, (req, res) => {
    const user = req.user;
    const vpsId = String(req.params.id);
    const vps = db.prepare(`
    SELECT v.*, 
      n.name as node_name, n.ip_address as node_ip, n.status as node_status, n.driver as node_driver,
      u.name as owner_name, u.email as owner_email
    FROM vps_instances v
    LEFT JOIN nodes n ON v.node_id = n.id
    LEFT JOIN users u ON v.user_id = u.id
    WHERE v.id = ?
  `).get(vpsId);
    if (!vps) {
        res.status(404).json({ error: 'VPS instance not found' });
        return;
    }
    if (user.role !== 'admin' && vps.user_id !== user.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    res.json({ vps });
});
// POST /api/vps/:id/action - Perform action (start, stop, restart, reinstall, reset_password, resize)
router.post('/:id/action', authenticate, async (req, res) => {
    const user = req.user;
    const vpsId = String(req.params.id);
    const { action, payload = {} } = req.body;
    const vps = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId);
    if (!vps) {
        res.status(404).json({ error: 'VPS instance not found' });
        return;
    }
    if (user.role !== 'admin' && vps.user_id !== user.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    // Power action permission check for non-admin users
    if (user.role !== 'admin' && ['start', 'stop', 'restart'].includes(action)) {
        const allowPower = db.prepare("SELECT value FROM system_settings WHERE key = 'allow_user_manage_power'").get();
        if (allowPower && (allowPower.value === '0' || allowPower.value === 'false')) {
            res.status(403).json({ error: 'VPS power actions are currently restricted by the administrator.' });
            return;
        }
    }
    const validActions = ['start', 'stop', 'restart', 'reinstall', 'reset_password', 'resize'];
    if (!validActions.includes(action)) {
        res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
        return;
    }
    // Update DB status immediately or accordingly
    let targetStatus = vps.status;
    if (action === 'start')
        targetStatus = 'running';
    if (action === 'stop')
        targetStatus = 'stopped';
    if (action === 'restart')
        targetStatus = 'running';
    if (action === 'reinstall')
        targetStatus = 'rebuilding';
    db.prepare('UPDATE vps_instances SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(targetStatus, vps.id);
    // Dispatch to agent
    try {
        if (wsHub.isNodeOnline(vps.node_id)) {
            await wsHub.sendCommandToNode(vps.node_id, `vps_${action}`, {
                id: vps.id,
                ...payload
            });
        }
        if (action === 'reinstall') {
            db.prepare('UPDATE vps_instances SET status = ? WHERE id = ?').run('running', vps.id);
        }
    }
    catch (err) {
        console.error(`[VPS] Action ${action} error:`, err.message);
    }
    // Log action
    db.prepare(`
    INSERT INTO activity_logs (id, user_id, action, target_type, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), user.id, `vps_${action}`, 'vps', vps.id, `Action ${action} executed on VPS ${vps.name}`, req.ip || '127.0.0.1');
    const updated = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vps.id);
    res.json({ success: true, action, vps: updated });
});
// DELETE /api/vps/:id - Terminate VPS
router.delete('/:id', authenticate, async (req, res) => {
    const user = req.user;
    const vpsId = String(req.params.id);
    const vps = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId);
    if (!vps) {
        res.status(404).json({ error: 'VPS not found' });
        return;
    }
    if (user.role !== 'admin' && vps.user_id !== user.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    // Dispatch delete to node agent
    try {
        if (wsHub.isNodeOnline(vps.node_id)) {
            await wsHub.sendCommandToNode(vps.node_id, 'vps_delete', { id: vps.id });
        }
    }
    catch (err) {
        console.warn(`[VPS] Delete on agent failed:`, err.message);
    }
    // Release IP back to pool
    db.prepare('UPDATE ip_allocations SET vps_id = NULL WHERE vps_id = ?').run(vps.id);
    // Delete instance
    db.prepare('DELETE FROM vps_instances WHERE id = ?').run(vps.id);
    // Log
    db.prepare(`
    INSERT INTO activity_logs (id, user_id, action, target_type, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), user.id, 'vps_delete', 'vps', vps.id, `Terminated VPS ${vps.name} (${vps.ip_address})`, req.ip || '127.0.0.1');
    res.json({ success: true, message: 'VPS terminated and IP released' });
});
// Helper: Resolve VPS files storage directory
function getVpsStorageDir(vpsId) {
    const systemDir = `/opt/vps-panel/vms/${vpsId}/files`;
    if (fs.existsSync('/opt/vps-panel')) {
        if (!fs.existsSync(systemDir)) {
            fs.mkdirSync(systemDir, { recursive: true });
            seedDefaultVpsFiles(systemDir, vpsId);
        }
        return systemDir;
    }
    const localDir = path.resolve(process.cwd(), 'data', 'vms', vpsId, 'files');
    if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
        seedDefaultVpsFiles(localDir, vpsId);
    }
    return localDir;
}
function seedDefaultVpsFiles(baseDir, vpsId) {
    try {
        const vps = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId);
        const hostname = vps?.hostname || 'cloud-vps';
        const ip = vps?.ip_address || '198.51.100.10';
        fs.mkdirSync(path.join(baseDir, 'etc', 'nginx'), { recursive: true });
        fs.mkdirSync(path.join(baseDir, 'root', '.ssh'), { recursive: true });
        fs.mkdirSync(path.join(baseDir, 'var', 'www', 'html'), { recursive: true });
        fs.mkdirSync(path.join(baseDir, 'var', 'log'), { recursive: true });
        fs.mkdirSync(path.join(baseDir, 'home', 'ubuntu'), { recursive: true });
        fs.mkdirSync(path.join(baseDir, 'tmp'), { recursive: true });
        fs.writeFileSync(path.join(baseDir, 'etc', 'hostname'), `${hostname}\n`);
        fs.writeFileSync(path.join(baseDir, 'etc', 'resolv.conf'), `nameserver 1.1.1.1\nnameserver 8.8.8.8\n`);
        fs.writeFileSync(path.join(baseDir, 'etc', 'os-release'), `NAME="Ubuntu"\nVERSION="24.04 LTS"\nID=ubuntu\n`);
        fs.writeFileSync(path.join(baseDir, 'etc', 'nginx', 'nginx.conf'), `user www-data;\nworker_processes auto;\nevents { worker_connections 1024; }\nhttp {\n    server {\n        listen 80;\n        server_name ${hostname};\n        root /var/www/html;\n        index index.html;\n    }\n}\n`);
        fs.writeFileSync(path.join(baseDir, 'var', 'www', 'html', 'index.html'), `<!DOCTYPE html>\n<html>\n<head><title>Welcome to ${hostname}</title></head>\n<body style="font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:40px;">\n<h1>Welcome to ${hostname}!</h1>\n<p>Your high-performance HVM virtual server is active and running at ${ip}.</p>\n</body>\n</html>\n`);
        fs.writeFileSync(path.join(baseDir, 'root', 'welcome.txt'), `=======================================================\nWelcome to your Lunar Client Cloud Server (${hostname})\nIPv4: ${ip}\nAccess: SSH, Web Console, and Web VNC Display\n=======================================================\n`);
        fs.writeFileSync(path.join(baseDir, 'root', '.bashrc'), `export PS1='\\[\\033[01;32m\\]root@${hostname}\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '\nalias ll='ls -la'\n`);
        if (vps?.ssh_key) {
            fs.writeFileSync(path.join(baseDir, 'root', '.ssh', 'authorized_keys'), `${vps.ssh_key}\n`);
        }
    }
    catch (err) {
        console.warn('[Seed VPS Files]', err);
    }
}
// GET /api/vps/:id/files - Browse files in VPS
router.get('/:id/files', authenticate, async (req, res) => {
    const user = req.user;
    const vpsId = String(req.params.id);
    const targetPath = String(req.query.path || '/');
    const vps = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId);
    if (!vps) {
        res.status(404).json({ error: 'VPS not found' });
        return;
    }
    if (user.role !== 'admin' && vps.user_id !== user.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    // Try agent command first if online
    if (wsHub.isNodeOnline(vps.node_id)) {
        try {
            const result = await wsHub.sendCommandToNode(vps.node_id, 'vps_files_list', { id: vps.id, path: targetPath }, 4000);
            if (result && Array.isArray(result.files)) {
                res.json(result);
                return;
            }
        }
        catch { }
    }
    // Fallback to local storage dir
    try {
        const baseDir = getVpsStorageDir(vps.id);
        const sanitizedRel = path.normalize(targetPath).replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
        const fullDirPath = path.join(baseDir, sanitizedRel);
        if (!fs.existsSync(fullDirPath)) {
            res.status(404).json({ error: `Directory not found: ${targetPath}` });
            return;
        }
        const entries = fs.readdirSync(fullDirPath, { withFileTypes: true });
        const files = entries.map((e) => {
            const fullPath = path.join(fullDirPath, e.name);
            let stat = { size: 0, mtime: new Date() };
            try {
                stat = fs.statSync(fullPath);
            }
            catch { }
            const cleanRel = path.join(sanitizedRel, e.name).replace(/\\/g, '/');
            const virtualPath = cleanRel.startsWith('/') ? cleanRel : `/${cleanRel}`;
            return {
                name: e.name,
                path: virtualPath,
                isDir: e.isDirectory(),
                size: stat.size || 0,
                permissions: e.isDirectory() ? '0755' : '0644',
                modifiedAt: stat.mtime?.toISOString() || new Date().toISOString()
            };
        });
        // Sort: directories first, then alphabetical
        files.sort((a, b) => {
            if (a.isDir && !b.isDir)
                return -1;
            if (!a.isDir && b.isDir)
                return 1;
            return a.name.localeCompare(b.name);
        });
        res.json({
            currentPath: targetPath.startsWith('/') ? targetPath : `/${targetPath}`,
            files
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to list files' });
    }
});
// GET /api/vps/:id/files/content - Read file text
router.get('/:id/files/content', authenticate, async (req, res) => {
    const user = req.user;
    const vpsId = String(req.params.id);
    const filePath = String(req.query.path || '');
    const vps = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId);
    if (!vps) {
        res.status(404).json({ error: 'VPS not found' });
        return;
    }
    if (user.role !== 'admin' && vps.user_id !== user.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    try {
        const baseDir = getVpsStorageDir(vps.id);
        const sanitizedRel = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
        const fullFilePath = path.join(baseDir, sanitizedRel);
        if (!fs.existsSync(fullFilePath) || fs.statSync(fullFilePath).isDirectory()) {
            res.status(404).json({ error: `File not found: ${filePath}` });
            return;
        }
        const content = fs.readFileSync(fullFilePath, 'utf8');
        res.json({
            path: filePath,
            content,
            size: Buffer.byteLength(content)
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to read file' });
    }
});
// POST /api/vps/:id/files/content - Save / Create file
router.post('/:id/files/content', authenticate, async (req, res) => {
    const user = req.user;
    const vpsId = String(req.params.id);
    const { path: filePath, content } = req.body;
    if (!filePath) {
        res.status(400).json({ error: 'Path is required' });
        return;
    }
    const vps = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId);
    if (!vps) {
        res.status(404).json({ error: 'VPS not found' });
        return;
    }
    if (user.role !== 'admin' && vps.user_id !== user.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    try {
        const baseDir = getVpsStorageDir(vps.id);
        const sanitizedRel = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
        const fullFilePath = path.join(baseDir, sanitizedRel);
        fs.mkdirSync(path.dirname(fullFilePath), { recursive: true });
        fs.writeFileSync(fullFilePath, content || '', 'utf8');
        res.json({ success: true, path: filePath, size: Buffer.byteLength(content || '') });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to write file' });
    }
});
// DELETE /api/vps/:id/files - Delete file
router.delete('/:id/files', authenticate, async (req, res) => {
    const user = req.user;
    const vpsId = String(req.params.id);
    const filePath = String(req.query.path || '');
    const vps = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId);
    if (!vps) {
        res.status(404).json({ error: 'VPS not found' });
        return;
    }
    if (user.role !== 'admin' && vps.user_id !== user.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    try {
        const baseDir = getVpsStorageDir(vps.id);
        const sanitizedRel = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
        const fullFilePath = path.join(baseDir, sanitizedRel);
        if (fs.existsSync(fullFilePath)) {
            if (fs.statSync(fullFilePath).isDirectory()) {
                fs.rmSync(fullFilePath, { recursive: true, force: true });
            }
            else {
                fs.unlinkSync(fullFilePath);
            }
        }
        res.json({ success: true, path: filePath });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to delete file' });
    }
});
// POST /api/vps/:id/ssh-maker - Generate and inject new SSH Key Pair
router.post('/:id/ssh-maker', authenticate, async (req, res) => {
    const user = req.user;
    const vpsId = String(req.params.id);
    const vps = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId);
    if (!vps) {
        res.status(404).json({ error: 'VPS not found' });
        return;
    }
    if (user.role !== 'admin' && vps.user_id !== user.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    try {
        // Generate 2048-bit RSA key pair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            }
        });
        // Derive OpenSSH RSA public key
        const pubKeyClean = publicKey
            .replace('-----BEGIN RSA PUBLIC KEY-----', '')
            .replace('-----END RSA PUBLIC KEY-----', '')
            .replace(/\r?\n/g, '');
        const openSshPublicKey = `ssh-rsa ${pubKeyClean} client@${vps.hostname || 'cloud-vps'}`;
        const fingerprint = crypto.createHash('sha256').update(pubKeyClean).digest('hex').substring(0, 16);
        // Save to DB
        db.prepare('UPDATE vps_instances SET ssh_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(openSshPublicKey, vps.id);
        // Write to /root/.ssh/authorized_keys
        try {
            const baseDir = getVpsStorageDir(vps.id);
            const authKeysPath = path.join(baseDir, 'root', '.ssh', 'authorized_keys');
            fs.mkdirSync(path.dirname(authKeysPath), { recursive: true });
            fs.appendFileSync(authKeysPath, `\n${openSshPublicKey}\n`);
        }
        catch { }
        // Dispatch key injection to agent if online
        try {
            if (wsHub.isNodeOnline(vps.node_id)) {
                wsHub.sendCommandToNode(vps.node_id, 'vps_inject_ssh_key', { id: vps.id, ssh_key: openSshPublicKey });
            }
        }
        catch { }
        res.json({
            success: true,
            publicKey: openSshPublicKey,
            privateKey,
            fingerprint,
            command: `ssh -i id_rsa.pem root@${vps.ip_address} -p 22`
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to generate SSH key' });
    }
});
// POST /api/vps/:id/reset-password - Update or generate root password
router.post('/:id/reset-password', authenticate, async (req, res) => {
    const user = req.user;
    const vpsId = String(req.params.id);
    const newPass = req.body.password || `Pass_${crypto.randomBytes(6).toString('hex')}!`;
    const vps = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId);
    if (!vps) {
        res.status(404).json({ error: 'VPS not found' });
        return;
    }
    if (user.role !== 'admin' && vps.user_id !== user.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    db.prepare('UPDATE vps_instances SET root_password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newPass, vps.id);
    // Dispatch to agent if online
    try {
        if (wsHub.isNodeOnline(vps.node_id)) {
            wsHub.sendCommandToNode(vps.node_id, 'vps_reset_password', { id: vps.id, root_password: newPass });
        }
    }
    catch { }
    res.json({ success: true, root_password: newPass });
});
export default router;
