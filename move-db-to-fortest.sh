#!/usr/bin/env bash
# ==============================================================================
# 🐘 Orangyy Carpels — Move Local MySQL Database to ForTest Server (1-Click)
# ==============================================================================

cd "$(dirname "$0")"

echo "=================================================================="
echo "🐘 Moving Local Database to 'ForTest' Server (1-Click)"
echo "=================================================================="

# Run database synchronization with server credentials embedded
python3 deploy/sync-db-to-fortest.py "hdf1nMKKUxGq25y%"
