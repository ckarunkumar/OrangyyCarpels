#!/usr/bin/env bash
# ==============================================================================
# 🍊 Orangyy Carpels — Move Local Code to ForTest Server (1-Click)
# ==============================================================================

cd "$(dirname "$0")"

echo "=================================================================="
echo "🍊 Moving Local Code to 'ForTest' Server (1-Click)"
echo "=================================================================="

# Run 1-shot deploy script with server credentials embedded
python3 deploy/one-shot-deploy.py "hdf1nMKKUxGq25y%"
