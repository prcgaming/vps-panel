import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../db/index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to write updated web settings directly to all web portal directories
function syncWebSettingsOnDisk(incoming?: Record<string, any>) {
  try {
    const rows = db.prepare('SELECT key, value FROM system_settings').all() as { key: string; value: string }[];
    const allSettings: Record<string, string> = {};
    for (const row of rows) {
      allSettings[row.key] = row.value;
    }
    if (incoming) {
      Object.assign(allSettings, incoming);
    }

    const payload = JSON.stringify({ settings: allSettings }, null, 2);
    const configPayload = JSON.stringify({
      panelUrl: allSettings.support_url || 'https://vps.lunars.indevs.in',
      brandName: allSettings.panel_name || 'Lunar Client Cloud',
      companyName: allSettings.company_name || 'Lunar Cloud Infrastructure',
      supportUrl: allSettings.support_url || 'https://vps.lunars.indevs.in',
      primaryColor: allSettings.primary_color || '#06b6d4'
    }, null, 2);

    const targetDirs = [
      path.resolve(process.cwd(), '../web'),
      path.resolve(process.cwd(), 'apps/web'),
      path.resolve(__dirname, '../../web'),
      path.resolve(__dirname, '../../../apps/web'),
      '/var/www/vps-panel-web',
      '/opt/vps-panel/apps/web'
    ];

    for (const dir of targetDirs) {
      try {
        if (fs.existsSync(dir)) {
          fs.writeFileSync(path.join(dir, 'settings.json'), payload, 'utf8');
          fs.writeFileSync(path.join(dir, 'config.json'), configPayload, 'utf8');
        }
      } catch {}
    }
  } catch (e) {
    console.error('Error syncing web settings on disk:', e);
  }
}

// Initial disk sync on start
try {
  syncWebSettingsOnDisk();
} catch {}

// GET /api/settings - Retrieve panel settings & branding
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT key, value FROM system_settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update panel settings (Admin only)
router.put('/', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    res.status(400).json({ error: 'Settings object is required' });
    return;
  }

  try {
    const upsertStmt = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);

    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string' || typeof value === 'number') {
        upsertStmt.run(key, String(value));
      }
    }

    // Sync latest web settings directly to static files on disk
    syncWebSettingsOnDisk(settings);

    res.json({ message: 'Settings saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update settings' });
  }
});

export default router;
