#!/usr/bin/env bash
# ==============================================================================
# 📦 Orangyy Carpels — Live DB Backup to Local Git Folder (1-Click)
# Downloads production database from carpels.orangyy.design into ./backups/
# ==============================================================================

cd "$(dirname "$0")"

echo "=================================================================="
echo "📦 Backing up Live Database (carpels.orangyy.design) to Local Git Folder"
echo "=================================================================="

python3 deploy/backup-db-from-golive.py "hdf1nMKKUxGq25y%"
