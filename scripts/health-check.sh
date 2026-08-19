#!/bin/bash

# ============================================
# Myah Travels - Health Check Script
# ============================================

set -euo pipefail

SITE_DIR="/var/www/site"
DB_PATH="${SITE_DIR}/data/site.db"
THRESHOLD_WARNING=80
THRESHOLD_CRITICAL=90

OUTPUT=""

DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "${DISK_USAGE}" -ge "${THRESHOLD_CRITICAL}" ]; then
    OUTPUT+="❌ CRITICAL: Disk usage at ${DISK_USAGE}%\n"
elif [ "${DISK_USAGE}" -ge "${THRESHOLD_WARNING}" ]; then
    OUTPUT+="⚠️ WARNING: Disk usage at ${DISK_USAGE}%\n"
else
    OUTPUT+="✅ Disk usage: ${DISK_USAGE}%\n"
fi

if [ -f "${DB_PATH}" ]; then
    DB_SIZE=$(du -h "${DB_PATH}" | cut -f1)
    OUTPUT+="✅ Database exists (${DB_SIZE})\n"
else
    OUTPUT+="❌ CRITICAL: Database not found\n"
fi

if systemctl is-active --quiet myahtravels 2>/dev/null; then
    OUTPUT+="✅ Service running\n"
else
    OUTPUT+="❌ CRITICAL: Service not running\n"
fi

LATEST_BACKUP=$(ls -t /backups/db/*.db 2>/dev/null | head -1)

if [ -n "${LATEST_BACKUP}" ]; then
    BACKUP_AGE=$(stat -c %Y "${LATEST_BACKUP}")
    NOW=$(date +%s)
    AGE_DAYS=$(( (NOW - BACKUP_AGE) / 86400 ))
    
    if [ "${AGE_DAYS}" -gt 2 ]; then
        OUTPUT+="❌ WARNING: Latest backup is ${AGE_DAYS} days old\n"
    else
        OUTPUT+="✅ Latest backup: ${AGE_DAYS} days old\n"
    fi
else
    OUTPUT+="❌ CRITICAL: No backups found\n"
fi

echo -e "${OUTPUT}"
