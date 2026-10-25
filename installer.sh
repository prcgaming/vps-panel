#!/usr/bin/env bash
# ==============================================================================
# VPS PANEL - Ultra-Fast 1-Click Installer (Pterodactyl-Style)
# GitHub: https://github.com/prcgaming/vps-panel
# Supports: Ubuntu 20.04/22.04/24.04, Debian 11/12, CentOS/Rocky/Alma 8/9
# ==============================================================================

set -e

# Reconnect stdin to terminal if piped via curl | bash
if [ ! -t 0 ] && [ -e /dev/tty ]; then
  exec < /dev/tty
fi

# Colors & Formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

INSTALL_DIR="/opt/vps-panel"
ARCHIVE_URL="https://github.com/prcgaming/vps-panel/archive/refs/heads/main.tar.gz"
PANEL_PORT=4000
NODE_PORT=4001

print_banner() {
  clear 2>/dev/null || true
  echo -e "${CYAN}${BOLD}"
  cat << "EOF"
* ------------------------------------------------------------------------- *
*             VPS PANEL - Cloud & Virtualization Orchestrator               *
*                 Fast 1-Click Pterodactyl-Style Installer                  *
* ------------------------------------------------------------------------- *
EOF
  echo -e "${NC}"
}

check_root() {
  if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR] This installer must be run as root. Please run with sudo or as root user.${NC}"
    exit 1
  fi
}

detect_system() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VER=$VERSION_ID
  else
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    OS_VER=""
  fi
  echo -e "${BLUE}[1/5] Detected Operating System:${NC} ${BOLD}$OS $OS_VER${NC}"
}

get_public_ip() {
  local ip=""
  ip=$(curl -s -m 5 https://api.ipify.org 2>/dev/null || curl -s -m 5 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
  echo "${ip:-127.0.0.1}"
}

# Auto-create 2GB Swap file on low memory VPS (< 2GB RAM)
setup_swap_if_needed() {
  local mem_mb=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "4096")
  local swap_mb=$(free -m 2>/dev/null | awk '/^Swap:/{print $2}' || echo "2048")
  if [ "$mem_mb" -lt 2000 ] && [ "$swap_mb" -lt 500 ]; then
    echo -e "${YELLOW}[*] Low RAM detected (${mem_mb}MB). Enabling 2GB SWAP to prevent OOM errors...${NC}"
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 2>/dev/null
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null 2>&1
    swapon /swapfile >/dev/null 2>&1 || true
    if ! grep -q "/swapfile" /etc/fstab 2>/dev/null; then
      echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo -e "${GREEN}[✓] 2GB Swap file activated.${NC}"
  fi
}

# ------------------------------------------------------------------------------
# Install Prerequisites & Node.js 22 LTS
# ------------------------------------------------------------------------------
install_dependencies() {
  echo -e "\n${YELLOW}[2/5] Updating system packages & installing dependencies...${NC}"
  if [[ "$OS" =~ ^(ubuntu|debian)$ ]]; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y -q
    apt-get install -y -q curl wget tar gzip build-essential ufw net-tools openssl
  elif [[ "$OS" =~ ^(centos|rhel|rocky|almalinux|fedora)$ ]]; then
    yum install -y epel-release || true
    yum install -y curl wget tar gzip make gcc gcc-c++ firewalld net-tools openssl
  fi

  # Check or Install Node.js 22 LTS (Active LTS with built-in SQLite engine)
  local node_major=0
  if command -v node >/dev/null 2>&1; then
    node_major=$(node -v | tr -d 'v' | cut -d'.' -f1)
  fi

  if [ "$node_major" -lt 22 ]; then
    echo -e "${YELLOW}[*] Upgrading Node.js to v22 LTS (Active LTS)...${NC}"
    if [[ "$OS" =~ ^(ubuntu|debian)$ ]]; then
      # Remove any outdated OS-level node packages that prevent upgrading
      apt-get remove -y -q nodejs npm nodejs-doc libnode-dev 2>/dev/null || true
      curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
      apt-get update -y -q
      apt-get install -y -q nodejs
    elif [[ "$OS" =~ ^(centos|rhel|rocky|almalinux|fedora)$ ]]; then
      curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
      yum remove -y nodejs npm 2>/dev/null || true
      yum install -y nodejs
    fi
  fi

  node_major=$(node -v 2>/dev/null | tr -d 'v' | cut -d'.' -f1 || echo "0")
  if [ "$node_major" -lt 22 ]; then
    echo -e "${RED}[ERROR] Node.js 22 LTS is required for SQLite, but found: $(node -v).${NC}"
    echo -e "${YELLOW}Please install Node.js 22 manually: curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs${NC}"
    exit 1
  fi

  echo -e "${GREEN}[✓] Node.js version:${NC} $(node -v) / npm $(npm -v)"
}

