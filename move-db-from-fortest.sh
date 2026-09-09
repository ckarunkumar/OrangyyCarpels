#!/usr/bin/env bash
# ==============================================================================
# 📥 Orangyy Carpels — Move ForTest Database to Local MySQL (1-Click)
# ==============================================================================

cd "$(dirname "$0")"

echo "=================================================================="
echo "📥 Moving 'ForTest' Database to Local MySQL (1-Click)"
echo "=================================================================="

# Run database synchronization with server credentials embedded
python3 deploy/sync-db-from-fortest.py "hdf1nMKKUxGq25y%"
