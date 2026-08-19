#!/bin/bash

# ============================================
# Myah Travels - Nightly Backup Script
# ============================================
# Runs at 2:00 AM via cron
# Uses VACUUM INTO for safe database backup
# Includes integrity verification

set -euo pipefail

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/backups"
DB_DIR="${BACKUP_DIR}/db"
MEDIA_DIR="${BACKUP_DIR}/media"
SYSTEM_DIR="${BACKUP_DIR}/system"
SITE_DIR="/var/www/site"
DB_PATH="${SITE_DIR}/data/site.db"
UPLOADS_PATH="${SITE_DIR}/public/uploads"
LOG_FILE="${BACKUP_DIR}/backup.log"
LOCK_FILE="/tmp/myahtravels-backup.lock"

exec 200>"${LOCK_FILE}"
flock -n 200 || { echo "Backup already running"; exit 1; }

mkdir -p "${DB_DIR}" "${MEDIA_DIR}" "${SYSTEM_DIR}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "${LOG_FILE}"
}

log "Starting backup..."

log "Backing up database..."

if [ -f "${DB_PATH}" ]; then
    rm -f "${DB_DIR}/site-${DATE}.db"
    sqlite3 "${DB_PATH}" "VACUUM INTO '${DB_DIR}/site-${DATE}.db'"
    
    INTEGRITY=$(sqlite3 "${DB_DIR}/site-${DATE}.db" "PRAGMA integrity_check;")
    if [ "${INTEGRITY}" == "ok" ]; then
        log "Database backup verified: OK"
    else
        log "ERROR: Database backup integrity check failed: ${INTEGRITY}"
        rm -f "${DB_DIR}/site-${DATE}.db"
        exit 1
    fi
    
    log "Database backup complete: site-${DATE}.db"
else
    log "ERROR: Database file not found at ${DB_PATH}"
    exit 1
fi

find "${DB_DIR}" -name "*.db" -mtime +30 -delete
log "Old database backups cleaned (30+ days)"

log "Backing up media..."

if [ -d "${UPLOADS_PATH}" ]; then
    rsync -av --delete "${UPLOADS_PATH}/" "${MEDIA_DIR}/"
    log "Media backup complete"
else
    log "WARNING: Uploads directory not found"
fi

if [ "$(date +%u)" -eq 7 ]; then
    log "Running weekly full system backup..."
    tar -czf "${SYSTEM_DIR}/system-${DATE}.tar.gz" \
        "${SITE_DIR}/" \
        /etc/nginx/ \
        /etc/systemd/system/myahtravels.service 2>/dev/null || true
    log "System backup complete"
    
    find "${SYSTEM_DIR}" -name "*.tar.gz" -mtime +90 -delete
    log "Old system backups cleaned (90+ days)"
fi

log "Backup complete."
