import bcrypt from 'bcryptjs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { db, initDatabase } from './index.js';

export function seedDatabase() {
  initDatabase();

  // 1. Seed Users (Super Admin & Demo Client)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@vpspanel.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const adminPass = bcrypt.hashSync(adminPassword, 10);
    const userPass = bcrypt.hashSync('user123', 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name)
      VALUES (?, ?, ?, ?, ?)
    `).run('user-admin-root', adminEmail, adminPass, 'admin', 'Super Admin');

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name)
      VALUES (?, ?, ?, ?, ?)
    `).run('user-demo-client', 'user@vpspanel.local', userPass, 'user', 'Client User');

    console.log(`[Seed] Super Admin user created: ${adminEmail}`);
  }

  // 2. Seed Standard OS Templates (Docker & Hypervisor base images)
  const templateCount = (db.prepare('SELECT COUNT(*) as c FROM os_templates').get() as { c: number }).c;
  if (templateCount === 0) {
    const templates = [
      {
        id: 'tmpl-ubuntu-2404',
        name: 'Ubuntu 24.04 LTS (Noble)',
        distro: 'Ubuntu',
        version: '24.04',
        image_ref: 'ubuntu:24.04',
        min_ram_mb: 1024,
        min_disk_gb: 15,
        default_user: 'root',
        icon: 'ubuntu'
      },
      {
        id: 'tmpl-ubuntu-2204',
        name: 'Ubuntu 22.04 LTS (Jammy)',
        distro: 'Ubuntu',
        version: '22.04',
        image_ref: 'ubuntu:22.04',
        min_ram_mb: 1024,
        min_disk_gb: 10,
        default_user: 'root',
        icon: 'ubuntu'
      },
      {
        id: 'tmpl-debian-12',
        name: 'Debian 12 (Bookworm)',
        distro: 'Debian',
        version: '12',
        image_ref: 'debian:12-slim',
        min_ram_mb: 512,
        min_disk_gb: 10,
        default_user: 'root',
        icon: 'debian'
      },
      {
        id: 'tmpl-alpine-320',
        name: 'Alpine Linux 3.20 (Ultra Lightweight)',
        distro: 'Alpine',
        version: '3.20',
        image_ref: 'alpine:3.20',
        min_ram_mb: 256,
        min_disk_gb: 5,
        default_user: 'root',
        icon: 'alpine'
      },
      {
        id: 'tmpl-rocky-9',
        name: 'Rocky Linux 9 (Enterprise RHEL)',
        distro: 'Rocky',
        version: '9',
        image_ref: 'rockylinux:9',
        min_ram_mb: 1024,
        min_disk_gb: 20,
        default_user: 'root',
        icon: 'rocky'
      },
      {
        id: 'tmpl-arch',
        name: 'Arch Linux (Rolling Release)',
        distro: 'Arch',
        version: 'latest',
        image_ref: 'archlinux:latest',
        min_ram_mb: 1024,
        min_disk_gb: 15,
        default_user: 'root',
        icon: 'arch'
      }
    ];

    const insertTemplate = db.prepare(`
      INSERT INTO os_templates (id, name, distro, version, image_ref, min_ram_mb, min_disk_gb, default_user, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of templates) {
      insertTemplate.run(t.id, t.name, t.distro, t.version, t.image_ref, t.min_ram_mb, t.min_disk_gb, t.default_user, t.icon);
    }
    console.log('[Seed] OS Templates seeded successfully');
  }

  // 3. Seed IPAM Default Pool & Allocations
  const poolCount = (db.prepare('SELECT COUNT(*) as c FROM ip_pools').get() as { c: number }).c;
  if (poolCount === 0) {
    const poolId = 'pool-default-ipv4';
    db.prepare(`
      INSERT INTO ip_pools (id, name, subnet, gateway, netmask, dns, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      poolId,
      'Default Public Pool',
      '10.0.0.0/24',
      '10.0.0.1',
      '255.255.255.0',
      '1.1.1.1, 8.8.8.8',
      'public_ipv4'
    );

    const insertIp = db.prepare(`
      INSERT INTO ip_allocations (id, pool_id, ip_address, is_reserved)
      VALUES (?, ?, ?, ?)
    `);

    // Pre-populate pool with usable IPs
    for (let i = 10; i <= 50; i++) {
      insertIp.run(`ip-${i}`, poolId, `10.0.0.${i}`, 0);
    }
    console.log('[Seed] IP Pool (10.0.0.0/24) created with 41 usable IP allocations');
  }

  // 4. Seed Real Local Host Node (No fake Frankfurt or New York dummy nodes!)
  const nodeCount = (db.prepare('SELECT COUNT(*) as c FROM nodes').get() as { c: number }).c;
  if (nodeCount === 0) {
    const hostCpuCount = os.cpus()?.length || 4;
    const hostRamTotalMb = Math.round(os.totalmem() / (1024 * 1024)) || 8192;
    const hostName = os.hostname() || 'master-node';
    const localToken = process.env.NODE_TOKEN || 'local-node-master-token';
    const serverPublicIp = process.env.PUBLIC_IP || '127.0.0.1';
    const selectedDriver = process.env.DRIVER || 'docker';

    db.prepare(`
      INSERT INTO nodes (id, name, hostname, ip_address, port, auth_token, status, driver, cpu_cores, ram_total, disk_total, vps_count, is_drained)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'node-local-master',
      `Master-Node (${hostName})`,
      hostName,
      serverPublicIp,
      4001,
      localToken,
      'online',
      selectedDriver,
      hostCpuCount,
      hostRamTotalMb,
      100,
      0,
      0
    );

    db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      'user-admin-root',
      'cluster_initialized',
      'cluster',
      'cluster-root',
      `Cluster initialized with real Local Node (${hostName}, ${hostCpuCount} vCPU, ${hostRamTotalMb}MB RAM)`,
      '127.0.0.1'
    );

    console.log(`[Seed] Real Local Node registered: Master-Node (${hostName}) [${hostCpuCount} Cores, ${hostRamTotalMb}MB RAM]`);
  }

  // 5. Seed System Settings & Branding with Theme Presets
  const defaultSettings: Record<string, string> = {
    panel_name: process.env.PANEL_NAME || 'Lunar VPS Panel',
    company_name: process.env.COMPANY_NAME || 'Lunar Cloud Infrastructure',
    support_url: process.env.SUPPORT_URL || 'https://vps.lunars.indevs.in',
    primary_color: process.env.PRIMARY_COLOR || '#06b6d4',
    theme_preset: process.env.THEME_PRESET || 'cyber-cyan',
    default_driver: process.env.DRIVER || 'docker',
    welcome_message: 'Welcome to Lunar Multi-Node VPS Control Panel',
    allow_registration: '1',
    allow_user_create_vps: '1',
    allow_user_manage_power: '1',
    max_vps_per_user: '2',
    panel_logo_url: ''
  };

  for (const [key, val] of Object.entries(defaultSettings)) {
    db.prepare(`
      INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)
    `).run(key, val);
  }

  // 6. Seed Initial License Key
  const activeLicense = db.prepare('SELECT id FROM license_info WHERE id = ?').get('active_license');
  if (!activeLicense) {
    const initialKey = process.env.LICENSE_KEY || 'LUNAR-30DAY-PRO-UNLIMITED';
    const isLifetime = initialKey.includes('LIFETIME') || initialKey.startsWith('LIFE-');
    const now = new Date();
    const expiresAt = isLifetime ? null : new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();

    db.prepare(`
      INSERT INTO license_info (id, license_key, plan_type, status, activated_at, expires_at, max_nodes, max_vps, registered_to)
      VALUES ('active_license', ?, ?, 'active', ?, ?, -1, -1, 'Lunar Administrator')
    `).run(initialKey, isLifetime ? 'lifetime' : 'trial_30d', now.toISOString(), expiresAt);

    console.log(`[Seed] License activated: ${initialKey} (${isLifetime ? 'Lifetime' : '30 Days'})`);
  }
}

// Allow standalone running
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
  console.log('[Seed] Seeding completed successfully!');
}