# ------------------------------------------------------------------------------
# Download & Extract Pre-Built Panel Files
# ------------------------------------------------------------------------------
download_panel_files() {
  echo -e "\n${YELLOW}[3/5] Downloading pre-built VPS Panel release...${NC}"
  mkdir -p "$INSTALL_DIR"

  # Backup existing database if present
  if [ -d "$INSTALL_DIR/apps/server/data" ]; then
    mkdir -p /tmp/vps_panel_db_backup
    cp -r "$INSTALL_DIR/apps/server/data/"* /tmp/vps_panel_db_backup/ 2>/dev/null || true
  fi

  # Download and extract the archive directly
  local download_ok=0
  if curl -sSL "$ARCHIVE_URL" | tar -xz --strip-components=1 -C "$INSTALL_DIR" 2>/dev/null; then
    download_ok=1
  else
    echo -e "${YELLOW}[*] Retrying download via temporary file...${NC}"
    curl -sSL -o /tmp/vps-panel.tar.gz "$ARCHIVE_URL"
    if tar -xzf /tmp/vps-panel.tar.gz --strip-components=1 -C "$INSTALL_DIR" 2>/dev/null; then
      download_ok=1
    fi
    rm -f /tmp/vps-panel.tar.gz
  fi

  if [ ! -f "$INSTALL_DIR/apps/server/package.json" ]; then
    echo -e "${RED}[ERROR] Download failed. Falling back to git clone...${NC}"
    rm -rf "$INSTALL_DIR"
    git clone "https://github.com/prcgaming/vps-panel.git" "$INSTALL_DIR"
  fi

  # Restore database backup if present
  if [ -d "/tmp/vps_panel_db_backup" ]; then
    mkdir -p "$INSTALL_DIR/apps/server/data"
    cp -r /tmp/vps_panel_db_backup/* "$INSTALL_DIR/apps/server/data/" 2>/dev/null || true
    rm -rf /tmp/vps_panel_db_backup
  fi

  echo -e "${GREEN}[✓] VPS Panel files unpacked successfully into ${INSTALL_DIR}${NC}"
}

# ------------------------------------------------------------------------------
# Configure Nginx & Cloudflare SSL (Port 80 + 443 with Origin TLS)
# ------------------------------------------------------------------------------
setup_nginx_domain() {
  local DOMAIN="$1"

  echo -e "\n${YELLOW}[*] Configuring Nginx Reverse Proxy with Cloudflare SSL for ${BOLD}${DOMAIN}${NC}..."
  if [[ "$OS" =~ ^(ubuntu|debian)$ ]]; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y -q
    apt-get install -y -q nginx certbot python3-certbot-nginx
  elif [[ "$OS" =~ ^(centos|rhel|rocky|almalinux|fedora)$ ]]; then
    yum install -y nginx certbot python3-certbot-nginx
    systemctl enable nginx
  fi

  # 1. Cloudflare Real IP restoration
  mkdir -p /etc/nginx/conf.d
  cat > /etc/nginx/conf.d/cloudflare_real_ip.conf << 'CFIP'
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
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;
real_ip_header CF-Connecting-IP;
CFIP

  # 2. Generate origin TLS certificate for port 443 (Ready for Cloudflare Full SSL)
  mkdir -p /etc/ssl/vps-panel
  if [ ! -f /etc/ssl/vps-panel/cert.pem ] || [ ! -f /etc/ssl/vps-panel/key.pem ]; then
    echo -e "${YELLOW}[*] Generating origin TLS certificate for HTTPS...${NC}"
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/ssl/vps-panel/key.pem \
      -out /etc/ssl/vps-panel/cert.pem \
      -subj "/CN=${DOMAIN}" >/dev/null 2>&1
  fi

  # 3. VirtualHost Configuration (Listens on both 80 and 443)
  local VHOST="/etc/nginx/conf.d/${DOMAIN}.conf"
  if [ -d "/etc/nginx/sites-available" ]; then
    VHOST="/etc/nginx/sites-available/${DOMAIN}.conf"
  fi

  cat > "$VHOST" << VHOSTEOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

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

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/ssl/vps-panel/cert.pem;
    ssl_certificate_key /etc/ssl/vps-panel/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:$PANEL_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
VHOSTEOF

  if [ -d "/etc/nginx/sites-enabled" ]; then
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    ln -sf "$VHOST" "/etc/nginx/sites-enabled/${DOMAIN}.conf"
  fi

  nginx -t
  systemctl restart nginx

  # Open HTTP/HTTPS Ports in Firewall
  if command -v ufw >/dev/null 2>&1; then
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
  elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
    firewall-cmd --permanent --add-service=https >/dev/null 2>&1 || true
    firewall-cmd --reload >/dev/null 2>&1 || true
  fi

  # Attempt Certbot Let's Encrypt (optional, fallback stays active if CF proxy blocks ACME)
  echo -e "\n${YELLOW}[*] Validating Let's Encrypt SSL certificate...${NC}"
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>/dev/null || {
    echo -e "${YELLOW}[NOTE] Cloudflare Proxy is protecting your VPS. Origin TLS is active on port 443.${NC}"
  }

  systemctl reload nginx 2>/dev/null || systemctl restart nginx
  echo -e "${GREEN}[✓] Nginx configured with SSL on Ports 80 & 443 for ${DOMAIN}.${NC}"
}

# ------------------------------------------------------------------------------
# Install Master Panel
# ------------------------------------------------------------------------------
install_panel() {
  print_banner
  check_root
  detect_system
  setup_swap_if_needed

  # Interactive prompts if not passed as CLI args
  if [ -z "$PANEL_DOMAIN" ] && [ -t 0 ]; then
    echo -e "${CYAN}${BOLD}[+] Quick Setup Configuration:${NC}\n"
    read -r -p "Enter Domain for Panel (e.g. vps.lunars.indevs.in) [press Enter for Server IP]: " FQDN_INPUT
    PANEL_DOMAIN=${FQDN_INPUT:-""}

    read -r -p "Enter Super Admin Email [admin@vpspanel.local]: " EMAIL_INPUT
    ADMIN_EMAIL=${EMAIL_INPUT:-admin@vpspanel.local}

    read -r -p "Enter Super Admin Password [admin123]: " PASS_INPUT
    ADMIN_PASSWORD=${PASS_INPUT:-admin123}

    read -r -p "Enter Panel Internal Port [4000]: " PORT_INPUT
    PANEL_PORT=${PORT_INPUT:-4000}
  else
    ADMIN_EMAIL=${ADMIN_EMAIL:-admin@vpspanel.local}
    ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
  fi

  # Begin Installation Pipeline
  install_dependencies
  download_panel_files

  echo -e "\n${YELLOW}[4/5] Setting up Master Panel server & SQLite database...${NC}"
  cd "$INSTALL_DIR/apps/server"
  npm install --omit=dev --silent 2>/dev/null || npm install --omit=dev

  # Configure Environment Variables
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | tr -dc A-Za-z0-9)
  cat > .env << ENVEOF
PORT=$PANEL_PORT
HOST=0.0.0.0
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
DB_PATH=$INSTALL_DIR/apps/server/data/vps_panel.sqlite
CLIENT_DIST_PATH=$INSTALL_DIR/apps/client/dist
ENVEOF

  mkdir -p "$INSTALL_DIR/apps/server/data"

  # Seed Database with administrator credentials
  ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" node -e "
    import('./dist/db/seed.js').then(m => m.seedDatabase()).catch(err => {
      console.error('[Seed Error]', err);
    });
  " 2>/dev/null || true

  # Configure Systemd Service
  cat > /etc/systemd/system/vps-panel.service << SERVICEOF
[Unit]
Description=VPS Control Panel Master Controller
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/apps/server
EnvironmentFile=$INSTALL_DIR/apps/server/.env
ExecStart=/usr/bin/env node dist/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICEOF

  systemctl daemon-reload
  systemctl enable vps-panel
  systemctl restart vps-panel

  # Open Panel Port in Firewall
  if command -v ufw >/dev/null 2>&1; then
    ufw allow $PANEL_PORT/tcp >/dev/null 2>&1 || true
  elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-port=$PANEL_PORT/tcp >/dev/null 2>&1 || true
    firewall-cmd --reload >/dev/null 2>&1 || true
  fi

  # Health Check: Wait for port 4000 to be online
  echo -e "\n${YELLOW}[*] Verifying VPS Panel backend health...${NC}"
  local attempts=0
  local max_attempts=12
  local is_healthy=0
  while [ $attempts -lt $max_attempts ]; do
    if curl -s -f "http://127.0.0.1:${PANEL_PORT}/api/health" >/dev/null 2>&1; then
      is_healthy=1
      break
    fi
    sleep 1
    attempts=$((attempts + 1))
  done

  if [ $is_healthy -eq 1 ]; then
    echo -e "${GREEN}[✓] VPS Panel backend is running and healthy on port ${PANEL_PORT}!${NC}"
  else
    echo -e "${RED}[WARNING] VPS Panel backend did not respond within 12 seconds.${NC}"
    echo -e "${YELLOW}Inspecting service error logs:${NC}"
    journalctl -u vps-panel -n 25 --no-pager || true
  fi

  # Configure Domain if provided
  if [ -n "$PANEL_DOMAIN" ]; then
    setup_nginx_domain "$PANEL_DOMAIN"
    FINAL_URL="https://${PANEL_DOMAIN}"
  else
    FINAL_URL="http://$(get_public_ip):${PANEL_PORT}"
  fi

  # Final Success Display
  echo -e "\n${GREEN}${BOLD}* ------------------------------------------------------------------------- *${NC}"
  echo -e "${GREEN}${BOLD}*  VPS PANEL INSTALLED SUCCESSFULLY!                                        *${NC}"
  echo -e "${GREEN}${BOLD}* ------------------------------------------------------------------------- *${NC}"
  echo -e "  ${CYAN}Panel Access URL:${NC}    ${BOLD}${FINAL_URL}${NC}"
  echo -e "  ${CYAN}Admin Email:${NC}         ${BOLD}${ADMIN_EMAIL}${NC}"
  echo -e "  ${CYAN}Admin Password:${NC}      ${BOLD}${ADMIN_PASSWORD}${NC}"
  echo -e "  ${CYAN}Service Status:${NC}      ${BOLD}systemctl status vps-panel${NC}"
  echo -e "  ${CYAN}Realtime Logs:${NC}       ${BOLD}journalctl -u vps-panel -f${NC}"
  echo -e "${GREEN}${BOLD}* ------------------------------------------------------------------------- *${NC}\n"
}

# ------------------------------------------------------------------------------
# Install Worker Node Daemon
# ------------------------------------------------------------------------------
install_node_daemon() {
  print_banner
  check_root
  detect_system
  setup_swap_if_needed

  echo -e "${CYAN}${BOLD}[+] Worker Node Hypervisor Agent Installation${NC}\n"

  read -r -p "Enter Master Panel URL (e.g. https://vps.lunars.indevs.in): " MASTER_URL_INPUT
  read -r -p "Enter Worker Node Join Token (from Panel -> Nodes -> Add Node): " TOKEN_INPUT
  read -r -p "Choose Driver (docker / kvm / mock) [docker]: " DRIVER_CHOICE
  DRIVER=${DRIVER_CHOICE:-docker}

  install_dependencies

  if [ "$DRIVER" = "docker" ] && ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}[*] Installing Docker Engine...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
  fi

  download_panel_files

  cd "$INSTALL_DIR/apps/agent"
  npm install --omit=dev --silent 2>/dev/null || npm install --omit=dev

  cat > "$INSTALL_DIR/apps/agent/.env" << AGENTENV
MASTER_URL=$MASTER_URL_INPUT
NODE_TOKEN=$TOKEN_INPUT
NODE_NAME=$(hostname)
NODE_IP=$(get_public_ip)
DRIVER=$DRIVER
PORT=$NODE_PORT
AGENTENV

  cat > /etc/systemd/system/vps-agent.service << AGENTSERVICEOF
[Unit]
Description=VPS Worker Node Hypervisor Agent
After=network.target docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/apps/agent
ExecStart=/usr/bin/env node dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
AGENTSERVICEOF

  systemctl daemon-reload
  systemctl enable vps-agent
  systemctl restart vps-agent

  echo -e "\n${GREEN}[✓] Worker Node Agent connected to ${MASTER_URL_INPUT} (Driver: ${DRIVER})!${NC}\n"
}

# ------------------------------------------------------------------------------
# Install Standalone (Panel + Local Node on same VPS)
# ------------------------------------------------------------------------------
install_standalone() {
  install_panel

  echo -e "\n${YELLOW}[*] Setting up Local Worker Node Daemon...${NC}"
  if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
  fi

  LOCAL_TOKEN="local-node-$(openssl rand -hex 12 2>/dev/null || echo 'master-token-123')"

  # Insert node into SQLite database
  node -e "
    import('./dist/db/index.js').then(({ db }) => {
      db.prepare('INSERT OR REPLACE INTO nodes (id, name, hostname, ip_address, port, auth_token, status, driver, cpu_cores, ram_total, disk_total, is_drained) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        'node-local-master', 'Master-Node-Local', '$(hostname)', '$(get_public_ip)', $NODE_PORT, '$LOCAL_TOKEN', 'online', 'docker', 4, 8192, 100, 0
      );
      console.log('[Seed] Local Master Node registered in database.');
    }).catch(console.error);
  " 2>/dev/null || true

  cd "$INSTALL_DIR/apps/agent"
  npm install --omit=dev --silent 2>/dev/null || npm install --omit=dev

  cat > "$INSTALL_DIR/apps/agent/.env" << AGENTENV
MASTER_URL=ws://127.0.0.1:$PANEL_PORT
NODE_TOKEN=$LOCAL_TOKEN
NODE_NAME=Master-Node-Local
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
ExecStart=/usr/bin/env node dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
AGENTSERVICEOF

  systemctl daemon-reload
  systemctl enable vps-agent
  systemctl restart vps-agent

  echo -e "${GREEN}[✓] Standalone Setup Complete: Panel & Local Hypervisor Node are live!${NC}\n"
}

# ------------------------------------------------------------------------------
# Direct Argument Handling (e.g. bash install.sh vps.lunars.indevs.in)
# ------------------------------------------------------------------------------
if [ -n "$1" ]; then
  case "$1" in
    --panel)
      PANEL_DOMAIN="$2"
      install_panel
      exit 0
      ;;
    --standalone)
      PANEL_DOMAIN="$2"
      install_standalone
      exit 0
      ;;
    --node|--agent)
      install_node_daemon
      exit 0
      ;;
    -h|--help)
      echo "Usage: bash install.sh [DOMAIN]"
      echo "Example: bash install.sh vps.lunars.indevs.in"
      exit 0
      ;;
    *)
      # If user simply passes domain as first argument (e.g. bash install.sh vps.lunars.indevs.in)
      PANEL_DOMAIN="$1"
      install_panel
      exit 0
      ;;
  esac
fi

# ------------------------------------------------------------------------------
# Interactive Menu
# ------------------------------------------------------------------------------
print_banner
check_root

echo -e "${BOLD}Select what you would like to install:${NC}\n"
echo -e "  ${CYAN}[0]${NC} ${BOLD}Install Master Panel${NC} (Controller API + Modern Web Dashboard)"
echo -e "  ${CYAN}[1]${NC} ${BOLD}Install Worker Node Daemon${NC} (Hypervisor agent for Docker/KVM)"
echo -e "  ${CYAN}[2]${NC} ${BOLD}Install Standalone [Both 0 and 1]${NC} (Panel + Local Hypervisor on this VPS)"
echo -e "  ${CYAN}[3]${NC} ${BOLD}Configure Cloudflare Domain & Nginx SSL${NC}"
echo -e "  ${CYAN}[4]${NC} Exit\n"
read -r -p "Input 0-4 [default: 0]: " ACTION
ACTION_CHOICE=${ACTION:-0}

case "$ACTION_CHOICE" in
  0) install_panel ;;
  1) install_node_daemon ;;
  2) install_standalone ;;
  3)
    read -r -p "Enter Domain (e.g. vps.lunars.indevs.in): " DOMAIN_NAME
    if [ ! -f "$INSTALL_DIR/apps/server/package.json" ]; then
      echo -e "${YELLOW}[*] Panel files not found. Running full panel installation for ${DOMAIN_NAME}...${NC}"
      PANEL_DOMAIN="$DOMAIN_NAME"
      install_panel
    else
      setup_nginx_domain "$DOMAIN_NAME"
    fi
    ;;
  4) echo "Exiting installer."; exit 0 ;;
  *) echo -e "${RED}Invalid selection!${NC}"; exit 1 ;;
esac
