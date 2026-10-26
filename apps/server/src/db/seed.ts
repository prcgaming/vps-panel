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

  // 2. Seed Standard OS Templates (HVM, Windows, Desktop GUI & Custom ISO)
  const templateCount = (db.prepare('SELECT COUNT(*) as c FROM os_templates').get() as { c: number }).c;
  if (templateCount === 0) {
    const templates = [
      // Linux Server HVM
      {
        id: 'tmpl-ubuntu-2404-hvm',
        name: 'Ubuntu 24.04 LTS (HVM - Full KVM Virtualization)',
        distro: 'Ubuntu',
        version: '24.04',
        image_ref: 'ubuntu:24.04',
        virt_type: 'hvm',
        os_type: 'linux',
        iso_url: null,
        min_ram_mb: 1024,
        min_disk_gb: 15,
        default_user: 'root',
        icon: 'ubuntu'
      },
      {
        id: 'tmpl-debian-12-hvm',
        name: 'Debian 12 Bookworm (HVM - Full KVM Virtualization)',
        distro: 'Debian',
        version: '12',
        image_ref: 'debian:12',
        virt_type: 'hvm',
        os_type: 'linux',
        iso_url: null,
        min_ram_mb: 512,
        min_disk_gb: 10,
        default_user: 'root',
        icon: 'debian'
      },
      {
        id: 'tmpl-alpine-320-hvm',
        name: 'Alpine Linux 3.20 (HVM - Ultra Fast & Secure)',
        distro: 'Alpine',
        version: '3.20',
        image_ref: 'alpine:3.20',
        virt_type: 'hvm',
        os_type: 'linux',
        iso_url: null,
        min_ram_mb: 256,
        min_disk_gb: 5,
        default_user: 'root',
        icon: 'alpine'
      },
      {
        id: 'tmpl-arch-hvm',
        name: 'Arch Linux (HVM - Rolling Release KVM)',
        distro: 'Arch',
        version: 'latest',
        image_ref: 'archlinux:latest',
        virt_type: 'hvm',
        os_type: 'linux',
        iso_url: null,
        min_ram_mb: 1024,
        min_disk_gb: 15,
        default_user: 'root',
        icon: 'arch'
      },

      // Windows OS Virtual Machines
      {
        id: 'tmpl-win-2022',
        name: 'Windows Server 2022 Datacenter (HVM + Web VNC)',
        distro: 'Windows',
        version: '2022',
        image_ref: 'windows:2022-datacenter',
        virt_type: 'hvm',
        os_type: 'windows',
        iso_url: null,
        min_ram_mb: 4096,
        min_disk_gb: 40,
        default_user: 'Administrator',
        icon: 'windows'
      },
      {
        id: 'tmpl-win-2019',
        name: 'Windows Server 2019 Standard (HVM + Web VNC)',
        distro: 'Windows',
        version: '2019',
        image_ref: 'windows:2019-standard',
        virt_type: 'hvm',
        os_type: 'windows',
        iso_url: null,
        min_ram_mb: 4096,
        min_disk_gb: 40,
        default_user: 'Administrator',
        icon: 'windows'
      },
      {
        id: 'tmpl-win-11',
        name: 'Windows 11 Pro Virtual Desktop (HVM + Web VNC)',
        distro: 'Windows',
        version: '11',
        image_ref: 'windows:11-pro',
        virt_type: 'hvm',
        os_type: 'windows',
        iso_url: null,
        min_ram_mb: 4096,
        min_disk_gb: 50,
        default_user: 'Administrator',
        icon: 'windows'
      },

      // Graphical Desktop Interface Linux
      {
        id: 'tmpl-ubuntu-desktop',
        name: 'Ubuntu 24.04 Desktop GUI (XFCE + Web VNC Interface)',
        distro: 'Ubuntu Desktop',
        version: '24.04-gui',
        image_ref: 'ubuntu-desktop:24.04',
        virt_type: 'hvm',
        os_type: 'gui_desktop',
        iso_url: null,
        min_ram_mb: 2048,
        min_disk_gb: 25,
        default_user: 'desktop',
        icon: 'monitor'
      },
      {
        id: 'tmpl-debian-desktop',
        name: 'Debian 12 Desktop GUI (XFCE + Web VNC Interface)',
        distro: 'Debian Desktop',
        version: '12-gui',
        image_ref: 'debian-desktop:12',
        virt_type: 'hvm',
        os_type: 'gui_desktop',
        iso_url: null,
        min_ram_mb: 2048,
        min_disk_gb: 20,
        default_user: 'desktop',
        icon: 'monitor'
      },

      // Custom ISO Installation Mode
      {
        id: 'tmpl-custom-iso',
        name: 'Custom ISO Boot (Mount & Install Your Own OS via VNC)',
        distro: 'Custom ISO',
        version: 'custom',
        image_ref: 'custom-iso:boot',
        virt_type: 'hvm',
        os_type: 'custom_iso',
        iso_url: '',
        min_ram_mb: 1024,
        min_disk_gb: 20,
        default_user: 'root',
        icon: 'disc'
      },

      // Containers
      {
        id: 'tmpl-ubuntu-2404-container',
        name: 'Ubuntu 24.04 (LXC / System Container)',
        distro: 'Ubuntu',
        version: '24.04',
        image_ref: 'ubuntu:24.04',
        virt_type: 'container',
        os_type: 'linux',
        iso_url: null,
        min_ram_mb: 512,
        min_disk_gb: 10,
        default_user: 'root',
        icon: 'ubuntu'
      },
      {
        id: 'tmpl-alpine-container',
        name: 'Alpine 3.20 (LXC / Micro Container)',
        distro: 'Alpine',
        version: '3.20',
        image_ref: 'alpine:3.20',
        virt_type: 'container',
        os_type: 'linux',
        iso_url: null,
        min_ram_mb: 256,
        min_disk_gb: 5,
        default_user: 'root',
        icon: 'alpine'
      }
    ];

    const insertTemplate = db.prepare(`
      INSERT INTO os_templates (id, name, distro, version, image_ref, virt_type, os_type, iso_url, min_ram_mb, min_disk_gb, default_user, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of templates) {
      insertTemplate.run(t.id, t.name, t.distro, t.version, t.image_ref, t.virt_type, t.os_type, t.iso_url, t.min_ram_mb, t.min_disk_gb, t.default_user, t.icon);
    }
    console.log('[Seed] HVM, Windows, Desktop GUI & Custom ISO Templates seeded successfully');
  } else {
    try {
      db.exec("UPDATE os_templates SET virt_type = 'hvm' WHERE virt_type IS NULL OR virt_type = '';");
      db.exec("UPDATE os_templates SET os_type = 'windows' WHERE image_ref LIKE '%windows%' OR name LIKE '%Windows%';");
      db.exec("UPDATE os_templates SET os_type = 'custom_iso' WHERE id = 'tmpl-custom-iso' OR image_ref LIKE '%custom-iso%';");
      db.exec("UPDATE os_templates SET os_type = 'linux' WHERE os_type IS NULL OR os_type = '';");
    } catch (e) {}
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
    const selectedDriver = process.env.DRIVER || 'kvm';

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
    default_driver: process.env.DRIVER || 'kvm',
    welcome_message: 'Welcome to Lunar HVM Cloud VPS Control Panel',
    allow_registration: '1',
    allow_user_create_vps: '1',
    allow_user_manage_power: '1',
    max_vps_per_user: '5',
    panel_logo_url: ''
  };

  for (const [key, val] of Object.entries(defaultSettings)) {
    db.prepare(`
      INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)
    `).run(key, val);
  }

  // 6. Permanent Free & Unlimited License (No License Restrictions)
  db.prepare(`
    INSERT OR REPLACE INTO license_info (id, license_key, plan_type, status, activated_at, expires_at, max_nodes, max_vps, registered_to)
    VALUES ('active_license', 'OPEN-COMMUNITY-UNLIMITED', 'lifetime', 'active', CURRENT_TIMESTAMP, NULL, -1, -1, 'Open Community Edition')
  `).run();
}

// Allow standalone running
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
  console.log('[Seed] Seeding completed successfully!');
}
