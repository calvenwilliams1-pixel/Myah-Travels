#!/bin/bash

# ============================================
# Myah Travels - Restore Script
# ============================================
# Usage: ./restore.sh [backup-date]
# Example: ./restore.sh 2026-08-19

set -euo pipefail

BACKUP_DIR="/backups"
DB_DIR="${BACKUP_DIR}/db"
MEDIA_DIR="${BACKUP_DIR}/media"
SITE_DIR="/var/www/site"
DB_PATH="${SITE_DIR}/data/site.db"
UPLOADS_PATH="${SITE_DIR}/public/uploads"

if [ $# -eq 0 ]; then
    echo "Available database backups:"
    ls -lh "${DB_DIR}/" 2>/dev/null || echo "No backups found"
    echo ""
    echo "Usage: ./restore.sh [backup-date]"
    echo "Example: ./restore.sh 2026-08-19"
    exit 0
fi

DATE=$1

if [[ ! "${DATE}" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo "ERROR: Invalid date format. Use YYYY-MM-DD"
    exit 1
fi

BACKUP_FILE="${DB_DIR}/site-${DATE}.db"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}"
    echo "Available backups:"
    ls -lh "${DB_DIR}/"
    exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database."
echo "Backup to restore: ${BACKUP_FILE}"
echo ""
read -p "Type 'RESTORE' to continue: " CONFIRM

if [ "${CONFIRM}" != "RESTORE" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Stopping application..."
systemctl stop myahtravels 2>/dev/null || echo "Service not running"

echo "Backing up current database..."
if [ -f "${DB_PATH}" ]; then
    cp "${DB_PATH}" "${DB_PATH}.pre-restore-$(date +%Y-%m-%d-%H%M%S)"
fi

echo "Restoring database..."
cp "${BACKUP_FILE}" "${DB_PATH}"

rm -f "${DB_PATH}-wal" "${DB_PATH}-shm"

echo "Verifying restored database..."
INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;")
if [ "${INTEGRITY}" != "ok" ]; then
    echo "❌ ERROR: Restored database failed integrity check: ${INTEGRITY}"
    echo "Restoring previous database..."
    PRE_RESTORE=$(ls -t "${DB_PATH}.pre-restore-"* 2>/dev/null | head -1)
    if [ -n "${PRE_RESTORE}" ]; then
        cp "${PRE_RESTORE}" "${DB_PATH}"
        rm -f "${DB_PATH}-wal" "${DB_PATH}-shm"
        echo "Previous database restored."
    fi
    exit 1
fi

echo "✅ Database integrity verified."

echo "Restoring media..."
if [ -d "${MEDIA_DIR}" ]; then
    mkdir -p "${UPLOADS_PATH}"
    rsync -av --delete "${MEDIA_DIR}/" "${UPLOADS_PATH}/"
fi

echo "Starting application..."
systemctl start myahtravels 2>/dev/null || echo "Service start failed"

echo "✅ Restore complete."
