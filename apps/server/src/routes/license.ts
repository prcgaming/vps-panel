import { Router, Request, Response } from 'express';
import { getLicenseStatus, activateLicense } from '../license/service.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/license/status - Public or authenticated: check license health & remaining days
router.get('/status', (req: Request, res: Response) => {
  const status = getLicenseStatus();
  res.json(status);
});

// POST /api/license/activate - Activate or update license key
router.post('/activate', (req: Request, res: Response) => {
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
