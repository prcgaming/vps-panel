import { BaseDriver, VpsConfig, TerminalSession } from './BaseDriver.js';

interface MockVpsState {
  config: VpsConfig;
  status: 'running' | 'stopped' | 'rebuilding';
  bootedAt: number;
}

export class MockDriver implements BaseDriver {
  public name = 'mock';
  private instances = new Map<string, MockVpsState>();

  async init(): Promise<void> {
    console.log('[MockDriver] Initialized mock virtualization driver (Simulated Hypervisor)');
    // Seed default instance if empty
    this.instances.set('vps-demo-prod', {
      config: {
        id: 'vps-demo-prod',
        name: 'web-server-prod',
        hostname: 'web01.example.com',
        os_image: 'ubuntu:24.04',
        cpu_cores: 2,
        ram_mb: 2048,
        disk_gb: 40,
        ip_address: '198.51.100.10'
      },
      status: 'running',
      bootedAt: Date.now() - 3600000
    });
  }

  async createVps(config: VpsConfig): Promise<void> {
    console.log(`[MockDriver] Creating VPS ${config.name} (${config.id})...`);
    this.instances.set(config.id, {
      config,
      status: 'running',
      bootedAt: Date.now()
    });
  }

  async startVps(id: string): Promise<void> {
    const vps = this.instances.get(id);
    if (!vps) {
      this.instances.set(id, {
        config: { id, name: id, hostname: `${id}.local`, os_image: 'ubuntu:24.04', cpu_cores: 1, ram_mb: 1024, disk_gb: 20, ip_address: '198.51.100.15' },
        status: 'running',
        bootedAt: Date.now()
      });
      return;
    }
    vps.status = 'running';
    vps.bootedAt = Date.now();
    console.log(`[MockDriver] VPS ${id} started.`);
  }

  async stopVps(id: string, force = false): Promise<void> {
    const vps = this.instances.get(id);
    if (vps) {
      vps.status = 'stopped';
      console.log(`[MockDriver] VPS ${id} stopped (force: ${force}).`);
    }
  }

  async restartVps(id: string): Promise<void> {
    await this.stopVps(id, true);
    await this.startVps(id);
    console.log(`[MockDriver] VPS ${id} restarted.`);
  }

  async deleteVps(id: string): Promise<void> {
    this.instances.delete(id);
    console.log(`[MockDriver] VPS ${id} deleted.`);
  }

  async reinstallVps(id: string, osImage: string, rootPassword?: string): Promise<void> {
    const vps = this.instances.get(id);
    if (vps) {
      vps.status = 'rebuilding';
      vps.config.os_image = osImage;
      if (rootPassword) vps.config.root_password = rootPassword;
      setTimeout(() => {
        vps.status = 'running';
        vps.bootedAt = Date.now();
      }, 1500);
      console.log(`[MockDriver] VPS ${id} reinstalled with ${osImage}.`);
    }
  }

  getRunningVpsCount(): number {
    let count = 0;
    for (const v of this.instances.values()) {
      if (v.status === 'running') count++;
    }
    return count;
  }

