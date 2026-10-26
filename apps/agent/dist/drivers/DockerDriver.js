import { spawn, execSync } from 'child_process';
export class DockerDriver {
    name = 'docker';
    hasDocker = false;
    async init() {
        try {
            execSync('docker --version', { stdio: 'ignore' });
            this.hasDocker = true;
            console.log('[DockerDriver] Docker daemon detected and ready.');
        }
        catch (e) {
            console.warn('[DockerDriver] Docker executable not found in PATH. Make sure Docker is installed if using Docker driver.');
        }
    }
    async createVps(config) {
        if (!this.hasDocker) {
            console.log(`[DockerDriver] Simulated creation of ${config.name} (Docker not installed on host)`);
            return;
        }
        const containerName = `vps-${config.id}`;
        // Pull image if not local
        try {
            execSync(`docker pull ${config.os_image}`, { stdio: 'inherit' });
        }
        catch (e) {
            // Continue if offline or image cached
        }
        // Run container with resources
        const cmd = [
            'run', '-d',
            '--name', containerName,
            '--hostname', config.hostname,
            `--cpus=${config.cpu_cores}`,
            `-m=${config.ram_mb}m`,
            '--restart', 'always',
            config.os_image,
            'tail', '-f', '/dev/null' // Keep alive system container
        ];
        execSync(`docker ${cmd.join(' ')}`, { stdio: 'inherit' });
        console.log(`[DockerDriver] Container ${containerName} created.`);
    }
    async startVps(id) {
        if (this.hasDocker) {
            execSync(`docker start vps-${id}`, { stdio: 'ignore' });
        }
    }
    async stopVps(id, force = false) {
        if (this.hasDocker) {
            const action = force ? 'kill' : 'stop';
            execSync(`docker ${action} vps-${id}`, { stdio: 'ignore' });
        }
    }
    async restartVps(id) {
        if (this.hasDocker) {
            execSync(`docker restart vps-${id}`, { stdio: 'ignore' });
        }
    }
    async deleteVps(id) {
        if (this.hasDocker) {
            try {
                execSync(`docker rm -f vps-${id}`, { stdio: 'ignore' });
            }
            catch (e) { }
        }
    }
    async reinstallVps(id, osImage, rootPassword) {
        await this.deleteVps(id);
        await this.createVps({
            id,
            name: id,
            hostname: `${id}.local`,
            os_image: osImage,
            cpu_cores: 1,
            ram_mb: 1024,
            disk_gb: 20,
            ip_address: '198.51.100.10',
            root_password: rootPassword
        });
    }
    getRunningVpsCount() {
        if (!this.hasDocker)
            return 0;
        try {
            const out = execSync('docker ps --filter "name=vps-" --format "{{.ID}}"', { encoding: 'utf8' });
            return out.trim().split('\n').filter(Boolean).length;
        }
        catch (e) {
            return 0;
        }
    }
    attachTerminal(id, onData) {
        const containerName = `vps-${id}`;
        if (!this.hasDocker) {
            onData(`\r\n\x1b[31;1m[ERROR] Docker daemon not found on this worker node host.\x1b[0m\r\nFalling back to mock session...\r\n`);
            return {
                write: (d) => onData(d),
                resize: () => { },
                close: () => { }
            };
        }
        // Try bash, fallback to sh
        let proc;
        try {
            proc = spawn('docker', ['exec', '-i', '-t', containerName, '/bin/bash'], {
                env: { ...process.env, TERM: 'xterm-256color' }
            });
        }
        catch (err) {
            proc = spawn('docker', ['exec', '-i', '-t', containerName, '/bin/sh'], {
                env: { ...process.env, TERM: 'xterm-256color' }
            });
        }
        proc.stdout?.on('data', (data) => onData(data.toString()));
        proc.stderr?.on('data', (data) => onData(data.toString()));
        proc.on('close', () => {
            onData('\r\n[Console session terminated]\r\n');
        });
        return {
            write: (data) => {
                if (proc.stdin && !proc.stdin.destroyed) {
                    proc.stdin.write(data);
                }
            },
            resize: (cols, rows) => {
                // Can be handled via ioctl or resize if needed
            },
            close: () => {
                try {
                    proc.kill();
                }
                catch (e) { }
            }
        };
    }
}
