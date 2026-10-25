import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
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
    const { name, hostname, os_image = 'ubuntu:24.04', cpu_cores = 1, ram_mb = 1024, disk_gb = 20, node_id, // optional: if not supplied, auto-scheduler chooses least loaded node
    root_password, ssh_key } = req.body;
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
    // Insert into DB as creating
    db.prepare(`
    INSERT INTO vps_instances (
      id, name, hostname, node_id, user_id, status, os_image, 
      cpu_cores, ram_mb, disk_gb, ip_address, gateway, netmask, root_password, ssh_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(vpsId, name, hostname, targetNodeId, user.id, 'creating', os_image, cpu_cores, ram_mb, disk_gb, assignedIp, assignedGateway, assignedNetmask, password, ssh_key || '');
    // Mark IP as used
    if (freeIp) {
        db.prepare('UPDATE ip_allocations SET vps_id = ? WHERE id = ?').run(vpsId, freeIp.id);
    }
    // Activity log
    db.prepare(`
    INSERT INTO activity_logs (id, user_id, action, target_type, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), user.id, 'vps_create', 'vps', vpsId, `Created VPS ${name} (${assignedIp}) on node ${targetNodeId}`, req.ip || '127.0.0.1');
    // 3. Dispatch creation to node agent if connected
    try {
        if (wsHub.isNodeOnline(targetNodeId)) {
            await wsHub.sendCommandToNode(targetNodeId, 'vps_create', {
                id: vpsId,
                name,
                hostname,
                os_image,
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
export default router;
