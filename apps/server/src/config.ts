import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'vps-panel-super-secret-jwt-key-2026',
  jwtExpiresIn: '7d',
  dbPath: process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'vps_panel.sqlite'),
  clientDistPath: process.env.CLIENT_DIST_PATH || path.resolve(process.cwd(), '../client/dist'),
  isDev: process.env.NODE_ENV !== 'production'
};
