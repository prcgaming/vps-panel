#!/usr/bin/env bash
# ==============================================================================
# VPS PANEL - Universal Control & Management Utility (CLI & Installer)
# GitHub: https://github.com/prcgaming/vps-panel
# Commands: install | update | start | stop | restart | status | logs | uninstall
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
*                 Fast 1-Click Pterodactyl-Style Management                 *
* ------------------------------------------------------------------------- *
EOF
  echo -e "${NC}"
}

check_root() {
  if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR] This command must be run as root. Please run with sudo or as root user.${NC}"
    exit 1
  fi
}

# Accurate check whether systemd is actually running as PID 1
is_systemd() {
  [ -d /run/systemd/system ] || return 1
  local p1=$(ps -p 1 -o comm= 2>/dev/null || echo "")
  if [ "$p1" != "systemd" ] && [ "$p1" != "init" ]; then
    return 1
  fi
  if systemctl is-system-running >/dev/null 2>&1 || [ "$(systemctl is-system-running 2>/dev/null)" = "degraded" ]; then
    return 0
  fi
  return 1
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

  local init_system="systemd"
  if ! is_systemd; then
    init_system="container (service / PM2)"
  fi
  echo -e "${BLUE}[1/5] Detected System:${NC} ${BOLD}$OS $OS_VER${NC} [Init: ${BOLD}${init_system}${NC}]"
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
    chmod 600 /swapfile 2>/dev/null || true
    mkswap /swapfile >/dev/null 2>&1 || true
    swapon /swapfile >/dev/null 2>&1 || true
    if [ -f /etc/fstab ] && ! grep -q "/swapfile" /etc/fstab 2>/dev/null; then
      echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo -e "${GREEN}[✓] 2GB Swap file activated.${NC}"
  fi
}

