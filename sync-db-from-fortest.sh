#!/usr/bin/env bash
cd "$(dirname "$0")"
python3 deploy/sync-db-from-fortest.py "$@"
