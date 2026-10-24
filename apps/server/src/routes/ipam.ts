import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/ipam - List all IP pools and allocations
router.get('/', authenticate, (req: Request, res: Response) => {
  const pools = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM ip_allocations a WHERE a.pool_id = p.id) as total_ips,
      (SELECT COUNT(*) FROM ip_allocations a WHERE a.pool_id = p.id AND a.vps_id IS NOT NULL) as used_ips
    FROM ip_pools p
    ORDER BY p.created_at DESC
  `).all();

  const allocations = db.prepare(`
    SELECT a.*, v.name as vps_name, v.hostname as vps_hostname
    FROM ip_allocations a
    LEFT JOIN vps_instances v ON a.vps_id = v.id
    ORDER BY a.ip_address ASC
  `).all();

  res.json({ pools, allocations });
});

// POST /api/ipam/pools - Create new IP Pool (Admin only)
router.post('/pools', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { name, subnet, gateway, netmask = '255.255.255.0', dns = '1.1.1.1, 8.8.8.8', type = 'public_ipv4', start_ip, end_ip } = req.body;

  if (!name || !subnet || !gateway) {
    res.status(400).json({ error: 'Name, subnet, and gateway are required' });
    return;
  }

  const poolId = `pool-${Date.now().toString(36)}`;
  db.prepare(`
    INSERT INTO ip_pools (id, name, subnet, gateway, netmask, dns, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(poolId, name, subnet, gateway, netmask, dns, type);

  // Generate range of IPs if start_ip and end_ip provided
  if (start_ip && end_ip) {
    const basePrefix = start_ip.substring(0, start_ip.lastIndexOf('.') + 1);
    const startNum = parseInt(start_ip.substring(start_ip.lastIndexOf('.') + 1), 10);
    const endNum = parseInt(end_ip.substring(end_ip.lastIndexOf('.') + 1), 10);

    const insertIp = db.prepare(`
      INSERT INTO ip_allocations (id, pool_id, ip_address, is_reserved)
      VALUES (?, ?, ?, 0)
    `);

    for (let i = startNum; i <= endNum; i++) {
      insertIp.run(uuidv4(), poolId, `${basePrefix}${i}`);
    }
  }

  res.status(201).json({ success: true, poolId });
});

export default router;
