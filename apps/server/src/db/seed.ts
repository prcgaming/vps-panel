import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, initDatabase } from './index.js';

export function seedDatabase() {
  initDatabase();

  // 1. Seed Users
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

    console.log(`[Seed] Users created: ${adminEmail} (${adminPassword}), user@vpspanel.local (user123)`);
  }

  // 2. Seed OS Templates
  const templateCount = (db.prepare('SELECT COUNT(*) as c FROM os_templates').get() as { c: number }).c;
  if (templateCount === 0) {
    const templates = [
      {
        id: 'tmpl-ubuntu-2404',
        name: 'Ubuntu 24.04 LTS',
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
        name: 'Ubuntu 22.04 LTS',
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
        name: 'Alpine Linux 3.20',
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
        name: 'Rocky Linux 9',
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
        name: 'Arch Linux (Rolling)',
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
    console.log('[Seed] OS Templates populated');
  }

  // 3. Seed IP Pool
  const poolCount = (db.prepare('SELECT COUNT(*) as c FROM ip_pools').get() as { c: number }).c;
  if (poolCount === 0) {
    const poolId = 'pool-public-1';
    db.prepare(`
      INSERT INTO ip_pools (id, name, subnet, gateway, netmask, dns, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(poolId, 'Primary Public IPv4 Pool', '198.51.100.0/24', '198.51.100.1', '255.255.255.0', '1.1.1.1, 8.8.8.8', 'public_ipv4');

    const insertIp = db.prepare(`
      INSERT INTO ip_allocations (id, pool_id, ip_address, is_reserved)
      VALUES (?, ?, ?, ?)
    `);

    // Pre-populate pool with 10 usable IPs
    for (let i = 10; i <= 25; i++) {
      insertIp.run(`ip-${i}`, poolId, `198.51.100.${i}`, 0);
    }
    console.log('[Seed] IP Pool and Subnet allocations created');
  }

  // 4. Seed Initial Node
  const nodeCount = (db.prepare('SELECT COUNT(*) as c FROM nodes').get() as { c: number }).c;
  if (nodeCount === 0) {
    db.prepare(`
      INSERT INTO nodes (id, name, hostname, ip_address, port, auth_token, status, driver, cpu_cores, ram_total, disk_total, vps_count, is_drained)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'node-eu-central-1',
      'Node-01-Frankfurt',
      'fra-hv-01.vpspanel.local',
      '198.51.100.2',
      4001,
      'token-node-eu-01-secret',
      'online',
      'docker',
      16,
      32768,
      500,
      1,
      0
    );

    db.prepare(`
      INSERT INTO nodes (id, name, hostname, ip_address, port, auth_token, status, driver, cpu_cores, ram_total, disk_total, vps_count, is_drained)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'node-us-east-1',
      'Node-02-NewYork',
      'nyc-hv-02.vpspanel.local',
      '198.51.100.3',
      4001,
      'token-node-us-01-secret',
      'online',
      'kvm',
      32,
      65536,
      1000,
      0,
      0
    );

    // Seed a demo running VPS
    db.prepare(`
      INSERT INTO vps_instances (id, name, hostname, node_id, user_id, status, os_image, cpu_cores, ram_mb, disk_gb, ip_address, gateway, root_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'vps-demo-prod',
      'web-server-prod',
      'web01.example.com',
      'node-eu-central-1',
      'user-admin-root',
      'running',
      'ubuntu:24.04',
      2,
      2048,
      40,
      '198.51.100.10',
      '198.51.100.1',
      'RootSecret2026!'
    );

    // Mark IP as allocated
    db.prepare(`UPDATE ip_allocations SET vps_id = ? WHERE ip_address = '198.51.100.10'`).run('vps-demo-prod');

    // Add activity log
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      'user-admin-root',
      'cluster_initialized',
      'cluster',
      'cluster-root',
      'Cluster initialized with default templates and Frankfurt/New York nodes',
      '127.0.0.1'
    );

    console.log('[Seed] Multi-node cluster and initial VPS instance seeded');
  }
}

// Allow standalone running
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
  console.log('[Seed] Seeding completed successfully!');
}
