#!/bin/bash

# ============================================
# Myah Travels - Daily Cleanup Script
# ============================================
# Runs at 3:00 AM via cron

set -euo pipefail

SITE_DIR="/var/www/site"
DB_PATH="${SITE_DIR}/data/site.db"
UPLOADS_PATH="${SITE_DIR}/public/uploads"
LOG_FILE="/var/log/myahtravels-cleanup.log"
LOCK_FILE="/tmp/myahtravels-cleanup-daily.lock"

exec 200>"${LOCK_FILE}"
flock -n 200 || { echo "Cleanup already running"; exit 1; }

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "${LOG_FILE}"
}

log "Starting daily cleanup..."

log "Deleting soft-deleted media files (90+ days)..."

DELETED_MEDIA=$(sqlite3 "${DB_PATH}" "
    SELECT file_path FROM media 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < datetime('now', '-90 days');
")

for FILE in ${DELETED_MEDIA}; do
    FULL_PATH="${UPLOADS_PATH}/${FILE}"
    if [ -f "${FULL_PATH}" ]; then
        rm -f "${FULL_PATH}"
        log "Deleted file: ${FILE}"
    fi
done

log "Cleaning expired magic links (7+ days)..."
sqlite3 "${DB_PATH}" "
    DELETE FROM portal_magic_links 
    WHERE expires_at < datetime('now') 
    AND used_at IS NULL;
"

log "Cleaning expired portal sessions (30+ days)..."
sqlite3 "${DB_PATH}" "
    DELETE FROM portal_sessions 
    WHERE expires_at < datetime('now');
"

log "Cleaning processed emails (30+ days)..."
sqlite3 "${DB_PATH}" "
    DELETE FROM email_queue 
    WHERE status IN ('sent', 'failed') 
    AND created_at < datetime('now', '-30 days');
"

log "Cleaning old revisions (90+ days)..."
sqlite3 "${DB_PATH}" "
    DELETE FROM revisions 
    WHERE created_at < datetime('now', '-90 days');
"

log "Purging soft-deleted records (90+ days)..."
sqlite3 "${DB_PATH}" "
    DELETE FROM posts WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-90 days');
    DELETE FROM guides WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-90 days');
    DELETE FROM reviews WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-90 days');
    DELETE FROM clients WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-90 days');
    DELETE FROM portals WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-90 days');
    DELETE FROM media WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-90 days');
"

log "Daily cleanup complete."
