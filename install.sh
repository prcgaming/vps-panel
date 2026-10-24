#!/usr/bin/env bash
# ==============================================================================
# VPS PANEL - Universal Multi-Node Installation & Cloudflare Setup Script
# Supports: Ubuntu 20.04/22.04/24.04, Debian 11/12, CentOS/RHEL/Rocky/Alma 8/9
# GitHub: https://github.com/prcgaming/vps-panel
# ==============================================================================

set -e

# Terminal Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

INSTALL_DIR="/opt/vps-panel"
REPO_URL="https://github.com/prcgaming/vps-panel.git"
PANEL_PORT=4000
NODE_PORT=4001

# Print Banner
clear 2>/dev/null || true
echo -e "${CYAN}${BOLD}"
cat << "EOF"
 __      ______   _____   _____                 _ 
 \ \    / /  __ \ / ____| |  __ \               | |
  \ \  / /| |__) | (___   | |__) |_ _ _ __   ___| |
   \ \/ / |  ___/ \___ \  |  ___/ _` | '_ \ / _ \ |
    \  /  | |     ____) | | |  | (_| | | | |  __/ |
     \/   |_|    |_____/  |_|   \__,_|_| |_|\___|_|
                                                   
           Multi-Node VPS Control Panel
         Hybrid Hypervisor (Docker / KVM)
         Cloudflare Zero-Trust & SSL Ready
EOF
echo -e "${NC}"
echo -e "${PURPLE}===================================================================${NC}"
echo -e "${GREEN} Automated Multi-Node VPS Panel Installer & Cloudflare Setup${NC}"
echo -e "${PURPLE}===================================================================${NC}\n"

# Check root privilege
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] This script must be run as root. Please run with sudo or as root user.${NC}"
  exit 1
fi

# Detect Operating System
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VER=$VERSION_ID
  elif type lsb_release >/dev/null 2>&1; then
    OS=$(lsb_release -si | tr '[:upper:]' '[:lower:]')
    OS_VER=$(lsb_release -sr)
  else
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    OS_VER=""
  fi
  echo -e "${BLUE}[INFO] Detected OS:${NC} ${BOLD}$OS $OS_VER${NC}"
}

# Get Server Public IP
get_public_ip() {
  PUBLIC_IP=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me || hostname -I | awk '{print $1}')
  echo "$PUBLIC_IP"
}

# Install Prerequisites (curl, git, nodejs 22.x, build tools)
install_base_deps() {
  echo -e "\n${YELLOW}--> Updating system packages and installing prerequisites...${NC}"
  if [[ "$OS" =~ ^(ubuntu|debian)$ ]]; then
    apt-get update -y
    apt-get install -y curl wget git tar build-essential ufw net-tools openssl
  elif [[ "$OS" =~ ^(centos|rhel|rocky|almalinux|fedora)$ ]]; then
    yum install -y epel-release || true
    yum install -y curl wget git tar make gcc gcc-c++ firewalld net-tools openssl
  fi

  # Check / Install Node.js
  if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
    echo -e "${YELLOW}--> Installing Node.js 22.x LTS...${NC}"
    if [[ "$OS" =~ ^(ubuntu|debian)$ ]]; then
      curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
      apt-get install -y nodejs
    elif [[ "$OS" =~ ^(centos|rhel|rocky|almalinux|fedora)$ ]]; then
      curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
      yum install -y nodejs
    fi
  fi

  echo -e "${GREEN}[OK] Node.js version:${NC} $(node -v) / npm $(npm -v)"
}

# Install Docker (Optional, for Docker-based VPS driver)
install_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo -e "\n${YELLOW}--> Installing Docker Container Engine...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm -f get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}[OK] Docker installed and running!${NC}"
  else
    echo -e "${GREEN}[OK] Docker is already installed.${NC}"
    systemctl start docker || true
  fi
}

# Clone or Update Repository
setup_repository() {
  echo -e "\n${YELLOW}--> Setting up VPS Panel in ${INSTALL_DIR}...${NC}"
  mkdir -p "$INSTALL_DIR"
  
  # If running from inside the cloned folder itself
  if [ -f "./apps/server/package.json" ]; then
    echo -e "${BLUE}[INFO] Installing from current directory source...${NC}"
    cp -r ./* "$INSTALL_DIR/" 2>/dev/null || true
  elif [ ! -d "$INSTALL_DIR/.git" ]; then
    echo -e "${BLUE}[INFO] Cloning repository from GitHub...${NC}"
    git clone "$REPO_URL" "$INSTALL_DIR"
  else
    echo -e "${BLUE}[INFO] Updating existing repository...${NC}"
    cd "$INSTALL_DIR" && git pull || true
  fi
  
  cd "$INSTALL_DIR"
}

# ==============================================================================
# CLOUDFLARE DOMAIN & SSL CONFIGURATION
# ==============================================================================

# Option A: Cloudflare via Nginx Reverse Proxy with Real IP and SSL
configure_nginx_cloudflare() {
  local DOMAIN_NAME="$1"

  if [ -z "$DOMAIN_NAME" ]; then
    echo -e "\n${CYAN}Enter your domain name pointed to this VPS via Cloudflare DNS (e.g. panel.example.com):${NC}"
    read -r DOMAIN_NAME
  fi

  if [ -z "$DOMAIN_NAME" ]; then
    echo -e "${RED}[ERROR] Domain name cannot be empty!${NC}"
    return 1
  fi

  echo -e "\n${YELLOW}--> Installing Nginx and Certbot for Cloudflare domain: ${BOLD}$DOMAIN_NAME${NC}..."

  if [[ "$OS" =~ ^(ubuntu|debian)$ ]]; then
    apt-get update -y
    apt-get install -y nginx certbot python3-certbot-nginx
  elif [[ "$OS" =~ ^(centos|rhel|rocky|almalinux|fedora)$ ]]; then
    yum install -y nginx certbot python3-certbot-nginx
    systemctl enable nginx
  fi

  # Create Cloudflare Real IP restoration config
  echo -e "${YELLOW}--> Configuring Cloudflare Real IP restoration in Nginx...${NC}"
  cat > /etc/nginx/conf.d/cloudflare_real_ip.conf 2>/dev/null || cat > /etc/nginx/cloudflare_real_ip.conf << 'CFOVERLAY'
# Cloudflare Official IPv4 CIDR Blocks
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;

# Cloudflare Official IPv6 CIDR Blocks
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;

real_ip_header CF-Connecting-IP;
CFOVERLAY

  # Create Domain VHost Config with full WebSocket proxy support for xterm.js
  echo -e "${YELLOW}--> Writing Nginx reverse proxy configuration for $DOMAIN_NAME...${NC}"
  local VHOST_CONF="/etc/nginx/conf.d/${DOMAIN_NAME}.conf"
  if [ -d "/etc/nginx/sites-available" ]; then
    VHOST_CONF="/etc/nginx/sites-available/${DOMAIN_NAME}.conf"
  fi

  cat > "$VHOST_CONF" << NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:$PANEL_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket timeouts for terminal streaming
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
NGINXEOF

  if [ -d "/etc/nginx/sites-enabled" ]; then
    ln -sf "$VHOST_CONF" "/etc/nginx/sites-enabled/${DOMAIN_NAME}.conf"
  fi

  nginx -t
  systemctl restart nginx

  # Open Firewall for HTTP & HTTPS
  if command -v ufw >/dev/null 2>&1; then
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
  elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
    firewall-cmd --permanent --add-service=https >/dev/null 2>&1 || true
    firewall-cmd --reload >/dev/null 2>&1 || true
  fi

  # Attempt Certbot SSL Certificate
  echo -e "\n${YELLOW}--> Obtaining Let's Encrypt / Cloudflare SSL certificate for ${DOMAIN_NAME}...${NC}"
  if certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>/dev/null; then
    echo -e "${GREEN}[OK] SSL Certificate successfully installed!${NC}"
  else
    echo -e "${YELLOW}[NOTE] Automatic Certbot certificate generation skipped or waiting for DNS propagation.${NC}"
    echo -e "${YELLOW}If your domain has Cloudflare Proxy (Orange Cloud) enabled with 'Flexible' or 'Full' SSL, your connection is already encrypted via Cloudflare Edge!${NC}"
  fi

  systemctl reload nginx

  echo -e "\n${GREEN}===================================================================${NC}"
  echo -e "${GREEN}${BOLD} Cloudflare Domain Configured Successfully!${NC}"
  echo -e "${GREEN}===================================================================${NC}"
  echo -e "${CYAN}Panel URL:${NC}       ${BOLD}https://${DOMAIN_NAME}${NC}"
  echo -e "${CYAN}Cloudflare Proxy:${NC} ${BOLD}Active with Real-IP Restoration${NC}"
  echo -e "${CYAN}WebSocket Stream:${NC} ${BOLD}Enabled (xterm.js Web Console supported)${NC}"
  echo -e "${GREEN}===================================================================${NC}\n"
}

# Option B: Cloudflare Zero Trust Tunnel (No open ports needed!)
configure_cloudflare_tunnel() {
  local TUNNEL_TOKEN="$1"

  if [ -z "$TUNNEL_TOKEN" ]; then
    echo -e "\n${CYAN}To set up a Cloudflare Tunnel:${NC}"
    echo -e "1. Go to Cloudflare Zero Trust Dashboard -> Networks -> Tunnels"
    echo -e "2. Create a Tunnel (e.g. 'vps-panel') and select 'Debian/Ubuntu' or 'RedHat'"
    echo -e "3. Copy your Tunnel Token"
    echo -e "\n${CYAN}Enter your Cloudflare Tunnel Token:${NC}"
    read -r TUNNEL_TOKEN
  fi

  if [ -z "$TUNNEL_TOKEN" ]; then
    echo -e "${RED}[ERROR] Cloudflare Tunnel Token cannot be empty!${NC}"
    return 1
  fi

  echo -e "\n${YELLOW}--> Installing Cloudflare Tunnel daemon (cloudflared)...${NC}"
  
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64) CF_ARCH="amd64" ;;
    aarch64|arm64) CF_ARCH="arm64" ;;
    *) CF_ARCH="amd64" ;;
  esac

  if [[ "$OS" =~ ^(ubuntu|debian)$ ]]; then
    curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}.deb" -o cloudflared.deb
    dpkg -i cloudflared.deb || apt-get install -f -y
    rm -f cloudflared.deb
  elif [[ "$OS" =~ ^(centos|rhel|rocky|almalinux|fedora)$ ]]; then
    curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}.rpm" -o cloudflared.rpm
    rpm -i cloudflared.rpm || yum localinstall -y cloudflared.rpm
    rm -f cloudflared.rpm
  fi

  echo -e "${YELLOW}--> Installing cloudflared system service with your token...${NC}"
  cloudflared service install "$TUNNEL_TOKEN"
  systemctl enable cloudflared
  systemctl restart cloudflared

  echo -e "\n${GREEN}===================================================================${NC}"
  echo -e "${GREEN}${BOLD} Cloudflare Tunnel Successfully Connected!${NC}"
  echo -e "${GREEN}===================================================================${NC}"
  echo -e "${CYAN}Status:${NC}        ${BOLD}cloudflared service running${NC}"
  echo -e "${CYAN}Target URL:${NC}    ${BOLD}http://localhost:${PANEL_PORT}${NC}"
  echo -e "${PURPLE}-------------------------------------------------------------------${NC}"
  echo -e "${YELLOW}In Cloudflare Zero Trust Dashboard, make sure your Public Hostname${NC}"
  echo -e "${YELLOW}points to: Service: HTTP -> localhost:${PANEL_PORT}${NC}"
  echo -e "${GREEN}===================================================================${NC}\n"
}

# Sub-menu for Cloudflare Domain Configuration
menu_cloudflare() {
  echo -e "\n${PURPLE}===================================================================${NC}"
  echo -e "${CYAN}${BOLD} Configure Cloudflare Domain & SSL${NC}"
  echo -e "${PURPLE}===================================================================${NC}"
  echo -e "  ${CYAN}[1]${NC} ${BOLD}Nginx Reverse Proxy + Cloudflare DNS${NC} (Standard A Record + SSL + Real IP)"
  echo -e "  ${CYAN}[2]${NC} ${BOLD}Cloudflare Zero Trust Tunnel${NC} (Zero open ports, connect via Tunnel Token)"
  echo -e "  ${CYAN}[3]${NC} Back to Main Menu\n"
  read -p "Select option [1-3]: " CF_CHOICE

  case "$CF_CHOICE" in
    1) configure_nginx_cloudflare ;;
    2) configure_cloudflare_tunnel ;;
    3) return 0 ;;
    *) echo -e "${RED}Invalid choice!${NC}";;
  esac
}

# ==============================================================================
# PANEL & AGENT INSTALLERS
# ==============================================================================

# Install & Build Master Panel
install_panel() {
  detect_os
  install_base_deps
  setup_repository

  echo -e "\n${YELLOW}--> Installing Master Panel server dependencies...${NC}"
  cd "$INSTALL_DIR/apps/server"
  npm install

  echo -e "\n${YELLOW}--> Installing Master Panel client dependencies & building UI...${NC}"
  cd "$INSTALL_DIR/apps/client"
  npm install
  npm run build

  # Generate or update environment variables
  cd "$INSTALL_DIR/apps/server"
  if [ ! -f ".env" ]; then
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
    cat > .env << ENVEOF
PORT=$PANEL_PORT
HOST=0.0.0.0
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
DB_PATH=$INSTALL_DIR/apps/server/data/vps_panel.sqlite
CLIENT_DIST_PATH=$INSTALL_DIR/apps/client/dist
ENVEOF
  fi

  # Create data directory
  mkdir -p "$INSTALL_DIR/apps/server/data"

  # Initialize database & seed default admin
  echo -e "\n${YELLOW}--> Initializing Database & Seeding Default Admin...${NC}"
  npm run seed

  # Configure Systemd Service
  echo -e "\n${YELLOW}--> Configuring systemd service (vps-panel.service)...${NC}"
  cat > /etc/systemd/system/vps-panel.service << SERVICEOF
[Unit]
Description=VPS Control Panel Master Controller
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/apps/server
ExecStart=$(which npx) tsx src/index.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICEOF

  systemctl daemon-reload
  systemctl enable vps-panel
  systemctl restart vps-panel

  # Open Firewall
  if command -v ufw >/dev/null 2>&1; then
    ufw allow $PANEL_PORT/tcp >/dev/null 2>&1 || true
  elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-port=$PANEL_PORT/tcp >/dev/null 2>&1 || true
    firewall-cmd --reload >/dev/null 2>&1 || true
  fi

  SERVER_IP=$(get_public_ip)
  echo -e "\n${GREEN}===================================================================${NC}"
  echo -e "${GREEN}${BOLD} Master Panel Successfully Installed & Running!${NC}"
  echo -e "${GREEN}===================================================================${NC}"
  echo -e "${CYAN}Access URL:${NC}       ${BOLD}http://${SERVER_IP}:${PANEL_PORT}${NC}"
  echo -e "${CYAN}Default Admin:${NC}    ${BOLD}admin@vpspanel.local${NC}"
  echo -e "${CYAN}Default Password:${NC} ${BOLD}admin123${NC}"
  echo -e "${PURPLE}-------------------------------------------------------------------${NC}"
  echo -e "${YELLOW}Next Step: Connect worker nodes via 'Nodes' in the dashboard!${NC}"
  echo -e "${GREEN}===================================================================${NC}\n"

  # Optional Cloudflare prompt
  if [ -n "$DOMAIN_NAME_CLI" ]; then
    configure_nginx_cloudflare "$DOMAIN_NAME_CLI"
  elif [ -n "$CF_TUNNEL_CLI" ]; then
    configure_cloudflare_tunnel "$CF_TUNNEL_CLI"
  else
    echo -e "${CYAN}Would you like to configure your custom domain with Cloudflare now? [y/N]:${NC}"
    read -r SETUP_CF
    if [[ "$SETUP_CF" =~ ^[Yy]$ ]]; then
      menu_cloudflare
    fi
  fi
}

# Install & Configure Worker Node Agent
install_agent() {
  detect_os
  install_base_deps

  # Prompt if parameters not passed
  if [ -z "$PANEL_URL" ]; then
    echo -e "${CYAN}Enter Master Panel URL (e.g., http://1.2.3.4:4000 or https://panel.yourdomain.com):${NC}"
    read -r PANEL_URL
  fi

  if [ -z "$NODE_TOKEN" ]; then
    echo -e "${CYAN}Enter Worker Node Join Token (from Master Panel -> Nodes -> Add Node):${NC}"
    read -r NODE_TOKEN
  fi

  if [ -z "$DRIVER_TYPE" ]; then
    echo -e "${CYAN}Choose Virtualization Driver (docker / kvm / mock) [Default: docker]:${NC}"
    read -r DRIVER_CHOICE
    DRIVER_TYPE=${DRIVER_CHOICE:-docker}
  fi

  if [ "$DRIVER_TYPE" = "docker" ]; then
    install_docker
  fi

  setup_repository

  echo -e "\n${YELLOW}--> Installing Worker Node Agent dependencies...${NC}"
  cd "$INSTALL_DIR/apps/agent"
  npm install

  NODE_HOSTNAME=$(hostname)
  NODE_IP=$(get_public_ip)

  # Configure Agent .env
  cat > "$INSTALL_DIR/apps/agent/.env" << AGENTENV
MASTER_URL=$PANEL_URL
NODE_TOKEN=$NODE_TOKEN
NODE_NAME=$NODE_HOSTNAME
NODE_IP=$NODE_IP
DRIVER=$DRIVER_TYPE
PORT=$NODE_PORT
AGENTENV

  # Configure Systemd Service for Agent
  echo -e "\n${YELLOW}--> Configuring systemd service (vps-agent.service)...${NC}"
  cat > /etc/systemd/system/vps-agent.service << AGENTSERVICEOF
[Unit]
Description=VPS Worker Node Hypervisor Agent
After=network.target docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/apps/agent
ExecStart=$(which npx) tsx src/index.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
AGENTSERVICEOF

  systemctl daemon-reload
  systemctl enable vps-agent
  systemctl restart vps-agent

  echo -e "\n${GREEN}===================================================================${NC}"
  echo -e "${GREEN}${BOLD} Worker Node Agent Successfully Installed & Connected!${NC}"
  echo -e "${GREEN}===================================================================${NC}"
  echo -e "${CYAN}Master Controller:${NC} ${BOLD}$PANEL_URL${NC}"
  echo -e "${CYAN}Worker Node IP:${NC}    ${BOLD}$NODE_IP${NC}"
  echo -e "${CYAN}Virtualization:${NC}    ${BOLD}$DRIVER_TYPE${NC}"
  echo -e "${CYAN}Agent Service:${NC}     ${BOLD}systemctl status vps-agent${NC}"
  echo -e "${GREEN}===================================================================${NC}\n"
}

# Standalone Installation (Both Master Panel and Local Agent on same VPS)
install_standalone() {
  install_panel
  
  echo -e "\n${YELLOW}--> Configuring Local Worker Node on this machine...${NC}"
  install_docker
  
  # Register local node directly in database or obtain pairing token
  cd "$INSTALL_DIR/apps/agent"
  npm install

  LOCAL_TOKEN="local-node-$(openssl rand -hex 12 2>/dev/null || echo 'master-seed-token')"
  
  # Register node token in database
  node -e "
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync('$INSTALL_DIR/apps/server/data/vps_panel.sqlite');
    const id = 'node-master-local';
    const name = 'Master-Node-1';
    const ip = '$(get_public_ip)';
    db.prepare('INSERT OR REPLACE INTO nodes (id, name, hostname, ip_address, port, auth_token, status, driver, cpu_cores, ram_total, disk_total, is_drained) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      id, name, '$(hostname)', ip, $NODE_PORT, '$LOCAL_TOKEN', 'online', 'docker', 4, 8192, 100, 0
    );
    console.log('Local Node registered with token: $LOCAL_TOKEN');
  " || true

  cat > "$INSTALL_DIR/apps/agent/.env" << AGENTENV
MASTER_URL=ws://127.0.0.1:$PANEL_PORT
NODE_TOKEN=$LOCAL_TOKEN
NODE_NAME=Master-Node-1
NODE_IP=$(get_public_ip)
DRIVER=docker
PORT=$NODE_PORT
AGENTENV

  cat > /etc/systemd/system/vps-agent.service << AGENTSERVICEOF
[Unit]
Description=VPS Worker Node Hypervisor Agent
After=network.target vps-panel.service docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/apps/agent
ExecStart=$(which npx) tsx src/index.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
AGENTSERVICEOF

  systemctl daemon-reload
  systemctl enable vps-agent
  systemctl restart vps-agent

  echo -e "\n${GREEN}===================================================================${NC}"
  echo -e "${GREEN}${BOLD} Standalone Master Panel + Local Worker Node Ready!${NC}"
  echo -e "${GREEN}===================================================================${NC}"
  echo -e "${CYAN}Access Dashboard:${NC} ${BOLD}http://$(get_public_ip):${PANEL_PORT}${NC}"
  echo -e "${CYAN}Credentials:${NC}      ${BOLD}admin@vpspanel.local / admin123${NC}"
  echo -e "${GREEN}===================================================================${NC}\n"
}

# ==============================================================================
# CLI ARGUMENT PARSER & INTERACTIVE MENU
# ==============================================================================

while [[ $# -gt 0 ]]; do
  case "$1" in
    --panel)
      install_panel
      exit 0
      ;;
    --agent)
      shift
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --panel-url) PANEL_URL="$2"; shift 2 ;;
          --token) NODE_TOKEN="$2"; shift 2 ;;
          --driver) DRIVER_TYPE="$2"; shift 2 ;;
          *) shift ;;
        esac
      done
      install_agent
      exit 0
      ;;
    --standalone)
      install_standalone
      exit 0
      ;;
    --cloudflare|--domain)
      detect_os
      configure_nginx_cloudflare "$2"
      exit 0
      ;;
    --cf-tunnel)
      detect_os
      configure_cloudflare_tunnel "$2"
      exit 0
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --panel                        Install Master Panel (Controller + Web Admin Dashboard)"
      echo "  --agent                        Install Worker Node Agent (Daemon for virtualization)"
      echo "    --panel-url <URL>            Master Panel URL (e.g., http://1.2.3.4:4000 or https://domain.com)"
      echo "    --token <TOKEN>              Node Join Token from Master Panel"
      echo "    --driver <docker|kvm|mock>   Virtualization driver (default: docker)"
      echo "  --standalone                   Install both Master Panel and Local Node on this VPS"
      echo "  --domain <yourdomain.com>      Configure Cloudflare Domain with Nginx Reverse Proxy & SSL"
      echo "  --cf-tunnel <TOKEN>            Configure Cloudflare Zero Trust Tunnel"
      echo "  -h, --help                     Show this help message"
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

# Interactive Menu
echo -e "${BOLD}Select Installation & Configuration Option:${NC}\n"
echo -e "  ${CYAN}[1]${NC} ${BOLD}Master Panel${NC} (Controller API + Modern Web Admin Dashboard)"
echo -e "  ${CYAN}[2]${NC} ${BOLD}Worker Node Agent${NC} (Connect this VPS to an existing Master Cluster)"
echo -e "  ${CYAN}[3]${NC} ${BOLD}Full Standalone${NC} (Install Master Panel AND Local Worker on this VPS)"
echo -e "  ${CYAN}[4]${NC} ${BOLD}Configure Cloudflare Domain & SSL${NC} (Nginx Proxy + Real-IP or Cloudflare Tunnel)"
echo -e "  ${CYAN}[5]${NC} Exit\n"
read -p "Enter selection [1-5]: " CHOICE

case "$CHOICE" in
  1) install_panel ;;
  2) install_agent ;;
  3) install_standalone ;;
  4) detect_os; menu_cloudflare ;;
  5) echo "Cancelled."; exit 0 ;;
  *) echo -e "${RED}Invalid choice!${NC}"; exit 1 ;;
esac
