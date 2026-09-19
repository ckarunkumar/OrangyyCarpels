#!/usr/bin/env bash
# ==============================================================================
# Orangyy Carpels — Setup Google Drive Automated Database Backup
# Usage on Server: bash /root/setup-gdrive-backup.sh
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${GREEN}☁️  Setting Up Google Drive Automated Database Backup${NC}"
echo -e "${BLUE}==================================================================${NC}\n"

# 1. Install rclone if missing
if ! command -v rclone > /dev/null 2>&1; then
  echo -e "${BLUE}[1/3] Installing rclone (Cloud Storage Sync Engine)...${NC}"
  sudo -v ; curl https://rclone.org/install.sh | sudo bash
  echo -e "${GREEN}✔ rclone installed successfully.${NC}"
else
  echo -e "${GREEN}✔ rclone is already installed ($(rclone --version | head -n1)).${NC}"
fi

# 2. Configure Google Drive Remote
echo -e "\n${BLUE}[2/3] Checking Google Drive Remote Configuration...${NC}"
if rclone listremotes | grep -q "^gdrive:"; then
  echo -e "${GREEN}✔ Google Drive remote 'gdrive:' is already configured!${NC}"
else
  echo -e "${YELLOW}>> 'gdrive:' remote not found.${NC}"
  echo -e "${YELLOW}Please run the interactive Google Drive connector by typing:${NC}"
  echo -e "   ${BLUE}rclone config${NC}"
  echo -e "\n${YELLOW}Quick steps inside 'rclone config':${NC}"
  echo -e "  1. Type 'n' (New remote)"
  echo -e "  2. Name: 'gdrive'"
  echo -e "  3. Storage type: Type 'drive' (or number for Google Drive)"
  echo -e "  4. Leave client_id & client_secret blank (press Enter)"
  echo -e "  5. Scope: Type '1' (Full access to all files)"
  echo -e "  6. root_folder_id: Leave blank (press Enter)"
  echo -e "  7. Service account: Leave blank (press Enter)"
  echo -e "  8. Edit advanced config? Type 'n'"
  echo -e "  9. Use auto config? Type 'n' (if on remote headless server)"
  echo -e "  10. Follow authorization link on your local browser and paste code."
  echo -e "  11. Configure as team drive? Type 'n'"
  echo -e "  12. Confirm and save ('y' -> 'q')"
fi

# 3. Install Daily System Cron Job
echo -e "\n${BLUE}[3/3] Setting Up Automated Cron Job (Daily at 02:00 AM)...${NC}"
BACKUP_SCRIPT_PATH="/var/www/orangyycarpels/deploy/backup-db-to-gdrive.sh"

if [[ -f "$BACKUP_SCRIPT_PATH" ]]; then
  chmod +x "$BACKUP_SCRIPT_PATH"
  
  # Add to crontab if not already present
  CRON_ENTRY="0 2 * * * bash $BACKUP_SCRIPT_PATH > /dev/null 2>&1"
  (crontab -l 2>/dev/null | grep -v "backup-db-to-gdrive.sh" ; echo "$CRON_ENTRY") | crontab -
  
  echo -e "${GREEN}✔ Daily cron job scheduled at 02:00 AM every night.${NC}"
else
  echo -e "${YELLOW}Notice: Place backup script at $BACKUP_SCRIPT_PATH once code is deployed.${NC}"
fi

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${GREEN}🎉 Google Drive Backup System Ready!${NC}"
echo -e "To test manually anytime, run: ${YELLOW}bash /var/www/orangyycarpels/deploy/backup-db-to-gdrive.sh${NC}"
echo -e "View logs: ${YELLOW}tail -f /var/log/carpels_db_backup.log${NC}"
echo -e "${BLUE}==================================================================${NC}\n"
