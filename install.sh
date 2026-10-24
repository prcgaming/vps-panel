#!/usr/bin/env bash
# ==============================================================================
# VPS PANEL - Universal Multi-Node Installation Script
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
EOF
echo -e "${NC}"
echo -e "${PURPLE}===================================================================${NC}"
echo -e "${GREEN} Automated Multi-Node VPS Panel Installer & Hypervisor Daemon Setup${NC}"
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
    apt-get install -y curl wget git tar build-essential ufw net-tools
  elif [[ "$OS" =~ ^(centos|rhel|rocky|almalinux|fedora)$ ]]; then
    yum install -y epel-release || true
    yum install -y curl wget git tar make gcc gcc-c++ firewalld net-tools
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
  echo -e "${YELLOW}Next Step: Log in to the Admin Dashboard and navigate to 'Nodes' to${NC}"
  echo -e "${YELLOW}generate join tokens and connect worker nodes to this cluster!${NC}"
  echo -e "${GREEN}===================================================================${NC}\n"
}

# Install & Configure Worker Node Agent
install_agent() {
  detect_os
  install_base_deps

  # Prompt if parameters not passed
  if [ -z "$PANEL_URL" ]; then
    echo -e "${CYAN}Enter Master Panel URL (e.g., http://1.2.3.4:4000):${NC}"
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

# Parse CLI arguments or show interactive menu
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
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --panel                        Install Master Panel (Controller + Web Admin Dashboard)"
      echo "  --agent                        Install Worker Node Agent (Daemon for virtualization)"
      echo "    --panel-url <URL>            Master Panel URL (e.g., http://1.2.3.4:4000)"
      echo "    --token <TOKEN>              Node Join Token from Master Panel"
      echo "    --driver <docker|kvm|mock>   Virtualization driver (default: docker)"
      echo "  --standalone                   Install both Master Panel and Local Node on this VPS"
      echo "  -h, --help                     Show this help message"
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

# Interactive Menu
echo -e "${BOLD}Select Installation Option:${NC}\n"
echo -e "  ${CYAN}[1]${NC} ${BOLD}Master Panel${NC} (Controller API + Modern Web Admin Dashboard)"
echo -e "  ${CYAN}[2]${NC} ${BOLD}Worker Node Agent${NC} (Connect this VPS to an existing Master Cluster)"
echo -e "  ${CYAN}[3]${NC} ${BOLD}Full Standalone${NC} (Install Master Panel AND Local Worker on this VPS)"
echo -e "  ${CYAN}[4]${NC} Exit\n"
read -p "Enter selection [1-4]: " CHOICE

case "$CHOICE" in
  1) install_panel ;;
  2) install_agent ;;
  3) install_standalone ;;
  4) echo "Installation cancelled."; exit 0 ;;
  *) echo -e "${RED}Invalid choice!${NC}"; exit 1 ;;
esac
