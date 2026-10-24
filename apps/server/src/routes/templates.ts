import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/templates - List OS templates
router.get('/', authenticate, (req: Request, res: Response) => {
  const templates = db.prepare('SELECT * FROM os_templates WHERE is_active = 1 ORDER BY name ASC').all();
  res.json({ templates });
});

// POST /api/templates - Add custom template (Admin only)
router.post('/', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { name, distro, version, image_ref, min_ram_mb = 1024, min_disk_gb = 10, default_user = 'root', icon = 'server' } = req.body;

  if (!name || !image_ref) {
    res.status(400).json({ error: 'Name and image_ref are required' });
    return;
  }

  const id = `tmpl-${Date.now().toString(36)}`;
  db.prepare(`
    INSERT INTO os_templates (id, name, distro, version, image_ref, min_ram_mb, min_disk_gb, default_user, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, distro || name, version || 'latest', image_ref, min_ram_mb, min_disk_gb, default_user, icon);

  const created = db.prepare('SELECT * FROM os_templates WHERE id = ?').get(id);
  res.status(201).json({ template: created });
});

export default router;
