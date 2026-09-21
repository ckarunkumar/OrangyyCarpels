#!/usr/bin/env bash
# ==============================================================================
# Orangyy Carpels — 1-Click Complete GoLive Production Setup & Deployment Script
# Target URL: https://carpels.orangyy.design
# Branch: GoLive
# Directory: /var/www/orangyycarpels
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET_DIR="/var/www/orangyycarpels"
REPO_URL="https://github.com/ckarunkumar/OrangyyCarpels.git"
TARGET_BRANCH="GoLive"
DB_USER="carpels_user"
DB_PASS="Orangyy@Carpels2026!"
DB_NAME="orangyycarpels"
BACKEND_PORT="5001"
PM2_NAME="orangy-backend-golive"
DOMAIN="carpels.orangyy.design"

clear
echo -e "${BLUE}==================================================================${NC}"
echo -e "${GREEN}🚀 Orangyy Carpels — 1-Click GoLive Production Deployer${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo -e "${YELLOW}Target Domain:${NC} https://$DOMAIN"
echo -e "${YELLOW}Target Branch:${NC} $TARGET_BRANCH"
echo -e "${YELLOW}Target Path  :${NC} $TARGET_DIR"
echo -e "${YELLOW}Backend Port :${NC} $BACKEND_PORT"
echo -e "${BLUE}------------------------------------------------------------------${NC}\n"

# 1. Ensure Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run this script as root:${NC}"
  echo -e "   sudo bash $0"
  exit 1
fi

# 2. Setup Production Database
echo -e "${BLUE}[1/6] Setting Up Production Database (${DB_NAME})...${NC}"
mariadb -u root << EOF || mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
echo -e "${GREEN}✔ Database ready.${NC}"

# 3. Clone or Update Repository
echo -e "\n${BLUE}[2/6] Preparing GoLive Codebase in ${TARGET_DIR}...${NC}"
mkdir -p /var/www
if [ ! -d "$TARGET_DIR/.git" ]; then
  echo ">> Cloning fresh repository ($TARGET_BRANCH branch)..."
  rm -rf "$TARGET_DIR"
  git clone -b "$TARGET_BRANCH" "$REPO_URL" "$TARGET_DIR"
else
  echo ">> Updating existing GoLive repository..."
  cd "$TARGET_DIR"
  git fetch origin "$TARGET_BRANCH"
  git checkout "$TARGET_BRANCH"
  git reset --hard origin/"$TARGET_BRANCH"
fi
echo -e "${GREEN}✔ Codebase ready.${NC}"

# 4. Configure Backend Environment
echo -e "\n${BLUE}[3/6] Configuring Backend Environment...${NC}"
cd "$TARGET_DIR/backend"
cat <<EOF > .env
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
PORT=${BACKEND_PORT}
HOST=0.0.0.0
NODE_ENV=production
COOKIE_SECRET="orangyy-carpels-super-secure-production-secret-key-2026-minimum-32-chars"
ALLOWED_ORIGINS="https://${DOMAIN},https://fortest.orangyy.design"
EOF

npm install --no-audit
npx prisma generate
npx prisma db push --accept-data-loss
npm run build
echo -e "${GREEN}✔ Backend built and database synchronized.${NC}"

# 5. Build Frontend
echo -e "\n${BLUE}[4/6] Building Frontend Production Bundle...${NC}"
cd "$TARGET_DIR/frontend"
npm install --no-audit
npm run build
echo -e "${GREEN}✔ Frontend production bundle built.${NC}"

# 6. Configure Nginx
echo -e "\n${BLUE}[5/6] Configuring Nginx for https://${DOMAIN}...${NC}"
cp "$TARGET_DIR/deploy/nginx-golive.conf" "/etc/nginx/sites-available/${DOMAIN}"
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"

# Ensure default site removed if conflicting
rm -f /etc/nginx/sites-enabled/default

if nginx -t; then
  systemctl reload nginx
  echo -e "${GREEN}✔ Nginx configured and reloaded.${NC}"
else
  echo -e "${YELLOW}⚠ Nginx test failed. Please check SSL certificates in /etc/nginx/ssl/.${NC}"
fi

# 7. Start/Reload PM2
echo -e "\n${BLUE}[6/6] Launching Production PM2 Service (${PM2_NAME})...${NC}"
cd "$TARGET_DIR"
mkdir -p logs
pm2 delete "$PM2_NAME" 2>/dev/null || true
pm2 start deploy/ecosystem.golive.config.js
pm2 save
echo -e "${GREEN}✔ PM2 production process is active on port ${BACKEND_PORT}.${NC}"

# Create quick updater shortcut in /root/
cat <<EOF > /root/update-golive.sh
#!/usr/bin/env bash
cd ${TARGET_DIR}
bash deploy/update-golive.sh
EOF
chmod +x /root/update-golive.sh

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${GREEN}🎉 CONGRATULATIONS! Orangyy Carpels is LIVE on Production!${NC}"
echo -e "🌐 URL: ${YELLOW}https://${DOMAIN}${NC}"
echo -e "⚡ Quick Updater: ${YELLOW}bash /root/update-golive.sh${NC}"
echo -e "${BLUE}==================================================================${NC}\n"
