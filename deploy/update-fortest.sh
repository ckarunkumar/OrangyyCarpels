#!/usr/bin/env bash
# ==============================================================================
# Orangyy Carpels — Quick Updater for ForTest Environment
# Usage on Server: bash /root/update-fortest.sh
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET_DIR="/var/www/orangyycarpels-fortest"
PM2_NAME="orangy-backend-fortest"

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${GREEN}🚀 Updating Orangyy Carpels [ForTest Environment]${NC}"
echo -e "${BLUE}==================================================================${NC}\n"

cd "$TARGET_DIR"

# 1. Pull latest changes from Local branch
echo -e "${BLUE}[1/4] Pulling latest code from origin/Local...${NC}"
git fetch origin Local
git checkout Local
git reset --hard origin/Local
echo -e "${GREEN}✔ Code pulled.${NC}"

# 2. Update Backend & Sync DB
echo -e "\n${BLUE}[2/4] Updating Backend & Database Schema...${NC}"
cd "$TARGET_DIR/backend"
npm install --no-audit
npx prisma generate
npx prisma db push --accept-data-loss
npm run build
echo -e "${GREEN}✔ Backend built.${NC}"

# 3. Update Frontend
echo -e "\n${BLUE}[3/4] Building Frontend...${NC}"
cd "$TARGET_DIR/frontend"
npm install --no-audit
npm run build
echo -e "${GREEN}✔ Frontend built.${NC}"

# 4. Reload PM2
echo -e "\n${BLUE}[4/4] Reloading PM2 Service...${NC}"
cd "$TARGET_DIR"
pm2 reload "$PM2_NAME" || pm2 start deploy/ecosystem.fortest.config.js
pm2 save
echo -e "${GREEN}✔ Service reloaded.${NC}"

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${GREEN}🎉 ForTest is up-to-date and LIVE!${NC}"
echo -e "🌐 URL: ${YELLOW}https://fortest.orangyy.design${NC}"
echo -e "${BLUE}==================================================================${NC}\n"
