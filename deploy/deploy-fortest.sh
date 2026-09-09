#!/usr/bin/env bash
# ==============================================================================
# Orangyy Carpels — ForTest Environment Deployment Script
# Target URL: https://fortest.orangyy.design
# Branch: Local
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET_BRANCH="Local"
EXPECTED_DIR="/var/www/orangyycarpels-fortest"
BACKEND_PORT="5002"
PM2_APP_NAME="orangy-backend-fortest"
APP_URL="https://fortest.orangyy.design"

echo -e "${BLUE}==================================================================${NC}"
echo -e "${GREEN}🚀 Deploying Orangyy Carpels [ForTest Environment]${NC}"
echo -e "${BLUE}==================================================================${NC}"

# 1. Directory Check
CURRENT_DIR="$(pwd)"
if [[ "$CURRENT_DIR" != "$EXPECTED_DIR" ]] && [[ ! -f "$CURRENT_DIR/deploy/ecosystem.fortest.config.js" ]]; then
  echo -e "${YELLOW}Warning: Current directory is $CURRENT_DIR (Expected: $EXPECTED_DIR)${NC}"
fi

# 2. Branch Verification
echo -e "\n${BLUE}[1/7] Verifying Git Branch...${NC}"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
  echo -e "${RED}❌ ERROR: ForTest deployments must run strictly from the '$TARGET_BRANCH' branch.${NC}"
  echo -e "${RED}Current branch is '$CURRENT_BRANCH'. Deployment aborted.${NC}"
  exit 1
fi
echo -e "${GREEN}✔ Active branch verified: $CURRENT_BRANCH${NC}"

# 3. Pull Latest Changes from Remote
echo -e "\n${BLUE}[2/7] Pulling latest updates from origin/$TARGET_BRANCH...${NC}"
git fetch origin "$TARGET_BRANCH"
git pull origin "$TARGET_BRANCH"

# 4. Backend Dependencies, Prisma & Build
echo -e "\n${BLUE}[3/7] Building Backend...${NC}"
cd backend

if [[ ! -f ".env" ]]; then
  echo -e "${RED}❌ ERROR: Missing backend/.env configuration file in ForTest directory.${NC}"
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

# 5. Frontend Dependencies & Build
echo -e "\n${BLUE}[4/7] Building Frontend...${NC}"
cd frontend
echo ">> Installing frontend dependencies..."
npm install --no-audit

echo ">> Compiling Frontend (Vite)..."
npm run build
cd ..

# 6. PM2 Service Reload (ForTest only)
echo -e "\n${BLUE}[5/7] Reloading PM2 Service [$PM2_APP_NAME]...${NC}"
mkdir -p logs

if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
  pm2 reload deploy/ecosystem.fortest.config.js --update-env
else
  pm2 start deploy/ecosystem.fortest.config.js
fi
pm2 save

# 7. Verification & Health Check
echo -e "\n${BLUE}[6/7] Verifying Backend Health on port $BACKEND_PORT...${NC}"
sleep 3

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$BACKEND_PORT/api/v1/health" || true)
if [[ "$HEALTH_STATUS" != "200" && "$HEALTH_STATUS" != "401" ]]; then
  echo -e "${RED}❌ Backend Health check failed! (HTTP Status: $HEALTH_STATUS)${NC}"
  echo -e "${YELLOW}Check backend logs: pm2 logs $PM2_APP_NAME --lines 30${NC}"
  exit 1
fi
echo -e "${GREEN}✔ Backend is healthy on port $BACKEND_PORT.${NC}"

# 8. Final Live Status
echo -e "\n${BLUE}[7/7] Checking Nginx / Public Endpoint...${NC}"
if command -v nginx > /dev/null 2>&1; then
  sudo nginx -t && sudo systemctl reload nginx || true
fi

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${GREEN}🎉 ForTest Deployment Complete!${NC}"
echo -e "🌐 Application URL: ${YELLOW}$APP_URL${NC}"
echo -e "${BLUE}==================================================================${NC}"
