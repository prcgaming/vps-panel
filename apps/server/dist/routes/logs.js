import { Router } from 'express';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// GET /api/logs - Activity audit log
router.get('/', authenticate, (req, res) => {
    const user = req.user;
    let query = `
    SELECT l.*, u.name as user_name, u.email as user_email
    FROM activity_logs l
    LEFT JOIN users u ON l.user_id = u.id
  `;
    const params = [];
    if (user.role !== 'admin') {
        query += ' WHERE l.user_id = ?';
        params.push(user.id);
    }
    query += ' ORDER BY l.created_at DESC LIMIT 100';
    const logs = db.prepare(query).all(...params);
    res.json({ logs });
});
export default router;
