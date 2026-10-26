import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';
import { initDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { wsHub } from './ws/hub.js';

import authRoutes from './routes/auth.js';
import nodesRoutes from './routes/nodes.js';
import vpsRoutes from './routes/vps.js';
import ipamRoutes from './routes/ipam.js';
import templatesRoutes from './routes/templates.js';
import statsRoutes from './routes/stats.js';
import logsRoutes from './routes/logs.js';
import installScriptRoutes from './routes/install-script.js';
import licenseRoutes from './routes/license.js';
import settingsRoutes from './routes/settings.js';
import systemRoutes from './routes/system.js';

// 1. Initialize Database & Seed defaults
initDatabase();
seedDatabase();

// 2. Initialize Express
const app = express();
app.set('trust proxy', true); // Enable trust proxy for GitHub Codespaces, Cloudflare, and reverse proxies
app.use(cors({ origin: '*' }));
app.use(express.json());

// 3. Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/vps', vpsRoutes);
app.use('/api/ipam', ipamRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/install-script', installScriptRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/system', systemRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 4. Serve Client static build in production
if (fs.existsSync(config.clientDistPath)) {
  console.log(`[Server] Serving client UI from ${config.clientDistPath}`);
  app.use(express.static(config.clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(config.clientDistPath, 'index.html'));
  });
}

// Process safety handlers
process.on('uncaughtException', (err) => {
  console.error('[Server ERROR] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
});

// 5. Create HTTP & WebSocket Server
const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  wsHub.handleUpgrade(req, socket, head);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server FATAL] Port ${config.port} is already in use by another process!`);
  } else {
    console.error('[Server FATAL] Server failed to start:', err);
  }
  process.exit(1);
});

server.listen(config.port, config.host, () => {
  console.log(`=======================================================`);
  console.log(`  VPS CLIENT CLOUD PANEL CONTROLLER IS RUNNING`);
  console.log(`  HTTP API & UI: http://${config.host}:${config.port}`);
  console.log(`  WebSocket Hub: ws://${config.host}:${config.port}/ws/*`);
  console.log(`=======================================================`);
});
