#!/usr/bin/env bash
# ==============================================================================
# 💾 Orangyy Carpels — Local MySQL Database Backup to Local Git Folder (1-Click)
# Dumps local MySQL database into ./backups/
# ==============================================================================

cd "$(dirname "$0")"

DB_USER="root"
DB_PASS="Sachin_99"
DB_NAME="orangyycarpels"
BACKUP_DIR="backups"
TIMESTAMP="$(date +'%Y-%m-%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/local_database_${TIMESTAMP}.sql"
GZ_FILE="${BACKUP_FILE}.gz"

mkdir -p "$BACKUP_DIR"

echo "=================================================================="
echo "💾 Backing up Local MySQL Database (${DB_NAME}) to ./backups/"
echo "=================================================================="

# Detect mysqldump or mariadb-dump
if command -v mariadb-dump > /dev/null 2>&1; then
  DUMP_BIN="mariadb-dump"
elif command -v mysqldump > /dev/null 2>&1; then
  DUMP_BIN="mysqldump"
elif [[ -f "/opt/homebrew/bin/mysqldump" ]]; then
  DUMP_BIN="/opt/homebrew/bin/mysqldump"
elif [[ -f "/usr/local/bin/mysqldump" ]]; then
  DUMP_BIN="/usr/local/bin/mysqldump"
else
  echo "❌ mysqldump not found."
  exit 1
fi

echo ">> Exporting local database..."
$DUMP_BIN -u"$DB_USER" -p"$DB_PASS" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  "$DB_NAME" > "$BACKUP_FILE"

gzip -9 "$BACKUP_FILE"
cp -f "$GZ_FILE" "${BACKUP_DIR}/latest_local_backup.sql.gz"

FILE_SIZE=$(du -h "$GZ_FILE" | cut -f1)
echo "✔ Local Database backup saved successfully!"
echo "   📁 File:     ${GZ_FILE} (${FILE_SIZE})"
echo "   📁 Shortcut: ${BACKUP_DIR}/latest_local_backup.sql.gz"
echo "=================================================================="
