import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
let DatabaseSyncClass;
try {
    const sqlite = await import('node:sqlite');
    DatabaseSyncClass = sqlite.DatabaseSync;
}
catch (err) {
    console.error('================================================================');
    console.error('[CRITICAL] Node.js built-in SQLite engine is not available!');
    console.error(`Current Node.js version: ${process.version}`);
    console.error('VPS Panel requires Node.js >= 22.5.0 LTS.');
    console.error('Please upgrade Node.js via:');
    console.error('  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs');
    console.error('================================================================');
    process.exit(1);
}
// Ensure data folder exists
const dir = path.dirname(config.dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}
export const db = new DatabaseSyncClass(config.dbPath);
// Enable WAL mode and foreign keys for high performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);
export function initDatabase() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hostname TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 4001,
      auth_token TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'offline',
      driver TEXT NOT NULL DEFAULT 'docker',
      cpu_cores INTEGER NOT NULL DEFAULT 4,
      ram_total INTEGER NOT NULL DEFAULT 8192,
      disk_total INTEGER NOT NULL DEFAULT 100,
      vps_count INTEGER NOT NULL DEFAULT 0,
      is_drained INTEGER NOT NULL DEFAULT 0,
      last_heartbeat DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS node_join_tokens (
      token TEXT PRIMARY KEY,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS os_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      distro TEXT NOT NULL,
      version TEXT NOT NULL,
      image_ref TEXT NOT NULL,
      virt_type TEXT NOT NULL DEFAULT 'hvm',
      min_ram_mb INTEGER NOT NULL DEFAULT 1024,
      min_disk_gb INTEGER NOT NULL DEFAULT 10,
      default_user TEXT NOT NULL DEFAULT 'root',
      icon TEXT DEFAULT 'server',
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ip_pools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subnet TEXT NOT NULL,
      gateway TEXT NOT NULL,
      netmask TEXT NOT NULL DEFAULT '255.255.255.0',
      dns TEXT NOT NULL DEFAULT '1.1.1.1, 8.8.8.8',
      type TEXT NOT NULL DEFAULT 'public_ipv4',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ip_allocations (
      id TEXT PRIMARY KEY,
      pool_id TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      vps_id TEXT,
      is_reserved INTEGER DEFAULT 0,
      allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES ip_pools(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vps_instances (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hostname TEXT NOT NULL,
      node_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'creating',
      virt_type TEXT NOT NULL DEFAULT 'hvm',
      os_image TEXT NOT NULL,
      cpu_cores INTEGER NOT NULL DEFAULT 1,
      ram_mb INTEGER NOT NULL DEFAULT 1024,
      disk_gb INTEGER NOT NULL DEFAULT 20,
      ip_address TEXT,
      gateway TEXT,
      netmask TEXT DEFAULT '255.255.255.0',
      root_password TEXT,
      ssh_key TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (node_id) REFERENCES nodes(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS license_info (
      id TEXT PRIMARY KEY,
      license_key TEXT NOT NULL,
      plan_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      activated_at DATETIME NOT NULL,
      expires_at DATETIME,
      max_nodes INTEGER NOT NULL DEFAULT -1,
      max_vps INTEGER NOT NULL DEFAULT -1,
      registered_to TEXT DEFAULT 'Lunar Administrator'
    );

    CREATE INDEX IF NOT EXISTS idx_vps_node ON vps_instances(node_id);
    CREATE INDEX IF NOT EXISTS idx_vps_user ON vps_instances(user_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
  `);
    // Non-destructive migrations for existing databases
    try {
        db.exec("ALTER TABLE vps_instances ADD COLUMN virt_type TEXT NOT NULL DEFAULT 'hvm';");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE os_templates ADD COLUMN virt_type TEXT NOT NULL DEFAULT 'hvm';");
    }
    catch (e) { }
}
