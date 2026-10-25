# VPS Panel - Multi-Node Cloud & Hypervisor Control Panel

A modern, high-performance, multi-node VPS (Virtual Private Server) control panel with a centralized Master Controller, interactive Web Console (xterm.js), IPAM, and distributed worker node daemons supporting **Hybrid Virtualization (Docker / LXC System Containers, KVM / Libvirt Hardware Virtualization, and Mock Hypervisor)**.

![VPS Panel Architecture](https://img.shields.io/badge/Architecture-Multi--Node%20Cluster-06b6d4?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Fullstack-3178c6?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React%2019-Vite%20%2B%20Tailwind-61dafb?style=for-the-badge&logo=react)
![Hypervisors](https://img.shields.io/badge/Hypervisors-Docker%20%7C%20KVM%20%7C%20Mock-10b981?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## ⚡ Quick 1-Command Installation (Pterodactyl-Style)

Run this single command on your Linux VPS (supports Ubuntu 20.04/22.04/24.04, Debian 11/12, CentOS/AlmaLinux/Rocky 8/9, Bare Metal, KVM, Docker, LXC, and WSL):

```bash
bash <(curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh)
```

### ⚡ Express 1-Command Install with Domain (Zero Prompts)

If your domain is already pointed to your VPS via Cloudflare:

```bash
bash <(curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh) panel.yourdomain.com
```

This single command:
1. Detects your operating system and environment (Systemd, Docker, or LXC container).
2. Automatically creates a 2GB swap file on low-memory VPS.
3. Automatically installs or upgrades to **Node.js 22 LTS** (Active LTS).
4. Downloads and extracts the pre-built panel files instantly.
5. Sets up the SQLite database and initializes administrator credentials.
6. Configures background process management (Systemd service or PM2 / SysV in containers).
7. Sets up Nginx reverse proxy with Cloudflare Real-IP restoration and Dual-Port SSL (80 + 443).
8. Performs an active automated health check before completing.

---

## 📖 Step-by-Step Installation Guide (Few Clicks)

### Step 1: Point Your Domain via Cloudflare DNS
1. Open your **Cloudflare Dashboard** -> Select your Domain -> **DNS**.
2. Click **Add Record**:
   - **Type**: `A`
   - **Name**: `panel` (or `@` for root, e.g. `vps.yourdomain.com`)
   - **IPv4 Address**: Your VPS Public IP
   - **Proxy Status**: Proxied (Orange Cloud) or DNS Only (Grey Cloud) — *both are fully supported!*
3. Under **SSL/TLS**: Ensure Encryption Mode is set to **Full** or **Flexible**.

### Step 2: Run the Installer on Your VPS
Connect to your VPS via SSH and run:
```bash
bash <(curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh) panel.yourdomain.com
```
*(Replace `panel.yourdomain.com` with your actual domain).*

### Step 3: Log In to the Admin Dashboard
Open `https://panel.yourdomain.com` in your web browser:
- **Default Email**: `admin@vpspanel.local`
- **Default Password**: `admin123`
*(You can change your password immediately in Users & Roles).*

---

## 🌐 Public Use & Self-Service Configuration

VPS Panel is designed for both private clusters and public hosting providers. You can easily enable or disable public access directly from the web interface without touching terminal files:

1. Log in to the Admin Dashboard and click **Settings & License** in the sidebar.
2. Toggle any of the following self-service options:
   - **Public User Registration**: Allow new visitors to click *Create Account* and sign up.
   - **Client VPS Deployment**: Allow registered users to create and launch their own VPS instances.
   - **Client Power Controls**: Allow users to Start, Stop, and Restart their own VPS instances.
   - **Max VPS Quota per User**: Configure how many instances each client user can deploy.
3. Click **Save Panel Branding & Settings**.

---

## 🎨 Easy Branding & Customization

You can customize the panel's appearance right from the browser:
- **Panel Title**: Rename from default to your own brand (e.g. *Lunar VPS Panel*).
- **Company Name**: Set your hosting organization name.
- **Support / Discord URL**: Add your community support link.
- **Custom Logo URL**: Provide your company logo image or icon.
- **Default Hypervisor**: Choose Docker containers, KVM hardware virtualization, or Mock.

---

## 🖥️ Connecting Worker Hypervisor Nodes

Connect unlimited external Linux machines to your panel cluster:

1. Go to **Nodes** in your panel dashboard.
2. Click **Add Worker Node** and generate a Join Token.
3. On your remote worker server, run:
```bash
bash <(curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh) --node
```
4. Enter your Master Panel URL and Join Token. The node will automatically connect and stream live hardware telemetry!

---

## 🔑 Licensing System

VPS Panel includes a flexible licensing engine:
- **30-Day Pro Tier**: Fully functional evaluation tier with unlimited nodes and VPS instances.
- **Lifetime Enterprise Tier**: Permanent, unrestricted tier with priority badge.
- Pre-activated trial access is enabled upon initial installation.
- Tiers can be managed or updated anytime in the panel under **Settings & License**.

---

## ⚡ 1-Click In-Panel Update (Web UI)

You can update the VPS Panel directly from your web browser with zero terminal commands:
1. Log in to the Admin Dashboard and navigate to **Settings & License** in the sidebar.
2. Scroll to the **Panel Updates & Maintenance** section.
3. Click **Check for Updates** to see the current version and sync status with GitHub `main`.
4. Click **⚡ 1-Click Update Now**:
   - The server will safely preserve your SQLite database, configurations, and active VPS instances.
   - It downloads the latest pre-built release and reloads the services automatically in the background.
   - Your browser page will refresh in ~6 seconds with the latest update live!

---

## 💻 Unified `vps-panel` CLI Command

The installer automatically installs a global binary `vps-panel` to your VPS system PATH (`/usr/local/bin/vps-panel`). You can perform any management action with a single command:

```bash
# Update panel to newest GitHub release
vps-panel update

# Check live service status & health check
vps-panel status

# View live backend logs
vps-panel logs

# Restart Master Panel and Nginx web server
vps-panel restart

# Stop panel services
vps-panel stop

# Start panel services
vps-panel start

# Install or reconfigure panel for a domain
vps-panel install panel.yourdomain.com

# Cleanly uninstall panel (includes automated database backup)
vps-panel uninstall
```

> **Tip:** You can also run any subcommand directly via curl without installing:
> ```bash
> bash <(curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh) update
> bash <(curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh) status
> bash <(curl -sSL https://raw.githubusercontent.com/prcgaming/vps-panel/main/install.sh) restart
> ```

---

## 📄 License
This project is open-source under the MIT License.
