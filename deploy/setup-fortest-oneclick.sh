#!/usr/bin/env bash
# ==============================================================================
# Orangyy Carpels — 1-Click Complete ForTest Setup & Deployment Script
# Target URL: https://fortest.orangyy.design
# Branch: Local
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET_DIR="/var/www/orangyycarpels-fortest"
REPO_URL="https://github.com/ckarunkumar/OrangyyCarpels.git"
TARGET_BRANCH="Local"
DB_PASS="Orangyy@Carpels2026!"
DB_NAME="orangyycarpels_fortest"
BACKEND_PORT="5002"
PM2_NAME="orangy-backend-fortest"
DOMAIN="fortest.orangyy.design"

clear
echo -e "${BLUE}==================================================================${NC}"
echo -e "${GREEN}🍊 Orangyy Carpels — 1-Click ForTest Automated Deployer${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo -e "${YELLOW}Target Domain:${NC} https://$DOMAIN"
echo -e "${YELLOW}Target Branch:${NC} $TARGET_BRANCH"
echo -e "${YELLOW}Backend Port :${NC} $BACKEND_PORT"
echo -e "${BLUE}------------------------------------------------------------------${NC}\n"

# 1. Ensure Running as Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run this script with sudo or as root:${NC}"
  echo -e "   sudo bash $0"
  exit 1
fi

# 2. System Resource Check
echo -e "${BLUE}[1/7] Checking System Resources...${NC}"
free -h 2>/dev/null || true
echo -e "${GREEN}✔ System check completed.${NC}"

# 3. Install System Packages, MariaDB, Nginx
echo -e "\n${BLUE}[2/8] Installing System Dependencies, MariaDB & Nginx...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y -q
apt-get install -y -q git curl wget build-essential unzip mariadb-server nginx

systemctl enable mariadb
systemctl start mariadb
systemctl enable nginx
systemctl start nginx
echo -e "${GREEN}✔ System packages ready.${NC}"

# 4. Install Node.js 20 LTS & PM2
echo -e "\n${BLUE}[3/8] Checking Node.js 20 LTS & PM2...${NC}"
if ! command -v node > /dev/null 2>&1 || ! node -v | grep -q 'v20'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -q nodejs
fi
npm install -g pm2 -q
echo -e "${GREEN}✔ Node $(node -v) and PM2 ready.${NC}"

# 5. Setup MySQL Database
echo -e "\n${BLUE}[4/8] Configuring Database ($DB_NAME)...${NC}"
mariadb -u root << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'carpels_user'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO 'carpels_user'@'localhost';
FLUSH PRIVILEGES;
EOF
echo -e "${GREEN}✔ Database configured.${NC}"

# 6. Fetch Code from GitHub (Branch: Local)
echo -e "\n${BLUE}[5/8] Cloning / Pulling Latest Code...${NC}"
mkdir -p "$TARGET_DIR"
if [ ! -d "$TARGET_DIR/.git" ]; then
  git clone -b "$TARGET_BRANCH" "$REPO_URL" "$TARGET_DIR"
else
  cd "$TARGET_DIR"
  git fetch origin "$TARGET_BRANCH"
  git checkout "$TARGET_BRANCH"
  git reset --hard "origin/$TARGET_BRANCH"
  git pull origin "$TARGET_BRANCH"
fi
cd "$TARGET_DIR"

# Write backend .env
cat << EOF > "$TARGET_DIR/backend/.env"
DATABASE_URL="mysql://carpels_user:$DB_PASS@localhost:3306/$DB_NAME"
PORT=$BACKEND_PORT
HOST=0.0.0.0
NODE_ENV=production
SESSION_SECRET="e972986f34fbe7a4b868e8334460d6a365778acbf7a34cd458a2210878e1b9b6"
EOF
echo -e "${GREEN}✔ Code updated and environment configured.${NC}"

# 7. Build Backend & Frontend
echo -e "\n${BLUE}[6/8] Building Backend & Synchronizing Database...${NC}"
cd "$TARGET_DIR/backend"
npm install --no-audit
npx prisma generate
npx prisma db push --accept-data-loss
npx ts-node prisma/seed.ts 2>/dev/null || true
npm run build

echo -e "\n${BLUE}[6/8 (cont.)] Building Frontend...${NC}"
cd "$TARGET_DIR/frontend"
npm install --no-audit
npm run build
cd "$TARGET_DIR"
echo -e "${GREEN}✔ Application builds complete.${NC}"

# 8. Start / Reload PM2
echo -e "\n${BLUE}[7/8] Starting PM2 Process ($PM2_NAME)...${NC}"
mkdir -p "$TARGET_DIR/logs"
pm2 delete "$PM2_NAME" 2>/dev/null || true
pm2 start "$TARGET_DIR/deploy/ecosystem.fortest.config.js"
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null || true
echo -e "${GREEN}✔ PM2 process running on port $BACKEND_PORT.${NC}"

# 9. Configure Nginx with SSL
echo -e "\n${BLUE}[8/8] Configuring Nginx Web Server...${NC}"
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx-selfsigned.key \
  -out /etc/nginx/ssl/nginx-selfsigned.crt \
  -subj "/C=IN/ST=Delhi/L=Delhi/O=Orangyy/OU=Studio/CN=$DOMAIN" 2>/dev/null || true

cat << EOF > /etc/nginx/sites-available/$DOMAIN
server {
    listen 80;
    listen [::]:80;
    listen 8080;
    listen 3000;
    listen 5000;
    listen 443 ssl;
    listen [::]:443 ssl;

    ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;

    server_name $DOMAIN _;

    root $TARGET_DIR/frontend/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl reload nginx

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${GREEN}🎉 CONGRATULATIONS! FORTEST DEPLOYMENT IS COMPLETE & LIVE!${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo -e "🌐 URL        : ${YELLOW}https://$DOMAIN${NC}"
echo -e "👤 Super Admin: ${GREEN}arun@orangyy.design${NC}"
echo -e "🔑 Password   : ${GREEN}Sachin_99${NC}"
echo -e "${BLUE}==================================================================${NC}\n"
