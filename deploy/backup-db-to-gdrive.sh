#!/usr/bin/env bash
# ==============================================================================
# Orangyy Carpels — Automated MySQL Database Backup to Google Drive
# Target Database: orangyycarpels (Production)
# Remote Destination: Google Drive (rclone remote: gdrive:OrangyyCarpels_DB_Backups)
# ==============================================================================

set -euo pipefail

# Configuration
DB_NAME="orangyycarpels"
DB_USER="root"
DB_PASS="Orangyy@Carpels2026!"
LOCAL_BACKUP_DIR="/var/backups/orangyycarpels"
LOG_FILE="/var/log/carpels_db_backup.log"
GDRIVE_REMOTE="gdrive:OrangyyCarpels_DB_Backups"
RETENTION_DAYS_LOCAL=14
RETENTION_DAYS_GDRIVE=30

TIMESTAMP="$(date +'%Y-%m-%d_%H%M%S')"
BACKUP_FILENAME="${DB_NAME}_${TIMESTAMP}.sql"
BACKUP_FILEPATH="${LOCAL_BACKUP_DIR}/${BACKUP_FILENAME}"
GZ_FILEPATH="${BACKUP_FILEPATH}.gz"

# Create directories
mkdir -p "$LOCAL_BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================================="
log "🚀 Starting Database Backup for [${DB_NAME}]"
log "=========================================================="

# 1. Execute mysqldump
log "1. Creating MySQL dump..."
if mysqldump -u"$DB_USER" -p"$DB_PASS" --single-transaction --quick --routines --triggers "$DB_NAME" > "$BACKUP_FILEPATH" 2>> "$LOG_FILE"; then
  log "✔ MySQL dump completed: ${BACKUP_FILENAME}"
else
  # Fallback without password if socket authentication is enabled
  mysqldump "$DB_NAME" --single-transaction --quick --routines --triggers > "$BACKUP_FILEPATH" 2>> "$LOG_FILE"
  log "✔ MySQL dump completed via root socket: ${BACKUP_FILENAME}"
fi

# 2. Compress Dump with Gzip
log "2. Compressing backup with gzip..."
gzip -f "$BACKUP_FILEPATH"
FILE_SIZE=$(du -h "$GZ_FILEPATH" | cut -f1)
log "✔ Compressed file: ${GZ_FILEPATH} (${FILE_SIZE})"

# 3. Upload / Sync to Google Drive
log "3. Uploading backup to Google Drive (${GDRIVE_REMOTE})..."
if command -v rclone > /dev/null 2>&1; then
  if rclone listremotes | grep -q "gdrive:"; then
    if rclone copy "$GZ_FILEPATH" "$GDRIVE_REMOTE" --log-file="$LOG_FILE" --log-level=INFO; then
      log "✔ Backup successfully synced to Google Drive: ${GDRIVE_REMOTE}/${DB_NAME}_${TIMESTAMP}.sql.gz"
    else
      log "⚠ Warning: rclone upload failed. Check Google Drive credentials in rclone.conf."
    fi
    
    # 4. Rotate old backups on Google Drive (keep last 30 days)
    log "4. Rotating Google Drive backups older than ${RETENTION_DAYS_GDRIVE} days..."
    rclone delete "$GDRIVE_REMOTE" --min-age "${RETENTION_DAYS_GDRIVE}d" 2>/dev/null || true
  else
    log "⚠ Notice: 'gdrive:' remote not configured in rclone yet. Run: bash deploy/setup-gdrive-backup.sh"
  fi
else
  log "⚠ Notice: rclone is not installed. Run: bash deploy/setup-gdrive-backup.sh"
fi

# 5. Rotate old local backups (keep last 14 days)
log "5. Cleaning local backups older than ${RETENTION_DAYS_LOCAL} days..."
find "$LOCAL_BACKUP_DIR" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS_LOCAL} -delete || true

log "🎉 Backup process completed successfully!"
log "==========================================================\n"
