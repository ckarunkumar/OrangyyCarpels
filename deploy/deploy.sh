#!/bin/bash
# ==============================================================================
# Orangyy Carpels — Production Deployment & Update Script
# ==============================================================================

set -e

echo "🚀 Starting Orangyy Carpels deployment..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# 1. Install & Build Backend
echo "📦 Building Backend..."
cd "$ROOT_DIR/backend"
npm install --production=false
npx prisma generate
npx prisma db push --accept-data-loss
npm run build

# 2. Build Frontend
echo "🎨 Building Frontend..."
cd "$ROOT_DIR/frontend"
npm install --production=false
npm run build

# 3. Reload PM2 Process Manager
echo "⚙️ Reloading PM2 services..."
cd "$ROOT_DIR"
mkdir -p logs
if pm2 list | grep -q "orangy-backend"; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

# 4. Reload Nginx if installed
if command -v nginx >/dev/null 2>&1; then
  echo "🌐 Reloading Nginx..."
  sudo nginx -t && sudo systemctl reload nginx || true
fi

echo "✅ Orangyy Carpels deployed successfully!"

