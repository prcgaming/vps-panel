import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { wsHub } from '../ws/hub.js';

const router = Router();

// GET /api/nodes - List all nodes in cluster
router.get('/', authenticate, (req: Request, res: Response) => {
  const nodes = db.prepare(`
    SELECT n.*, 
      (SELECT COUNT(*) FROM vps_instances v WHERE v.node_id = n.id) as current_vps_count,
      (SELECT COALESCE(SUM(v.cpu_cores), 0) FROM vps_instances v WHERE v.node_id = n.id) as allocated_cpu,
      (SELECT COALESCE(SUM(v.ram_mb), 0) FROM vps_instances v WHERE v.node_id = n.id) as allocated_ram,
      (SELECT COALESCE(SUM(v.disk_gb), 0) FROM vps_instances v WHERE v.node_id = n.id) as allocated_disk
    FROM nodes n
    ORDER BY n.created_at DESC
  `).all() as any[];

  // Update dynamic status if live socket is connected
  const mapped = nodes.map(node => ({
    ...node,
    is_live: wsHub.isNodeOnline(node.id),
    status: wsHub.isNodeOnline(node.id) ? 'online' : node.status
  }));

  res.json({ nodes: mapped });
});

// POST /api/nodes/join-token - Generate a new node join token (Admin only)
router.post('/join-token', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { name = 'Worker-Node' } = req.body;
  const token = `node-join-${uuidv4().replace(/-/g, '')}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  db.prepare(`
    INSERT INTO node_join_tokens (token, name, expires_at)
    VALUES (?, ?, ?)
  `).run(token, name, expiresAt);

  const host = req.headers['x-forwarded-host'] || req.get('host') || '127.0.0.1:4000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const panelUrl = `${protocol}://${host}`;
  const curlCommand = `curl -sSL ${panelUrl}/api/install-script | bash -s -- --panel-url ${panelUrl} --token ${token} --driver docker`;

  res.json({
    token,
    name,
    expires_at: expiresAt,
    curl_command: curlCommand,
    panel_url: panelUrl
  });
});

// GET /api/nodes/:id - Node details & its hosted VPS instances
router.get('/:id', authenticate, (req: Request, res: Response) => {
  const nodeId = String(req.params.id);
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(nodeId) as any;
  if (!node) {
    res.status(404).json({ error: 'Node not found' });
    return;
  }

  const vpsList = db.prepare(`
    SELECT v.*, u.name as owner_name, u.email as owner_email
    FROM vps_instances v
    LEFT JOIN users u ON v.user_id = u.id
    WHERE v.node_id = ?
    ORDER BY v.created_at DESC
  `).all(nodeId);

  res.json({
    node: {
      ...node,
      is_live: wsHub.isNodeOnline(node.id)
    },
    instances: vpsList
  });
});

// PATCH /api/nodes/:id/drain - Toggle node drain status
router.patch('/:id/drain', authenticate, requireAdmin, (req: Request, res: Response) => {
  const nodeId = String(req.params.id);
  const node = db.prepare('SELECT id, is_drained FROM nodes WHERE id = ?').get(nodeId) as any;
  if (!node) {
    res.status(404).json({ error: 'Node not found' });
    return;
  }

  const newStatus = node.is_drained ? 0 : 1;
  db.prepare('UPDATE nodes SET is_drained = ? WHERE id = ?').run(newStatus, nodeId);

  res.json({ id: nodeId, is_drained: newStatus });
});

// DELETE /api/nodes/:id - Delete node
router.delete('/:id', authenticate, requireAdmin, (req: Request, res: Response) => {
  const nodeId = String(req.params.id);
  const vpsCount = (db.prepare('SELECT COUNT(*) as c FROM vps_instances WHERE node_id = ?').get(nodeId) as any).c;
  if (vpsCount > 0) {
    res.status(400).json({ error: `Cannot remove node. There are ${vpsCount} active VPS instances assigned to it. Migrate or delete them first.` });
    return;
  }

  db.prepare('DELETE FROM nodes WHERE id = ?').run(nodeId);
  res.json({ success: true, message: 'Node deleted successfully' });
});

export default router;
