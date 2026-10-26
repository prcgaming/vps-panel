export interface VpsConfig {
  id: string;
  name: string;
  hostname: string;
  virt_type?: 'hvm' | 'container';
  os_image: string;
  cpu_cores: number;
  ram_mb: number;
  disk_gb: number;
  ip_address: string;
  root_password?: string;
  ssh_key?: string;
}

export interface TerminalSession {
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  close: () => void;
}

export interface BaseDriver {
  name: string;
  init(): Promise<void>;
  createVps(config: VpsConfig): Promise<void>;
  startVps(id: string): Promise<void>;
  stopVps(id: string, force?: boolean): Promise<void>;
  restartVps(id: string): Promise<void>;
  deleteVps(id: string): Promise<void>;
  reinstallVps(id: string, osImage: string, rootPassword?: string): Promise<void>;
  attachTerminal(id: string, onData: (chunk: string) => void): TerminalSession;
  getRunningVpsCount(): number;
}
