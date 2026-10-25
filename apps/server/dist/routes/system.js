import { Router } from 'express';
import { spawn } from 'child_process';
import { authenticate, requireAdmin } from '../middleware/auth.js';
const router = Router();
const CURRENT_VERSION = 'v1.3.0';
// GET /api/system/version - Return panel version and system telemetry
router.get('/version', (req, res) => {
    res.json({
        version: CURRENT_VERSION,
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        channel: 'stable',
        platform: process.platform,
        arch: process.arch
    });
});
// POST /api/system/update - Trigger panel update from GitHub main (Admin only)
router.post('/update', authenticate, requireAdmin, (req, res) => {
    try {
        console.log('[System Update] Update initiated by admin...');
        // Run the updater script in detached background process so it survives server restart
        const updater = spawn('/bin/bash', [
            '-c',
            'sleep 1 && curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh | bash -s -- update'
        ], {
            detached: true,
            stdio: 'ignore'
        });
        updater.unref();
        res.json({
            success: true,
            message: 'Panel update started! The server will download the latest release and reload automatically in 5-10 seconds.',
            version: CURRENT_VERSION
        });
    }
    catch (err) {
        console.error('[System Update Error]', err);
        res.status(500).json({ error: err.message || 'Failed to trigger panel update' });
    }
});
export default router;
