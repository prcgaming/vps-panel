import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { config } from '../config.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: 7 * 24 * 3600 }
  );

  // Log activity
  db.prepare(`
    INSERT INTO activity_logs (id, user_id, action, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), user.id, 'login', `User ${user.email} logged in`, req.ip || '127.0.0.1');

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      created_at: user.created_at
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: Request, res: Response) => {
  const user = db.prepare('SELECT id, email, role, name, created_at FROM users WHERE id = ?').get(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

// GET /api/auth/users (admin only)
router.get('/users', authenticate, requireAdmin, (req: Request, res: Response) => {
  const users = db.prepare('SELECT id, email, role, name, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

// POST /api/auth/users (admin only)
router.post('/users', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { email, password, name, role = 'user' } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'User with this email already exists' });
    return;
  }

  const id = `user-${Date.now().toString(36)}`;
  const hash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, email, hash, role, name);

  res.status(201).json({
    user: { id, email, name, role }
  });
});

export default router;