  attachTerminal(id: string, onData: (chunk: string) => void): TerminalSession {
    const vps = this.instances.get(id) || {
      config: { id, name: id, hostname: 'vps-node', os_image: 'ubuntu:24.04', cpu_cores: 2, ram_mb: 2048, disk_gb: 40, ip_address: '198.51.100.10' },
      status: 'running',
      bootedAt: Date.now()
    };

    const hostname = vps.config.hostname || 'vps';
    const osImage = vps.config.os_image || 'ubuntu:24.04';
    const prompt = `\x1b[32;1mroot@${hostname}\x1b[0m:\x1b[34;1m~\x1b[0m# `;

    // Print welcome MOTD
    setTimeout(() => {
      onData(`\r\n\x1b[1;36m======================================================================\x1b[0m\r\n`);
      onData(`\x1b[1;32m  Connected to VPS Instance: ${vps.config.name} (${vps.config.ip_address})\x1b[0m\r\n`);
      onData(`\x1b[33m  Hypervisor Driver: Mock Driver (Interactive Linux Environment)\x1b[0m\r\n`);
      onData(`\x1b[1;36m======================================================================\x1b[0m\r\n\r\n`);
      onData(`Welcome to ${osImage} (GNU/Linux 6.8.0-generic x86_64)\r\n\r\n`);
      onData(` * System load:  0.08, 0.04, 0.01\r\n`);
      onData(` * Memory usage: 18% of ${vps.config.ram_mb}MB\r\n`);
      onData(` * Disk usage:   12% of ${vps.config.disk_gb}GB\r\n`);
      onData(` * IPv4 Address: ${vps.config.ip_address}\r\n\r\n`);
      onData(`Type '\x1b[33mhelp\x1b[0m' to see available interactive shell commands.\r\n\r\n`);
      onData(prompt);
    }, 100);

    let inputBuffer = '';

    const executeCommand = (cmd: string) => {
      const trimmed = cmd.trim();
      const parts = trimmed.split(' ');
      const bin = parts[0];

      if (!trimmed) {
        onData(`\r\n${prompt}`);
        return;
      }

      switch (bin) {
        case 'help':
        case '?':
          onData(`\r\nAvailable commands:\r\n`);
          onData(`  \x1b[36mhelp\x1b[0m            - Show this help message\r\n`);
          onData(`  \x1b[36muname -a\x1b[0m        - View kernel and system architecture\r\n`);
          onData(`  \x1b[36muptime\x1b[0m          - View uptime and load averages\r\n`);
          onData(`  \x1b[36mfree -m\x1b[0m         - View memory (RAM) usage\r\n`);
          onData(`  \x1b[36mdf -h\x1b[0m           - View disk storage space\r\n`);
          onData(`  \x1b[36mip a\x1b[0m            - Show IP network interfaces\r\n`);
          onData(`  \x1b[36mcat /etc/os-release\x1b[0m - Show operating system release\r\n`);
          onData(`  \x1b[36mps aux\x1b[0m          - List running processes\r\n`);
          onData(`  \x1b[36mwhoami\x1b[0m          - Print current user (root)\r\n`);
          onData(`  \x1b[36mhostname\x1b[0m        - Print server hostname\r\n`);
          onData(`  \x1b[36mclear\x1b[0m           - Clear terminal screen\r\n`);
          onData(`  \x1b[36mreboot\x1b[0m          - Simulate server reboot\r\n`);
          break;

        case 'uname':
          onData(`\r\nLinux ${hostname} 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\r\n`);
          break;

        case 'uptime':
          const uptimeSec = Math.floor((Date.now() - vps.bootedAt) / 1000);
          const mins = Math.floor(uptimeSec / 60);
          onData(`\r\n ${new Date().toLocaleTimeString()} up ${mins} min, 1 user, load average: 0.08, 0.04, 0.01\r\n`);
          break;

        case 'free':
          onData(`\r\n               total        used        free      shared  buff/cache   available\r\n`);
          onData(`Mem:            ${vps.config.ram_mb}         342        ${vps.config.ram_mb - 342}          12         180        ${vps.config.ram_mb - 380}\r\n`);
          onData(`Swap:           2048           0        2048\r\n`);
          break;

        case 'df':
          onData(`\r\nFilesystem      Size  Used Avail Use% Mounted on\r\n`);
          onData(`/dev/vda1        ${vps.config.disk_gb}G  3.2G   ${vps.config.disk_gb - 4}G  12% /\r\n`);
          onData(`tmpfs           ${Math.round(vps.config.ram_mb / 2)}M     0  ${Math.round(vps.config.ram_mb / 2)}M   0% /dev/shm\r\n`);
          break;

        case 'ip':
        case 'ifconfig':
          onData(`\r\n1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\r\n`);
          onData(`    inet 127.0.0.1/8 scope host lo\r\n`);
          onData(`2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP\r\n`);
          onData(`    inet ${vps.config.ip_address}/24 brd 198.51.100.255 scope global eth0\r\n`);
          break;

        case 'cat':
          if (parts[1]?.includes('os-release')) {
            onData(`\r\nPRETTY_NAME="${vps.config.os_image}"\r\nNAME="Linux"\r\nVERSION_ID="2026.1"\r\nHOME_URL="https://vpspanel.local/"\r\n`);
          } else {
            onData(`\r\ncat: ${parts[1] || ''}: No such file or directory\r\n`);
          }
          break;

        case 'ps':
          onData(`\r\nUSER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\r\n`);
          onData(`root         1  0.0  0.2 168344 11840 ?        Ss   12:00   0:01 /sbin/init\r\n`);
          onData(`root       342  0.0  0.1  14560  6210 ?        Ss   12:00   0:00 /usr/sbin/sshd -D\r\n`);
          onData(`root       789  0.0  0.4  84500 18450 ?        Ssl  12:00   0:02 /usr/sbin/nginx -g daemon on;\r\n`);
          onData(`root      1024  0.0  0.1   8900  4200 pts/0    Ss   12:01   0:00 /bin/bash\r\n`);
          break;

        case 'whoami':
          onData(`\r\nroot\r\n`);
          break;

        case 'hostname':
          onData(`\r\n${hostname}\r\n`);
          break;

        case 'pwd':
          onData(`\r\n/root\r\n`);
          break;

        case 'date':
          onData(`\r\n${new Date().toUTCString()}\r\n`);
          break;

        case 'ls':
          onData(`\r\nsnap  app  scripts  setup.log\r\n`);
          break;

        case 'clear':
          onData(`\x1b[2J\x1b[H`);
          onData(prompt);
          return;

        case 'reboot':
          onData(`\r\n\x1b[31;1mBroadcast message from root@${hostname} on pts/0:\x1b[0m\r\nThe system is going down for reboot NOW!\r\n`);
          vps.bootedAt = Date.now();
          setTimeout(() => {
            onData(`\r\n[ OK ] Reached target Shutdown.\r\n[ OK ] Stopped target Local File Systems.\r\nRebooting...\r\n\r\n`);
            onData(`Welcome to ${osImage} (GNU/Linux 6.8.0-generic x86_64)\r\n\r\n`);
            onData(prompt);
          }, 1500);
          return;

        default:
          onData(`\r\nbash: ${bin}: command not found. (Type 'help' for commands)\r\n`);
          break;
      }

      onData(prompt);
    };

    return {
      write: (data: string) => {
        for (let i = 0; i < data.length; i++) {
          const char = data[i];

          // Enter key
          if (char === '\r' || char === '\n') {
            const cmd = inputBuffer;
            inputBuffer = '';
            executeCommand(cmd);
          }
          // Backspace key
          else if (char === '\x7f' || char === '\b') {
            if (inputBuffer.length > 0) {
              inputBuffer = inputBuffer.slice(0, -1);
              onData('\b \b');
            }
          }
          // Ctrl+C
          else if (char === '\x03') {
            inputBuffer = '';
            onData(`^C\r\n${prompt}`);
          }
          // Printable characters
          else if (char >= ' ') {
            inputBuffer += char;
            onData(char);
          }
        }
      },
      resize: (cols: number, rows: number) => {
        // No-op for mock, acknowledged
      },
      close: () => {
        // Clean up
      }
    };
  }
}
