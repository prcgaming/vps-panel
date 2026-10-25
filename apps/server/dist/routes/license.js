import { Router } from 'express';
import { getLicenseStatus, activateLicense } from '../license/service.js';
const router = Router();
// GET /api/license/status - Public or authenticated: check license health & remaining days
router.get('/status', (req, res) => {
    const status = getLicenseStatus();
    res.json(status);
});
// POST /api/license/activate - Activate or update license key
router.post('/activate', (req, res) => {
    const { licenseKey, registeredTo } = req.body;
    if (!licenseKey) {
        res.status(400).json({ error: 'License key is required' });
        return;
    }
    const result = activateLicense(licenseKey, registeredTo || 'Lunar Administrator');
    if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
    }
    res.json({
        message: result.message,
        status: result.status
    });
});
export default router;
