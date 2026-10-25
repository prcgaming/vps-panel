import { Router } from 'express';
import { db } from '../db/index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
const router = Router();
// GET /api/settings - Retrieve panel settings & branding
router.get('/', (req, res) => {
    try {
        const rows = db.prepare('SELECT key, value FROM system_settings').all();
        const settings = {};
        for (const row of rows) {
            settings[row.key] = row.value;
        }
        res.json({ settings });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch settings' });
    }
});
// PUT /api/settings - Update panel settings (Admin only)
router.put('/', authenticate, requireAdmin, (req, res) => {
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
        res.json({ message: 'Settings saved successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to update settings' });
    }
});
export default router;
