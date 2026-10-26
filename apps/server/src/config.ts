import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findClientDist(): string {
  if (process.env.CLIENT_DIST_PATH && fs.existsSync(process.env.CLIENT_DIST_PATH)) {
    return process.env.CLIENT_DIST_PATH;
  }
  const candidates = [
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'apps/client/dist'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../../../client/dist'),
    '/opt/vps-panel/apps/client/dist'
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.resolve(process.cwd(), '../client/dist');
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'vps-panel-super-secret-jwt-key-2026',
  jwtExpiresIn: '7d',
  dbPath: process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'vps_panel.sqlite'),
  clientDistPath: findClientDist(),
  isDev: process.env.NODE_ENV !== 'production'
};
