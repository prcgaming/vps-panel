# VPS Panel - Multi-Node Cloud & Hypervisor Control Panel

A modern, high-performance, multi-node VPS (Virtual Private Server) control panel with a centralized Master Controller, interactive Web Console (xterm.js), IPAM, and distributed worker node daemons supporting **Hybrid Virtualization (Docker / LXC System Containers, KVM / Libvirt Hardware Virtualization, and Mock Hypervisor)**.

![VPS Panel Architecture](https://img.shields.io/badge/Architecture-Multi--Node%20Cluster-06b6d4?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Fullstack-3178c6?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React%2019-Vite%20%2B%20Tailwind-61dafb?style=for-the-badge&logo=react)
![Hypervisors](https://img.shields.io/badge/Hypervisors-Docker%20%7C%20KVM%20%7C%20Mock-10b981?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## ⚡ Quick 1-Command Installation (Pterodactyl-Style)

Run this single command on your Linux VPS (Ubuntu 20.04/22.04/24.04, Debian 11/12, CentOS/AlmaLinux/Rocky 8/9):

```bash
bash <(curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh)
```

### ⚡ Express 1-Command Install with Domain (Zero Prompts)

If you already have your domain pointed to your VPS (e.g. via Cloudflare DNS or Tunnel):

```bash
bash <(curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh) vps.lunars.indevs.in
```

This single command:
1. Detects your OS and automatically creates a 2GB swap file on low-RAM VPS.
2. Automatically installs or upgrades to **Node.js 22 LTS**.
3. Downloads and extracts the pre-built panel files directly.
4. Initializes the SQLite database and seeds default admin credentials.
5. Configures systemd background service `vps-panel.service`.
6. Sets up Nginx reverse proxy with Cloudflare Real-IP restoration and SSL on both Port 80 and Port 443.
7. Performs an automated health check on `http://127.0.0.1:4000/api/health` before completing.

---

### Interactive Menu Options

```
* ------------------------------------------------------------------------- *
*             VPS PANEL - Cloud & Virtualization Orchestrator               *
*                 Fast 1-Click Pterodactyl-Style Installer                  *
* ------------------------------------------------------------------------- *
Select what you would like to install:

  [0] Install Master Panel (Controller API + Modern Web Dashboard)
  [1] Install Worker Node Daemon (Hypervisor agent for Docker/KVM)
  [2] Install Standalone [Both 0 and 1] (Panel + Local Hypervisor on this VPS)
  [3] Configure Cloudflare Domain & Nginx SSL
  [4] Exit
```

### Direct Non-Interactive CLI Commands

#### Option 1: Master Panel (Controller + Admin Dashboard)
```bash
curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh | bash -s -- --panel
```

#### Option 2: Worker Node Agent (Connect external VPS to cluster)
```bash
curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh | bash -s -- --agent --panel-url http://<PANEL_IP>:4000 --token <JOIN_TOKEN> --driver docker
```

#### Option 3: Full Standalone (Panel + Local Worker on 1 Server)
```bash
curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh | bash -s -- --standalone
```

#### Option 4: Configure Cloudflare Custom Domain & SSL
```bash
# Via Nginx Reverse Proxy with Cloudflare Real-IP & SSL
curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh | bash -s -- --domain panel.yourdomain.com

# Or via Cloudflare Zero Trust Tunnel (zero open ports needed)
curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh | bash -s -- --cf-tunnel <YOUR_TUNNEL_TOKEN>
```

---

## 🚀 Key Features

- **Multi-Node Cluster Architecture**: Seamlessly connect unlimited remote Linux hypervisors to a single master controller.
- **Interactive Web Terminal (xterm.js)**: Direct in-browser serial/pty shell for every VPS instance with full ANSI colors, resize negotiation, and Ctrl+C interrupt support.
- **Hybrid Hypervisor Drivers**:
  - `DockerDriver`: High-density system containers with CPU and memory cgroup quotas.
  - `KvmDriver`: Full hardware virtualization via QEMU-KVM & Libvirt.
  - `MockDriver`: Zero-dependency simulated hypervisor with an interactive pseudo-shell for testing and staging.
- **Intelligent Auto-Scheduler**: Automatically places new VPS instances on the least-loaded worker node in the cluster.
- **IPAM (IP Address Management)**: Built-in IPv4/IPv6 pool manager, subnets, automatic IP allocation, and release on termination.
- **OS Template Catalog**: Pre-configured distribution templates for Ubuntu 24.04, Ubuntu 22.04, Debian 12, Alpine Linux 3.20, Rocky Linux 9, Arch Linux, and custom images.
- **Live Hardware Telemetry**: Real-time CPU, RAM, and Disk allocation gauges and node heartbeat monitoring.
- **Role-Based Access Control (RBAC)**: Super Admin vs Client User self-service portal.
- **Security & Audit Logs**: Detailed tracking of all cluster operations, logins, and power cycles.

---

## 🏗️ Architecture

```
                      +------------------------------------------+
                      |         Web Browser (Admin / User)        |
                      +------------------------------------------+
                                    |                ^
                        REST API    |                | WebSocket Console (xterm.js)
                                    v                |
        +----------------------------------------------------------------------+
        |                    MASTER CONTROLLER (apps/server)                   |
        |  - Express REST API (/api/*)                                         |
        |  - WebSocket Hub (/ws/node, /ws/terminal)                            |
        |  - Built-in SQLite Database (WAL mode)                               |
        |  - Built-in React SPA Frontend (apps/client/dist)                    |
        +----------------------------------------------------------------------+
                         |                                      |
         Encrypted WS    | Heartbeats & Commands                |
                         v                                      v
    +------------------------------------+    +------------------------------------+
    |      WORKER NODE 1 (Frankfurt)     |    |      WORKER NODE 2 (New York)      |
    |      vps-panel-agent daemon        |    |      vps-panel-agent daemon        |
    +------------------------------------+    +------------------------------------+
    | Driver: Docker / LXC               |    | Driver: KVM / Libvirt              |
    |  - VPS Container 1 (Ubuntu 24.04)   |    |  - VPS VM 1 (Debian 12)            |
    |  - VPS Container 2 (Alpine 3.20)   |    |  - VPS VM 2 (Rocky Linux 9)        |
    +------------------------------------+    +------------------------------------+
```

---

## 🔐 Default Credentials

After initial installation and database seeding:

| Role | Email | Password |
|---|---|---|
| **Super Administrator** | `admin@vpspanel.local` | `admin123` |
| **Client User (Demo)** | `user@vpspanel.local` | `user123` |

> ⚠️ **Important**: Please change the default password immediately in production!

---

## 📂 Repository Structure

```
vps-panel/
├── install.sh                  # Universal 1-click Linux installation script
├── package.json                # Monorepo root scripts
├── apps/
│   ├── server/                 # Master Controller Backend
│   │   ├── src/
│   │   │   ├── index.ts        # Express & WebSocket server entrypoint
│   │   │   ├── config.ts       # Server configuration & environment
│   │   │   ├── db/             # SQLite engine & database migrations
│   │   │   ├── routes/         # REST API routes (auth, nodes, vps, ipam, logs)
│   │   │   ├── ws/hub.ts       # Node clustering & xterm console proxy hub
│   │   │   └── middleware/     # JWT authentication & admin security
│   │   └── package.json
│   ├── client/                 # Modern React Admin Dashboard
│   │   ├── src/
│   │   │   ├── components/     # TerminalModal, CreateVpsModal, AddNodeModal, Sidebar
│   │   │   ├── pages/          # Dashboard, Nodes, VpsList, Ipam, Templates, Logs
│   │   │   └── api/            # Authenticated API client
│   │   └── package.json
│   └── agent/                  # Worker Node Hypervisor Agent
│       ├── src/
│       │   ├── index.ts        # Agent daemon service entrypoint
│       │   ├── agent.ts        # WebSocket cluster connector & command runner
│       │   ├── drivers/        # Hybrid hypervisor drivers (Docker, KVM, Mock)
│       │   └── metrics.ts      # Host CPU, RAM, Disk, and container stats
│       └── package.json
```

---

## 🛠️ Local Development & Testing

### 1. Install Dependencies
```bash
# Server
cd apps/server && npm install

# Client
cd ../client && npm install

# Agent
cd ../agent && npm install
```

### 2. Run in Development Mode
In separate terminal windows:
```bash
# Terminal 1: Master Server (Port 4000)
cd apps/server
npm run dev

# Terminal 2: Client UI (Vite Dev Server on Port 3000)
cd apps/client
npm run dev

# Terminal 3: Worker Node Agent (Connects to ws://localhost:4000)
cd apps/agent
npm run dev
```

---

## 🛡️ Production Deployment with Nginx & SSL

To run the Master Panel behind Nginx with automatic HTTPS (Let's Encrypt):

### 1. Nginx Configuration (`/etc/nginx/sites-available/panel.conf`)
```nginx
server {
    listen 80;
    server_name panel.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Enable & Obtain SSL
```bash
ln -s /etc/nginx/sites-available/panel.conf /etc/nginx/sites-enabled/
certbot --nginx -d panel.yourdomain.com
systemctl restart nginx
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