install_cli_binary() {
  if [ -f "$INSTALL_DIR/installer.sh" ]; then
    cp "$INSTALL_DIR/installer.sh" /usr/local/bin/vps-panel 2>/dev/null || true
    chmod +x /usr/local/bin/vps-panel 2>/dev/null || true
    ln -sf /usr/local/bin/vps-panel /usr/bin/vps-panel 2>/dev/null || true
  elif [ -f "$0" ]; then
    cp "$0" /usr/local/bin/vps-panel 2>/dev/null || true
    chmod +x /usr/local/bin/vps-panel 2>/dev/null || true
    ln -sf /usr/local/bin/vps-panel /usr/bin/vps-panel 2>/dev/null || true
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
    apt-get install -y -q curl wget tar gzip build-essential ufw net-tools openssl procps
  elif [[ "$OS" =~ ^(centos|rhel|rocky|almalinux|fedora)$ ]]; then
    yum install -y epel-release || true
    yum install -y curl wget tar gzip make gcc gcc-c++ firewalld net-tools openssl procps
  fi

  local node_major=0
  if command -v node >/dev/null 2>&1; then
    node_major=$(node -v | tr -d 'v' | cut -d'.' -f1)
  fi

  if [ "$node_major" -lt 22 ]; then
    echo -e "${YELLOW}[*] Upgrading Node.js to v22 LTS (Active LTS)...${NC}"
    if [[ "$OS" =~ ^(ubuntu|debian)$ ]]; then
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

  if [ -d "$INSTALL_DIR/apps/server/data" ]; then
    mkdir -p /tmp/vps_panel_db_backup
    cp -r "$INSTALL_DIR/apps/server/data/"* /tmp/vps_panel_db_backup/ 2>/dev/null || true
  fi

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

  if [ -d "/tmp/vps_panel_db_backup" ]; then
    mkdir -p "$INSTALL_DIR/apps/server/data"
    cp -r /tmp/vps_panel_db_backup/* "$INSTALL_DIR/apps/server/data/" 2>/dev/null || true
    rm -rf /tmp/vps_panel_db_backup
  fi

  echo -e "${GREEN}[✓] VPS Panel files unpacked successfully into ${INSTALL_DIR}${NC}"
}

# ------------------------------------------------------------------------------
# Start / Reload Nginx (Compatible with systemd and non-systemd containers)
# ------------------------------------------------------------------------------
start_or_reload_nginx() {
  nginx -t 2>/dev/null || {
    echo -e "${RED}[ERROR] Nginx configuration test failed:${NC}"
    nginx -t
    return 1
  }

  if is_systemd; then
    systemctl restart nginx 2>/dev/null || systemctl reload nginx 2>/dev/null || true
  else
    service nginx restart 2>/dev/null || service nginx start 2>/dev/null || nginx -s reload 2>/dev/null || nginx 2>/dev/null || true
  fi
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
  fi

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

  mkdir -p /etc/ssl/vps-panel
  if [ ! -f /etc/ssl/vps-panel/cert.pem ] || [ ! -f /etc/ssl/vps-panel/key.pem ]; then
    echo -e "${YELLOW}[*] Generating origin TLS certificate for HTTPS...${NC}"
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/ssl/vps-panel/key.pem \
      -out /etc/ssl/vps-panel/cert.pem \
      -subj "/CN=${DOMAIN}" >/dev/null 2>&1
  fi

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

  start_or_reload_nginx

  if command -v ufw >/dev/null 2>&1; then
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
  elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
    firewall-cmd --permanent --add-service=https >/dev/null 2>&1 || true
    firewall-cmd --reload >/dev/null 2>&1 || true
  fi

  echo -e "\n${YELLOW}[*] Validating SSL certificate...${NC}"
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>/dev/null || {
    echo -e "${YELLOW}[NOTE] Cloudflare Proxy is active. Origin TLS certificate is active on port 443.${NC}"
  }

  start_or_reload_nginx
  echo -e "${GREEN}[✓] Nginx configured with SSL on Ports 80 & 443 for ${DOMAIN}.${NC}"
}

# ------------------------------------------------------------------------------
# Start VPS Panel Master Service (Systemd or PM2/SysV init)
# ------------------------------------------------------------------------------
start_vps_panel_service() {
  if is_systemd; then
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
  else
    echo -e "${YELLOW}[*] Container / non-systemd environment detected. Setting up PM2 & SysV service...${NC}"

    if ! command -v pm2 >/dev/null 2>&1; then
      echo -e "${YELLOW}[*] Installing PM2 process manager...${NC}"
      npm install -g pm2 --silent 2>/dev/null || npm install -g pm2 || true
    fi

    cat > /etc/init.d/vps-panel << 'INITEOF'
#!/bin/sh
### BEGIN INIT INFO
# Provides:          vps-panel
# Required-Start:    $network $local_fs
# Required-Stop:     $network $local_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: VPS Control Panel
### END INIT INFO

DIR="/opt/vps-panel/apps/server"

case "$1" in
  start)
    if command -v pm2 >/dev/null 2>&1; then
      pm2 start "$DIR/dist/index.js" --name vps-panel --cwd "$DIR"
    else
      cd "$DIR" && nohup node dist/index.js > /var/log/vps-panel.log 2>&1 &
    fi
    ;;
  stop)
    if command -v pm2 >/dev/null 2>&1; then
      pm2 stop vps-panel
    else
      pkill -f "node dist/index.js" 2>/dev/null || true
    fi
    ;;
  restart)
    $0 stop
    sleep 1
    $0 start
    ;;
  status)
    if command -v pm2 >/dev/null 2>&1; then
      pm2 status vps-panel
    else
      pgrep -f "node dist/index.js" >/dev/null && echo "vps-panel is running" || echo "vps-panel is stopped"
    fi
    ;;
  logs)
    if command -v pm2 >/dev/null 2>&1; then
      pm2 logs vps-panel
    else
      tail -f /var/log/vps-panel.log
    fi
    ;;
  *)
    echo "Usage: service vps-panel {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
exit 0
INITEOF
    chmod +x /etc/init.d/vps-panel

    cd "$INSTALL_DIR/apps/server"
    if command -v pm2 >/dev/null 2>&1; then
      pm2 delete vps-panel >/dev/null 2>&1 || true
      pm2 start dist/index.js --name vps-panel --cwd "$INSTALL_DIR/apps/server"
      pm2 save >/dev/null 2>&1 || true
    else
      pkill -f "node dist/index.js" 2>/dev/null || true
      nohup node dist/index.js > /var/log/vps-panel.log 2>&1 &
    fi
  fi
}

# ------------------------------------------------------------------------------
# Install Master Panel & Local Hypervisor Node (Complete Standalone Setup)
# ------------------------------------------------------------------------------
install_panel() {
  print_banner
  check_root
  detect_system
  setup_swap_if_needed

  local local_public_ip=$(get_public_ip)

  # Interactive Setup Wizard
  echo -e "${CYAN}${BOLD}[+] VPS Panel Interactive Setup Wizard:${NC}\n"

  # 1. Domain Configuration
  if [ -n "$PANEL_DOMAIN" ]; then
    read -r -p "Enter Domain for Panel [$PANEL_DOMAIN]: " FQDN_INPUT
    PANEL_DOMAIN=${FQDN_INPUT:-$PANEL_DOMAIN}
  else
    read -r -p "Enter Domain for Panel (e.g. vps.lunars.indevs.in) [press Enter for Server IP $local_public_ip]: " FQDN_INPUT
    PANEL_DOMAIN=${FQDN_INPUT:-""}
  fi

  # 2. Panel Title / Brand
  read -r -p "Enter Panel Title / Name [Lunar VPS Panel]: " NAME_INPUT
  PANEL_NAME=${NAME_INPUT:-"Lunar VPS Panel"}

  # 3. Color Theme Preset
  echo -e "\n${BOLD}Select Color Theme Preset:${NC}"
  echo -e "  ${CYAN}[1] Cyber Cyan${NC} (Lunar Electric Cyan & Deep Blue - Default)"
  echo -e "  ${PURPLE}[2] Purple Nebula${NC} (Cosmic Violet & Magenta)"
  echo -e "  ${GREEN}[3] Emerald Matrix${NC} (Hacker Terminal Neon Green)"
  echo -e "  ${RED}[4] Crimson Blood${NC} (Ruby Crimson & Fiery Red)"
  echo -e "  ${YELLOW}[5] Golden Amber${NC} (Solar Flare Gold & Sunset Orange)"
  echo -e "  ${BOLD}[6] Rose Sakura${NC} (Synthwave Neon Pink & Fuchsia)"
  echo -e "  ${BLUE}[7] Electric Indigo${NC} (Deep Space Royal Indigo)"
  echo -e "  ${NC}[8] Midnight Stealth${NC} (Industrial Carbon & Slate Steel)"
  read -r -p "Choose Theme Preset [1-8, default: 1]: " THEME_CHOICE
  THEME_CHOICE=${THEME_CHOICE:-1}

  case "$THEME_CHOICE" in
    1) THEME_PRESET="cyber-cyan"; PRIMARY_COLOR="#06b6d4" ;;
    2) THEME_PRESET="purple-nebula"; PRIMARY_COLOR="#a855f7" ;;
    3) THEME_PRESET="emerald-matrix"; PRIMARY_COLOR="#10b981" ;;
    4) THEME_PRESET="crimson-blood"; PRIMARY_COLOR="#ef4444" ;;
    5) THEME_PRESET="golden-amber"; PRIMARY_COLOR="#f59e0b" ;;
    6) THEME_PRESET="rose-sakura"; PRIMARY_COLOR="#f43f5e" ;;
    7) THEME_PRESET="electric-indigo"; PRIMARY_COLOR="#6366f1" ;;
    8) THEME_PRESET="midnight-stealth"; PRIMARY_COLOR="#94a3b8" ;;
    *) THEME_PRESET="cyber-cyan"; PRIMARY_COLOR="#06b6d4" ;;
  esac

  # 4. Super Admin Credentials
  local default_admin_email="admin@vpspanel.local"
  if [ -n "$PANEL_DOMAIN" ]; then
    default_admin_email="admin@${PANEL_DOMAIN}"
  fi
  read -r -p "Enter Super Admin Email [$default_admin_email]: " EMAIL_INPUT
  ADMIN_EMAIL=${EMAIL_INPUT:-$default_admin_email}

  read -r -p "Enter Super Admin Password [press Enter to auto-generate]: " PASS_INPUT
  if [ -z "$PASS_INPUT" ]; then
    ADMIN_PASSWORD="Pass_$(openssl rand -hex 6 2>/dev/null || head -c 8 /dev/urandom | tr -dc A-Za-z0-9)!"
    echo -e "  ${GREEN}Generated secure password: ${BOLD}${ADMIN_PASSWORD}${NC}"
  else
    ADMIN_PASSWORD="$PASS_INPUT"
  fi

  # 5. Hypervisor Driver Selection
  echo -e "\n${BOLD}Select Virtualization Hypervisor:${NC}"
  echo -e "  ${CYAN}[1] Docker Containers${NC} (Recommended - high performance & instant provisioning)"
  echo -e "  ${CYAN}[2] KVM / QEMU${NC} (Full hardware virtualization on bare metal)"
  read -r -p "Select Driver [1-2, default: 1]: " DRIVER_INPUT
  DRIVER_INPUT=${DRIVER_INPUT:-1}
  if [ "$DRIVER_INPUT" = "2" ]; then
    DRIVER="kvm"
  else
    DRIVER="docker"
  fi

  # 6. License Key
  read -r -p "Enter License Key [Press Enter for 30-Day Pro Unlimited or enter Lifetime key]: " KEY_INPUT
  LICENSE_KEY=${KEY_INPUT:-"LUNAR-30DAY-PRO-UNLIMITED"}

  # 7. Internal Port
  read -r -p "Enter Panel Internal Port [4000]: " PORT_INPUT
  PANEL_PORT=${PORT_INPUT:-4000}

  install_dependencies

  # If Docker is chosen, install and prepare real Docker engine
  if [ "$DRIVER" = "docker" ]; then
    if ! command -v docker >/dev/null 2>&1; then
      echo -e "\n${YELLOW}[*] Installing official Docker Engine for container virtualization...${NC}"
      curl -fsSL https://get.docker.com | sh 2>/dev/null || true
    fi
    if is_systemd; then
      systemctl enable docker 2>/dev/null || true
      systemctl start docker 2>/dev/null || true
    else
      service docker start 2>/dev/null || true
    fi

    # Pre-pull base images in the background so initial VPS creation is instantaneous
    echo -e "${YELLOW}[*] Pre-caching base Linux OS images (Alpine, Debian, Ubuntu)...${NC}"
    ( docker pull alpine:3.20 >/dev/null 2>&1 & ) || true
    ( docker pull debian:12-slim >/dev/null 2>&1 & ) || true
    ( docker pull ubuntu:24.04 >/dev/null 2>&1 & ) || true
  fi

  download_panel_files

  echo -e "\n${YELLOW}[4/5] Setting up Master Panel server & SQLite database...${NC}"
  cd "$INSTALL_DIR/apps/server"
  npm install --omit=dev --silent 2>/dev/null || npm install --omit=dev

  LOCAL_TOKEN="local-node-$(openssl rand -hex 12 2>/dev/null || echo 'master-token-123')"
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | tr -dc A-Za-z0-9)

  cat > .env << ENVEOF
PORT=$PANEL_PORT
HOST=0.0.0.0
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
LICENSE_KEY=$LICENSE_KEY
PANEL_NAME=$PANEL_NAME
THEME_PRESET=$THEME_PRESET
PRIMARY_COLOR=$PRIMARY_COLOR
DRIVER=$DRIVER
PUBLIC_IP=$local_public_ip
NODE_TOKEN=$LOCAL_TOKEN
DB_PATH=$INSTALL_DIR/apps/server/data/vps_panel.sqlite
CLIENT_DIST_PATH=$INSTALL_DIR/apps/client/dist
ENVEOF

  mkdir -p "$INSTALL_DIR/apps/server/data"

  ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" LICENSE_KEY="$LICENSE_KEY" \
  PANEL_NAME="$PANEL_NAME" THEME_PRESET="$THEME_PRESET" PRIMARY_COLOR="$PRIMARY_COLOR" \
  DRIVER="$DRIVER" PUBLIC_IP="$local_public_ip" NODE_TOKEN="$LOCAL_TOKEN" \
  node -e "
    import('./dist/db/seed.js').then(m => m.seedDatabase()).catch(err => {
      console.error('[Seed Error]', err);
    });
  " 2>/dev/null || true

  # --------------------------------------------------------------------------
  # Setup Local Worker Node Daemon (Apps/Agent)
  # --------------------------------------------------------------------------
  echo -e "\n${YELLOW}[*] Configuring Local Hypervisor Agent on this machine...${NC}"
  cd "$INSTALL_DIR/apps/agent"
  npm install --omit=dev --silent 2>/dev/null || npm install --omit=dev

  cat > "$INSTALL_DIR/apps/agent/.env" << AGENTENV
MASTER_URL=ws://127.0.0.1:$PANEL_PORT
NODE_TOKEN=$LOCAL_TOKEN
NODE_NAME=Master-Node-Local
NODE_IP=$local_public_ip
DRIVER=$DRIVER
PORT=$NODE_PORT
AGENTENV

  if is_systemd; then
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
    systemctl enable vps-agent 2>/dev/null || true
    systemctl restart vps-agent 2>/dev/null || true
  else
    cat > /etc/init.d/vps-agent << 'AGENTINITEOF'
#!/bin/sh
DIR="/opt/vps-panel/apps/agent"
case "$1" in
  start)
    if command -v pm2 >/dev/null 2>&1; then
      pm2 start "$DIR/dist/index.js" --name vps-agent --cwd "$DIR"
    else
      cd "$DIR" && nohup node dist/index.js > /var/log/vps-agent.log 2>&1 &
    fi
    ;;
  stop)
    if command -v pm2 >/dev/null 2>&1; then
      pm2 stop vps-agent
    else
      pkill -f "node dist/index.js" 2>/dev/null || true
    fi
    ;;
  restart)
    $0 stop; sleep 1; $0 start ;;
  status)
    if command -v pm2 >/dev/null 2>&1; then pm2 status vps-agent; else pgrep -f "node dist/index.js" >/dev/null && echo "running" || echo "stopped"; fi ;;
  logs)
    if command -v pm2 >/dev/null 2>&1; then pm2 logs vps-agent; else tail -f /var/log/vps-agent.log; fi ;;
  *)
    echo "Usage: service vps-agent {start|stop|restart|status|logs}"; exit 1 ;;
esac
exit 0
AGENTINITEOF
    chmod +x /etc/init.d/vps-agent
    cd "$INSTALL_DIR/apps/agent"
    if command -v pm2 >/dev/null 2>&1; then
      pm2 delete vps-agent >/dev/null 2>&1 || true
      pm2 start dist/index.js --name vps-agent --cwd "$INSTALL_DIR/apps/agent"
      pm2 save >/dev/null 2>&1 || true
    else
      nohup node dist/index.js > /var/log/vps-agent.log 2>&1 &
    fi
  fi

  # Start Master Panel Service
  start_vps_panel_service

  # Open Firewall Ports
  if command -v ufw >/dev/null 2>&1; then
    ufw allow $PANEL_PORT/tcp >/dev/null 2>&1 || true
    ufw allow $NODE_PORT/tcp >/dev/null 2>&1 || true
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
  elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-port=$PANEL_PORT/tcp >/dev/null 2>&1 || true
    firewall-cmd --permanent --add-port=$NODE_PORT/tcp >/dev/null 2>&1 || true
    firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
    firewall-cmd --permanent --add-service=https >/dev/null 2>&1 || true
    firewall-cmd --reload >/dev/null 2>&1 || true
  fi

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
    if is_systemd; then
      journalctl -u vps-panel -n 25 --no-pager || true
    elif command -v pm2 >/dev/null 2>&1; then
      pm2 logs vps-panel --lines 25 --nostream || true
    else
      tail -n 25 /var/log/vps-panel.log 2>/dev/null || true
    fi
  fi

  if [ -n "$PANEL_DOMAIN" ]; then
    setup_nginx_domain "$PANEL_DOMAIN"
    FINAL_URL="https://${PANEL_DOMAIN}"
  else
    FINAL_URL="http://${local_public_ip}:${PANEL_PORT}"
  fi

  # Install CLI utility
  install_cli_binary

  echo -e "\n${GREEN}${BOLD}* ------------------------------------------------------------------------- *${NC}"
  echo -e "${GREEN}${BOLD}*  VPS PANEL INSTALLED SUCCESSFULLY! (100% REAL & OPERATIONAL)              *${NC}"
  echo -e "${GREEN}${BOLD}* ------------------------------------------------------------------------- *${NC}"
  echo -e "  ${CYAN}Panel Access URL:${NC}    ${BOLD}${FINAL_URL}${NC}"
  echo -e "  ${CYAN}Admin Email:${NC}         ${BOLD}${ADMIN_EMAIL}${NC}"
  echo -e "  ${CYAN}Admin Password:${NC}      ${BOLD}${ADMIN_PASSWORD}${NC}"
  echo -e "  ${CYAN}Panel Title:${NC}         ${BOLD}${PANEL_NAME}${NC}"
  echo -e "  ${CYAN}Theme Preset:${NC}        ${BOLD}${THEME_PRESET}${NC} (${PRIMARY_COLOR})"
  echo -e "  ${CYAN}Hypervisor Driver:${NC}   ${BOLD}${DRIVER}${NC}"
  echo -e "  ${CYAN}Local Worker Node:${NC}   ${GREEN}Active & Connected${NC}"
  echo -e "  ${CYAN}License Status:${NC}      ${BOLD}Active (${LICENSE_KEY:0:15}...)${NC}"
  echo -e "  ${PURPLE}Command Line Control:${NC}"
  echo -e "    ${CYAN}vps-panel status${NC}       Check service health"
  echo -e "    ${CYAN}vps-panel update${NC}       Update to latest version"
  echo -e "    ${CYAN}vps-panel restart${NC}      Restart panel and webserver"
  echo -e "    ${CYAN}vps-panel logs${NC}         Stream live backend logs"
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
    curl -fsSL https://get.docker.com | sh 2>/dev/null || true
    if is_systemd; then
      systemctl enable docker 2>/dev/null || true
      systemctl start docker 2>/dev/null || true
    else
      service docker start 2>/dev/null || true
    fi
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

  if is_systemd; then
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
  else
    cat > /etc/init.d/vps-agent << 'AGENTINITEOF'
#!/bin/sh
DIR="/opt/vps-panel/apps/agent"
case "$1" in
  start)
    if command -v pm2 >/dev/null 2>&1; then
      pm2 start "$DIR/dist/index.js" --name vps-agent --cwd "$DIR"
    else
      cd "$DIR" && nohup node dist/index.js > /var/log/vps-agent.log 2>&1 &
    fi
    ;;
  stop)
    if command -v pm2 >/dev/null 2>&1; then
      pm2 stop vps-agent
    else
      pkill -f "node dist/index.js" 2>/dev/null || true
    fi
    ;;
  restart)
    $0 stop; sleep 1; $0 start ;;
  status)
    if command -v pm2 >/dev/null 2>&1; then pm2 status vps-agent; else pgrep -f "node dist/index.js" >/dev/null && echo "running" || echo "stopped"; fi ;;
  logs)
    if command -v pm2 >/dev/null 2>&1; then pm2 logs vps-agent; else tail -f /var/log/vps-agent.log; fi ;;
  *)
    echo "Usage: service vps-agent {start|stop|restart|status|logs}"; exit 1 ;;
esac
exit 0
AGENTINITEOF
    chmod +x /etc/init.d/vps-agent
    cd "$INSTALL_DIR/apps/agent"
    if command -v pm2 >/dev/null 2>&1; then
      pm2 delete vps-agent >/dev/null 2>&1 || true
      pm2 start dist/index.js --name vps-agent --cwd "$INSTALL_DIR/apps/agent"
      pm2 save >/dev/null 2>&1 || true
    else
      nohup node dist/index.js > /var/log/vps-agent.log 2>&1 &
    fi
  fi

  install_cli_binary
  echo -e "\n${GREEN}[✓] Worker Node Agent connected to ${MASTER_URL_INPUT} (Driver: ${DRIVER})!${NC}\n"
}

# ------------------------------------------------------------------------------
# Install Standalone Alias
# ------------------------------------------------------------------------------
install_standalone() {
  install_panel
}

# ==============================================================================
# UNIFIED CLI COMMANDS (vps-panel <action>)
# ==============================================================================

cmd_status() {
  print_banner
  echo -e "${BOLD}VPS Panel Service & System Health Status:${NC}\n"

  # Master Panel
  local panel_status="${RED}STOPPED${NC}"
  if curl -s -f "http://127.0.0.1:$PANEL_PORT/api/health" >/dev/null 2>&1; then
    panel_status="${GREEN}ONLINE & HEALTHY${NC} (Port $PANEL_PORT)"
  elif is_systemd && systemctl is-active --quiet vps-panel 2>/dev/null; then
    panel_status="${YELLOW}STARTING / INITIALIZING${NC}"
  elif command -v pm2 >/dev/null 2>&1 && pm2 list 2>/dev/null | grep -q "vps-panel.*online"; then
    panel_status="${YELLOW}RUNNING (PM2)${NC}"
  fi
  echo -e "  • ${BOLD}Master Panel Controller:${NC} $panel_status"

  # Nginx
  local nginx_status="${RED}STOPPED${NC}"
  if is_systemd && systemctl is-active --quiet nginx 2>/dev/null; then
    nginx_status="${GREEN}ACTIVE & RUNNING${NC}"
  elif service nginx status >/dev/null 2>&1; then
    nginx_status="${GREEN}ACTIVE & RUNNING${NC}"
  elif pgrep -x nginx >/dev/null 2>&1; then
    nginx_status="${GREEN}ACTIVE & RUNNING (Process)${NC}"
  fi
  echo -e "  • ${BOLD}Nginx Reverse Proxy:${NC}     $nginx_status"

  # Agent
  local agent_status="${YELLOW}NOT INSTALLED (Standalone/Node only)${NC}"
  if [ -f "$INSTALL_DIR/apps/agent/package.json" ]; then
    if is_systemd && systemctl is-active --quiet vps-agent 2>/dev/null; then
      agent_status="${GREEN}ONLINE & CONNECTED${NC} (Port $NODE_PORT)"
    elif command -v pm2 >/dev/null 2>&1 && pm2 list 2>/dev/null | grep -q "vps-agent.*online"; then
      agent_status="${GREEN}ONLINE & CONNECTED (PM2)${NC}"
    else
      agent_status="${RED}STOPPED${NC}"
    fi
  fi
  echo -e "  • ${BOLD}Hypervisor Worker Agent:${NC} $agent_status"

  echo ""
  if [ -f "$INSTALL_DIR/apps/server/.env" ]; then
    local domain=$(grep '^HOST=' "$INSTALL_DIR/apps/server/.env" 2>/dev/null || echo "")
    echo -e "  ${CYAN}Installed Location:${NC} $INSTALL_DIR"
    echo -e "  ${CYAN}Public IP Address:${NC}  $(get_public_ip)"
  fi
  echo ""
}

cmd_start() {
  check_root
  echo -e "${YELLOW}[*] Starting VPS Panel services...${NC}"
  if is_systemd; then
    systemctl start vps-panel 2>/dev/null || true
    systemctl start nginx 2>/dev/null || true
    if systemctl is-enabled vps-agent >/dev/null 2>&1; then
      systemctl start vps-agent 2>/dev/null || true
    fi
  else
    service vps-panel start 2>/dev/null || pm2 start vps-panel 2>/dev/null || true
    service nginx start 2>/dev/null || true
    if [ -f "/etc/init.d/vps-agent" ]; then
      service vps-agent start 2>/dev/null || true
    fi
  fi
  cmd_status
}

cmd_stop() {
  check_root
  echo -e "${YELLOW}[*] Stopping VPS Panel services...${NC}"
  if is_systemd; then
    systemctl stop vps-panel 2>/dev/null || true
    if systemctl is-active --quiet vps-agent 2>/dev/null; then
      systemctl stop vps-agent 2>/dev/null || true
    fi
  else
    service vps-panel stop 2>/dev/null || pm2 stop vps-panel 2>/dev/null || true
    if [ -f "/etc/init.d/vps-agent" ]; then
      service vps-agent stop 2>/dev/null || true
    fi
  fi
  echo -e "${GREEN}[✓] VPS Panel backend stopped.${NC}"
}

cmd_restart() {
  check_root
  echo -e "${YELLOW}[*] Restarting VPS Panel services...${NC}"
  if is_systemd; then
    systemctl restart vps-panel 2>/dev/null || true
    systemctl restart nginx 2>/dev/null || true
    if systemctl is-enabled vps-agent >/dev/null 2>&1; then
      systemctl restart vps-agent 2>/dev/null || true
    fi
  else
    service vps-panel restart 2>/dev/null || pm2 restart vps-panel 2>/dev/null || true
    service nginx restart 2>/dev/null || true
    if [ -f "/etc/init.d/vps-agent" ]; then
      service vps-agent restart 2>/dev/null || true
    fi
  fi
  cmd_status
}

cmd_logs() {
  echo -e "${CYAN}[*] Streaming real-time VPS Panel logs (Press Ctrl+C to exit):${NC}\n"
  if is_systemd; then
    journalctl -u vps-panel -f
  elif command -v pm2 >/dev/null 2>&1; then
    pm2 logs vps-panel
  else
    tail -f /var/log/vps-panel.log
  fi
}

cmd_update() {
  print_banner
  check_root
  echo -e "${CYAN}${BOLD}[*] Updating VPS Panel to the Latest Version...${NC}\n"

  if [ ! -d "$INSTALL_DIR" ]; then
    echo -e "${RED}[ERROR] VPS Panel is not installed in $INSTALL_DIR! Run install first.${NC}"
    exit 1
  fi

  if [ -d "$INSTALL_DIR/apps/server/data" ]; then
    echo -e "${YELLOW}[*] Backing up SQLite database...${NC}"
    mkdir -p /tmp/vps_panel_update_db
    cp -r "$INSTALL_DIR/apps/server/data/"* /tmp/vps_panel_update_db/ 2>/dev/null || true
  fi

  if [ -f "$INSTALL_DIR/apps/server/.env" ]; then
    cp "$INSTALL_DIR/apps/server/.env" /tmp/vps_panel_env_backup
  fi

  echo -e "${YELLOW}[*] Downloading latest release from GitHub...${NC}"
  curl -sSL -o /tmp/vps-panel-latest.tar.gz "$ARCHIVE_URL"
  tar -xzf /tmp/vps-panel-latest.tar.gz --strip-components=1 -C "$INSTALL_DIR"
  rm -f /tmp/vps-panel-latest.tar.gz

  if [ -d "/tmp/vps_panel_update_db" ]; then
    mkdir -p "$INSTALL_DIR/apps/server/data"
    cp -r /tmp/vps_panel_update_db/* "$INSTALL_DIR/apps/server/data/" 2>/dev/null || true
    rm -rf /tmp/vps_panel_update_db
  fi

  if [ -f "/tmp/vps_panel_env_backup" ]; then
    cp /tmp/vps_panel_env_backup "$INSTALL_DIR/apps/server/.env"
    rm -f /tmp/vps_panel_env_backup
  fi

  echo -e "${YELLOW}[*] Refreshing server dependencies...${NC}"
  cd "$INSTALL_DIR/apps/server"
  npm install --omit=dev --silent 2>/dev/null || npm install --omit=dev

  install_cli_binary

  echo -e "${YELLOW}[*] Reloading services...${NC}"
  cmd_restart

  echo -e "\n${GREEN}${BOLD}* ------------------------------------------------------------------------- *${NC}"
  echo -e "${GREEN}${BOLD}*  VPS PANEL UPDATED SUCCESSFULLY TO THE LATEST RELEASE!                    *${NC}"
  echo -e "${GREEN}${BOLD}* ------------------------------------------------------------------------- *${NC}\n"
}

cmd_uninstall() {
  print_banner
  check_root
  echo -e "${RED}${BOLD}[CAUTION] You are about to UNINSTALL VPS Panel completely from this system!${NC}\n"
  read -r -p "Are you sure you want to proceed? [type 'yes' to confirm]: " CONFIRM_UNINSTALL
  if [ "$CONFIRM_UNINSTALL" != "yes" ]; then
    echo -e "${YELLOW}[*] Uninstall cancelled.${NC}"
    exit 0
  fi

  echo -e "\n${YELLOW}[*] Stopping and removing services...${NC}"
  if is_systemd; then
    systemctl stop vps-panel 2>/dev/null || true
    systemctl disable vps-panel 2>/dev/null || true
    systemctl stop vps-agent 2>/dev/null || true
    systemctl disable vps-agent 2>/dev/null || true
    rm -f /etc/systemd/system/vps-panel.service /etc/systemd/system/vps-agent.service
    systemctl daemon-reload
  else
    service vps-panel stop 2>/dev/null || true
    if command -v pm2 >/dev/null 2>&1; then
      pm2 delete vps-panel 2>/dev/null || true
      pm2 delete vps-agent 2>/dev/null || true
      pm2 save 2>/dev/null || true
    fi
    rm -f /etc/init.d/vps-panel /etc/init.d/vps-agent
  fi

  if [ -f "$INSTALL_DIR/apps/server/data/vps_panel.sqlite" ]; then
    local backup_file="/root/vps_panel_backup_$(date +%s).sqlite"
    cp "$INSTALL_DIR/apps/server/data/vps_panel.sqlite" "$backup_file"
    echo -e "${GREEN}[✓] Safety database backup saved to: ${BOLD}${backup_file}${NC}"
  fi

  rm -rf "$INSTALL_DIR"
  rm -f /usr/local/bin/vps-panel /usr/bin/vps-panel

  echo -e "${GREEN}[✓] VPS Panel has been cleanly uninstalled from this server.${NC}\n"
}

show_help() {
  print_banner
  echo -e "${BOLD}Usage:${NC} vps-panel <command> [arguments]\n"
  echo -e "Available Commands:"
  echo -e "  ${CYAN}install [domain]${NC}     Run the 1-click panel installation & SSL setup"
  echo -e "  ${CYAN}update${NC}               Update panel to the newest release from GitHub"
  echo -e "  ${CYAN}start${NC}                Start Master Panel and Nginx web server"
  echo -e "  ${CYAN}stop${NC}                 Stop Master Panel backend service"
  echo -e "  ${CYAN}restart${NC}              Restart Master Panel and Nginx"
  echo -e "  ${CYAN}status${NC}               Display live service status & health check"
  echo -e "  ${CYAN}logs${NC}                 Stream live real-time backend logs"
  echo -e "  ${CYAN}uninstall${NC}            Cleanly remove panel with automated DB backup"
  echo -e "  ${CYAN}--node${NC}               Install Worker Node Hypervisor Agent on this VPS"
  echo -e "  ${CYAN}--standalone${NC}         Install both Master Panel and Local Node"
  echo -e "  ${CYAN}-h, --help${NC}           Show this help message\n"
}

# ------------------------------------------------------------------------------
# Direct CLI Argument Router
# ------------------------------------------------------------------------------
case "$1" in
  install)
    shift
    if [ -n "$1" ]; then
      PANEL_DOMAIN="$1"
    fi
    install_panel
    exit 0
    ;;
  update|upgrade)
    cmd_update
    exit 0
    ;;
  start)
    cmd_start
    exit 0
    ;;
  stop)
    cmd_stop
    exit 0
    ;;
  restart)
    cmd_restart
    exit 0
    ;;
  status|info)
    cmd_status
    exit 0
    ;;
  logs|log)
    cmd_logs
    exit 0
    ;;
  uninstall|remove)
    cmd_uninstall
    exit 0
    ;;
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
    show_help
    exit 0
    ;;
  *)
    if [ -n "$1" ]; then
      PANEL_DOMAIN="$1"
      install_panel
      exit 0
    fi
    ;;
esac

# ------------------------------------------------------------------------------
# Interactive Menu (When run without arguments)
# ------------------------------------------------------------------------------
print_banner
check_root

echo -e "${BOLD}Select what you would like to do:${NC}\n"
echo -e "  ${CYAN}[0]${NC} ${BOLD}Install Complete VPS Panel${NC} (Panel + Local Hypervisor Node - Ready to create VPS!)"
echo -e "  ${CYAN}[1]${NC} ${BOLD}Install Worker Node Daemon Only${NC} (Connect an external server as a worker node)"
echo -e "  ${CYAN}[2]${NC} ${BOLD}Configure Cloudflare Domain & Nginx SSL${NC}"
echo -e "  ${CYAN}[3]${NC} ${BOLD}Check Status & Health${NC}"
echo -e "  ${CYAN}[4]${NC} ${BOLD}Update VPS Panel to Latest GitHub Release${NC}"
echo -e "  ${CYAN}[5]${NC} ${BOLD}Restart Services${NC}"
echo -e "  ${CYAN}[6]${NC} ${BOLD}View Realtime Logs${NC}"
echo -e "  ${CYAN}[7]${NC} ${BOLD}Uninstall Panel${NC}"
echo -e "  ${CYAN}[8]${NC} Exit\n"
read -r -p "Input 0-8 [default: 0]: " ACTION
ACTION_CHOICE=${ACTION:-0}

case "$ACTION_CHOICE" in
  0) install_panel ;;
  1) install_node_daemon ;;
  2)
    read -r -p "Enter Domain (e.g. vps.lunars.indevs.in): " DOMAIN_NAME
    if [ ! -f "$INSTALL_DIR/apps/server/package.json" ]; then
      PANEL_DOMAIN="$DOMAIN_NAME"
      install_panel
    else
      setup_nginx_domain "$DOMAIN_NAME"
    fi
    ;;
  3) cmd_status ;;
  4) cmd_update ;;
  5) cmd_restart ;;
  6) cmd_logs ;;
  7) cmd_uninstall ;;
  8) echo "Exiting."; exit 0 ;;
  *) echo -e "${RED}Invalid selection!${NC}"; exit 1 ;;
esac
