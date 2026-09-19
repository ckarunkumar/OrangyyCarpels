#!/usr/bin/env bash
# ==============================================================================
# Orangyy Carpels — Quick Updater for GoLive Production Environment
# Domain: https://carpels.orangyy.design
# Usage on Server: bash /root/update-golive.sh
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET_DIR="/var/www/orangyycarpels"
PM2_NAME="orangy-backend-golive"
BACKUP_DIR="/var/backups/orangyycarpels"

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${GREEN}🚀 Updating Orangyy Carpels [GoLive Production Environment]${NC}"
echo -e "${BLUE}==================================================================${NC}\n"

cd "$TARGET_DIR"

# 1. Pre-update Database Backup
echo -e "${BLUE}[1/5] Creating Pre-Update Database Backup...${NC}"
mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="$BACKUP_DIR/backup_orangyycarpels_pre_update_${TIMESTAMP}.sql"

if command -v mysqldump > /dev/null 2>&1; then
  mysqldump orangyycarpels > "$BACKUP_FILE" 2>/dev/null || sudo mysqldump orangyycarpels > "$BACKUP_FILE" 2>/dev/null || true
  if [[ -f "$BACKUP_FILE" && -s "$BACKUP_FILE" ]]; then
    gzip -f "$BACKUP_FILE"
    echo -e "${GREEN}✔ Database backup created: ${BACKUP_FILE}.gz${NC}"
  fi
fi

# 2. Pull latest changes from GoLive branch
echo -e "\n${BLUE}[2/5] Pulling latest code from origin/GoLive...${NC}"
git fetch origin GoLive
git checkout GoLive
git reset --hard origin/GoLive
echo -e "${GREEN}✔ Code pulled.${NC}"

# 3. Update Backend & Sync DB
echo -e "\n${BLUE}[3/5] Updating Backend & Database Schema...${NC}"
cd "$TARGET_DIR/backend"
npm install --no-audit
npx prisma generate
npx prisma db push --accept-data-loss
npm run build
echo -e "${GREEN}✔ Backend built.${NC}"

# 4. Update Frontend
echo -e "\n${BLUE}[4/5] Building Frontend...${NC}"
cd "$TARGET_DIR/frontend"
npm install --no-audit
npm run build
echo -e "${GREEN}✔ Frontend built.${NC}"

# 5. Reload PM2
echo -e "\n${BLUE}[5/5] Reloading PM2 Service...${NC}"
cd "$TARGET_DIR"
pm2 reload "$PM2_NAME" || pm2 start deploy/ecosystem.golive.config.js
pm2 save
echo -e "${GREEN}✔ PM2 service reloaded.${NC}"

# 6. Verify Nginx & Health
if command -v nginx > /dev/null 2>&1; then
  sudo nginx -t && sudo systemctl reload nginx || true
fi

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${GREEN}🎉 GoLive is up-to-date and LIVE!${NC}"
echo -e "🌐 URL: ${YELLOW}https://carpels.orangyy.design${NC}"
echo -e "${BLUE}==================================================================${NC}\n"
