export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export interface Node {
  id: string;
  name: string;
  hostname: string;
  ip_address: string;
  port: number;
  auth_token: string;
  status: 'online' | 'offline' | 'degraded';
  driver: 'docker' | 'kvm' | 'mock';
  cpu_cores: number;
  ram_total: number;
  disk_total: number;
  vps_count: number;
  current_vps_count?: number;
  allocated_cpu?: number;
  allocated_ram?: number;
  allocated_disk?: number;
  is_drained: number;
  is_live?: boolean;
  last_heartbeat?: string;
  created_at: string;
}

export interface VpsInstance {
  id: string;
  name: string;
  hostname: string;
  node_id: string;
  user_id: string;
  status: 'running' | 'stopped' | 'creating' | 'rebuilding' | 'error';
  os_image: string;
  os_type?: 'linux' | 'windows' | 'gui_desktop' | 'custom_iso';
  iso_url?: string;
  vnc_port?: number;
  vnc_password?: string;
  virt_type?: 'hvm' | 'container';
  cpu_cores: number;
  ram_mb: number;
  disk_gb: number;
  ip_address: string;
  gateway?: string;
  netmask?: string;
  root_password?: string;
  ssh_key?: string;
  node_name?: string;
  node_ip?: string;
  node_status?: string;
  node_driver?: string;
  owner_name?: string;
  owner_email?: string;
  created_at: string;
  updated_at: string;
}

export interface ClusterStats {
  nodes: {
    total: number;
    online: number;
    offline: number;
  };
  vps: {
    total: number;
    running: number;
    stopped: number;
  };
  resources: {
    cpu: { total: number; allocated: number; percent: number };
    ram: { totalMb: number; allocatedMb: number; percent: number };
    disk: { totalGb: number; allocatedGb: number; percent: number };
  };
}

export interface IpPool {
  id: string;
  name: string;
  subnet: string;
  gateway: string;
  netmask: string;
  dns: string;
  type: string;
  total_ips?: number;
  used_ips?: number;
  created_at: string;
}

export interface IpAllocation {
  id: string;
  pool_id: string;
  ip_address: string;
  vps_id: string | null;
  vps_name?: string;
  vps_hostname?: string;
  is_reserved: number;
  allocated_at: string;
}

export interface OsTemplate {
  id: string;
  name: string;
  distro: string;
  version: string;
  image_ref: string;
  os_type?: 'linux' | 'windows' | 'gui_desktop' | 'custom_iso';
  iso_url?: string;
  min_ram_mb: number;
  min_disk_gb: number;
  default_user: string;
  icon: string;
  is_active: number;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface LicenseStatus {
  activated: boolean;
  valid: boolean;
  status: 'active' | 'expired' | 'unactivated' | 'invalid';
  planType: 'trial_30d' | 'lifetime' | null;
  planName: string;
  licenseKey: string | null;
  daysRemaining: number | null;
  expiresAt: string | null;
  activatedAt: string | null;
  maxNodes: string;
  maxVps: string;
  message?: string;
}

export interface SystemSettings {
  panel_name?: string;
  company_name?: string;
  support_url?: string;
  primary_color?: string;
  default_driver?: string;
  welcome_message?: string;
  [key: string]: string | undefined;
}

