#!/usr/bin/env bash
# ==============================================================================
# Orangyy Carpels — GoLive Production Deployment Script
# Target URL: https://carpels.orangyy.design
# Branch: GoLive
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET_BRANCH="GoLive"
EXPECTED_DIR="/var/www/orangyycarpels"
BACKEND_PORT="5001"
PM2_APP_NAME="orangy-backend-golive"
APP_URL="https://carpels.orangyy.design"
BACKUP_DIR="/var/backups/orangyycarpels"

echo -e "${BLUE}==================================================================${NC}"
echo -e "${GREEN}🚀 Deploying Orangyy Carpels [GoLive Production Environment]${NC}"
echo -e "${BLUE}==================================================================${NC}"

# 1. Directory Check
CURRENT_DIR="$(pwd)"
if [[ "$CURRENT_DIR" != "$EXPECTED_DIR" ]] && [[ ! -f "$CURRENT_DIR/deploy/ecosystem.golive.config.js" ]]; then
  echo -e "${YELLOW}Warning: Current directory is $CURRENT_DIR (Expected: $EXPECTED_DIR)${NC}"
fi

# 2. Branch Verification
echo -e "\n${BLUE}[1/8] Verifying Git Branch...${NC}"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
  echo -e "${RED}❌ ERROR: Production deployments must run strictly from the '$TARGET_BRANCH' branch.${NC}"
  echo -e "${RED}Current branch is '$CURRENT_BRANCH'. Deployment aborted.${NC}"
  exit 1
fi
echo -e "${GREEN}✔ Active branch verified: $CURRENT_BRANCH${NC}"

# 3. Pre-Deployment Database Backup
echo -e "\n${BLUE}[2/8] Creating Timestamped Production Database Backup...${NC}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="$BACKUP_DIR/backup_orangyycarpels_${TIMESTAMP}.sql"

if command -v mariadb-dump > /dev/null 2>&1; then
  DUMP_CMD="mariadb-dump"
elif command -v mysqldump > /dev/null 2>&1; then
  DUMP_CMD="mysqldump"
else
  DUMP_CMD=""
fi

if [[ -n "$DUMP_CMD" ]]; then
  if $DUMP_CMD orangyycarpels > "$BACKUP_FILE" 2>/dev/null || sudo $DUMP_CMD orangyycarpels > "$BACKUP_FILE" 2>/dev/null; then
    gzip -f "$BACKUP_FILE"
    echo -e "${GREEN}✔ Production Database backup created: ${BACKUP_FILE}.gz${NC}"
  else
    echo -e "${YELLOW}Notice: Direct mysqldump skipped (ensure standard database backup procedures).${NC}"
  fi
fi

# 4. Pull Latest Changes from Remote
echo -e "\n${BLUE}[3/8] Pulling latest updates from origin/$TARGET_BRANCH...${NC}"
git fetch origin "$TARGET_BRANCH"
git pull origin "$TARGET_BRANCH"

# 5. Backend Dependencies, Prisma & Build
echo -e "\n${BLUE}[4/8] Building Backend...${NC}"
cd backend

if [[ ! -f ".env" ]]; then
  echo -e "${RED}❌ ERROR: Missing backend/.env configuration file in GoLive directory.${NC}"
  exit 1
fi

echo ">> Installing backend dependencies..."
npm install --no-audit

echo ">> Generating Prisma Client..."
npx prisma generate

echo ">> Applying Prisma Migrations (versioned)..."
npx prisma migrate deploy

echo ">> Compiling Backend TypeScript..."
npm run build
cd ..

# 6. Frontend Dependencies & Build
echo -e "\n${BLUE}[5/8] Building Frontend...${NC}"
cd frontend
echo ">> Installing frontend dependencies..."
npm install --no-audit

echo ">> Compiling Frontend (Vite)..."
npm run build
cd ..

# 7. PM2 Service Reload (GoLive only)
echo -e "\n${BLUE}[6/8] Reloading PM2 Service [$PM2_APP_NAME]...${NC}"
mkdir -p logs

if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
  pm2 reload deploy/ecosystem.golive.config.js --update-env
elif pm2 describe "orangy-backend" > /dev/null 2>&1; then
  pm2 delete "orangy-backend" || true
  pm2 start deploy/ecosystem.golive.config.js
else
  pm2 start deploy/ecosystem.golive.config.js
fi
pm2 save

# 8. Verification & Health Check
echo -e "\n${BLUE}[7/8] Verifying Backend Health on port $BACKEND_PORT...${NC}"
sleep 3

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$BACKEND_PORT/api/v1/health" || true)
if [[ "$HEALTH_STATUS" != "200" && "$HEALTH_STATUS" != "401" ]]; then
  echo -e "${RED}❌ Backend Health check failed! (HTTP Status: $HEALTH_STATUS)${NC}"
  echo -e "${YELLOW}Rollback Instructions:${NC}"
  echo -e "  1. Revert Git commit: git checkout <PREVIOUS_COMMIT>"
  echo -e "  2. Restore DB backup: gunzip < ${BACKUP_FILE}.gz | mysql orangyycarpels"
  echo -e "  3. Restart PM2: pm2 reload deploy/ecosystem.golive.config.js"
  exit 1
fi
echo -e "${GREEN}✔ Backend is healthy on port $BACKEND_PORT.${NC}"

# 9. Nginx Check & Reload
echo -e "\n${BLUE}[8/8] Checking Nginx / Public Endpoint...${NC}"
if command -v nginx > /dev/null 2>&1; then
  sudo nginx -t && sudo systemctl reload nginx || true
fi

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${GREEN}🎉 GoLive Production Deployment Complete!${NC}"
echo -e "🌐 Application URL: ${YELLOW}$APP_URL${NC}"
echo -e "${BLUE}==================================================================${NC}"
