import { execSync, spawn, ChildProcess } from 'child_process';
import { BaseDriver, VpsConfig, TerminalSession } from './BaseDriver.js';

export class KvmDriver implements BaseDriver {
  public name = 'kvm';
  private hasVirsh = false;

  async init(): Promise<void> {
    try {
      execSync('virsh --version', { stdio: 'ignore' });
      this.hasVirsh = true;
      console.log('[KvmDriver] KVM / Libvirt virsh detected.');
    } catch (e) {
      console.warn('[KvmDriver] virsh not detected. Make sure libvirt-daemon-system and qemu-kvm are installed for KVM.');
    }
  }

  async createVps(config: VpsConfig): Promise<void> {
    console.log(`[KvmDriver] Provisioning KVM domain vps-${config.id}...`);
    // Full virtualization virsh command
  }

  async startVps(id: string): Promise<void> {
    if (this.hasVirsh) {
      execSync(`virsh start vps-${id}`, { stdio: 'ignore' });
    }
  }

  async stopVps(id: string, force = false): Promise<void> {
    if (this.hasVirsh) {
      const action = force ? 'destroy' : 'shutdown';
      execSync(`virsh ${action} vps-${id}`, { stdio: 'ignore' });
    }
  }

  async restartVps(id: string): Promise<void> {
    if (this.hasVirsh) {
      execSync(`virsh reboot vps-${id}`, { stdio: 'ignore' });
    }
  }

  async deleteVps(id: string): Promise<void> {
    if (this.hasVirsh) {
      try {
        execSync(`virsh destroy vps-${id}`, { stdio: 'ignore' });
        execSync(`virsh undefine vps-${id} --remove-all-storage`, { stdio: 'ignore' });
      } catch (e) {}
    }
  }

  async reinstallVps(id: string, osImage: string, rootPassword?: string): Promise<void> {
    await this.deleteVps(id);
    await this.createVps({
      id,
      name: id,
      hostname: `${id}.kvm`,
      os_image: osImage,
      cpu_cores: 2,
      ram_mb: 2048,
      disk_gb: 40,
      ip_address: '198.51.100.12',
      root_password: rootPassword
    });
  }

  getRunningVpsCount(): number {
    if (!this.hasVirsh) return 0;
    try {
      const out = execSync('virsh list --state-running --name', { encoding: 'utf8' });
      return out.trim().split('\n').filter(Boolean).length;
    } catch (e) {
      return 0;
    }
  }

  attachTerminal(id: string, onData: (chunk: string) => void): TerminalSession {
    if (!this.hasVirsh) {
      onData(`\r\n\x1b[31;1m[ERROR] KVM Libvirt virsh not found on this worker host.\x1b[0m\r\n`);
      return { write: (d) => onData(d), resize: () => {}, close: () => {} };
    }

    const proc = spawn('virsh', ['console', `vps-${id}`]);
    proc.stdout?.on('data', (d) => onData(d.toString()));
    proc.stderr?.on('data', (d) => onData(d.toString()));

    return {
      write: (data) => proc.stdin?.write(data),
      resize: () => {},
      close: () => proc.kill()
    };
  }
}
