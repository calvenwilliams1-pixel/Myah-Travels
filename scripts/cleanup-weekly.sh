#!/bin/bash

# ============================================
# Myah Travels - Weekly Cleanup Script
# ============================================
# Runs Sunday 4:00 AM via cron

set -euo pipefail

SITE_DIR="/var/www/site"
DB_PATH="${SITE_DIR}/data/site.db"
BACKUP_DIR="/backups"
ARCHIVE_DIR="${BACKUP_DIR}/activity-archive"
LOG_FILE="/var/log/myahtravels-cleanup.log"
LOCK_FILE="/tmp/myahtravels-cleanup-weekly.lock"

mkdir -p "${ARCHIVE_DIR}"

exec 200>"${LOCK_FILE}"
flock -n 200 || { echo "Weekly cleanup already running"; exit 1; }

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "${LOG_FILE}"
}

log "Starting weekly cleanup..."

ARCHIVE_FILE="${ARCHIVE_DIR}/activity-$(date +%Y-%m-%d).csv"

log "Exporting activity logs to ${ARCHIVE_FILE}..."

sqlite3 -header -csv "${DB_PATH}" "
    SELECT * FROM activity_log 
    WHERE created_at < datetime('now', '-12 months');
" > "${ARCHIVE_FILE}"

if [ -s "${ARCHIVE_FILE}" ]; then
    log "Export successful ($(wc -l < "${ARCHIVE_FILE}") lines)"
    
    sqlite3 "${DB_PATH}" "
        DELETE FROM activity_log 
        WHERE created_at < datetime('now', '-12 months');
    "
    log "Archived logs deleted from database"
else
    log "WARNING: Export empty or failed. Skipping deletion."
fi

log "Purging archived logs (24+ months)..."
find "${ARCHIVE_DIR}" -name "*.csv" -mtime +730 -delete

log "Anonymizing inactive leads (2+ years)..."
sqlite3 "${DB_PATH}" "
    UPDATE clients 
    SET 
        full_name = 'Anonymized Client',
        phone = NULL,
        email = NULL,
        custom_statement = NULL,
        notes = NULL,
        is_anonymized = 1,
        anonymized_at = datetime('now')
    WHERE created_at < datetime('now', '-2 years')
    AND status = 'new'
    AND is_anonymized = 0;
"

log "Weekly cleanup complete."
