#!/bin/bash
# ==============================================================================
# Orangyy Carpels — AIC Cloud VPS (2GB) Automated Server Setup Script
# Target OS: Ubuntu 22.04 / 24.04 LTS or Debian 11/12
# ==============================================================================

set -e

# Color helpers
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}🚀 Orangyy Carpels — AIC Cloud VPS Initial Setup${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check root privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Please run this script as root or with sudo.${NC}"
  exit 1
fi

# 1. System Update
echo -e "\n${GREEN}[1/8] Updating system packages...${NC}"
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git ufw htop build-essential unzip

# 2. Configure Swap (2GB Swap for smooth builds on 2GB RAM VPS)
echo -e "\n${GREEN}[2/8] Checking and configuring swap memory...${NC}"
if ! swapon --show | grep -q '/swapfile'; then
  echo "Creating 2GB swapfile..."
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  sysctl vm.swappiness=20
  echo 'vm.swappiness=20' >> /etc/sysctl.conf
  echo "Swap configured successfully."
else
  echo "Swapfile already present."
fi

# 3. Install Node.js 20 LTS & PM2
echo -e "\n${GREEN}[3/8] Installing Node.js 20 LTS & PM2...${NC}"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2
echo "Node.js $(node -v) & PM2 $(pm2 -v) installed."

# 4. Install & Configure MySQL 8
echo -e "\n${GREEN}[4/8] Installing & Starting MySQL Server...${NC}"
apt-get install -y mysql-server
systemctl enable mysql
systemctl start mysql

# 5. Install & Configure Nginx
echo -e "\n${GREEN}[5/8] Installing Nginx...${NC}"
apt-get install -y nginx certbot python3-certbot-nginx
systemctl enable nginx
systemctl start nginx

# 6. Configure UFW Firewall
echo -e "\n${GREEN}[6/8] Configuring UFW Firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status verbose

# 7. Create App Directory
echo -e "\n${GREEN}[7/8] Preparing /var/www/orangyycarpels...${NC}"
mkdir -p /var/www/orangyycarpels
chown -R $SUDO_USER:$SUDO_USER /var/www/orangyycarpels || true

echo -e "\n${BLUE}======================================================${NC}"
echo -e "${GREEN}✅ AIC Cloud VPS Setup Completed Successfully!${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "Next steps to deploy the application:"
echo -e "1. Create the MySQL database and user:"
echo -e "   ${YELLOW}sudo mysql${NC}"
echo -e "   CREATE DATABASE orangyycarpels CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo -e "   CREATE USER 'carpels_user'@'localhost' IDENTIFIED BY 'StrongPasswordHere!';"
echo -e "   GRANT ALL PRIVILEGES ON orangyycarpels.* TO 'carpels_user'@'localhost';"
echo -e "   FLUSH PRIVILEGES; EXIT;"
echo -e "\n2. Clone the code into ${YELLOW}/var/www/orangyycarpels${NC} and run:"
echo -e "   ${YELLOW}bash deploy/deploy.sh${NC}"
