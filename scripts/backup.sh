#!/bin/bash

# ============================================
# MyCalTravels - Nightly Backup Script
# ============================================
# Runs at 2:00 AM via cron.
# Uses VACUUM INTO for safe database backup.
# Encrypts every output with age before writing to disk.
# Includes integrity verification.
#
# ─── One-time setup (do this before first backup) ───
#
#   sudo apt install age sqlite3 rsync
#   mkdir -p /root/.age && chmod 700 /root/.age
#   age-keygen -o /root/.age/backup-key.txt
#       → writes a private key + prints the public key (age1...)
#   chmod 600 /root/.age/backup-key.txt
#
#   Create /etc/myahtravels/backup.env with:
#     BACKUP_AGE_PUBLIC_KEY=age1...
#
#   chmod 600 /etc/myahtravels/backup.env
#
#   ⚠️  Copy /root/.age/backup-key.txt to a password manager IMMEDIATELY.
#       If you lose the private key, encrypted backups are unrecoverable.
#       If the mini PC dies and the key is only on it, backups are useless.
#
# ─── Restore (in an emergency) ───
#
#   age -d -i /root/.age/backup-key.txt /backups/db/site-YYYY-MM-DD.db.age > site.db
#   sqlite3 site.db "PRAGMA integrity_check;"
#   sudo systemctl stop myahtravels
#   cp site.db /var/www/site/data/site.db
#   sudo systemctl start myahtravels
#
# ============================================

set -euo pipefail

# Load backup config (public key)
if [ -f /etc/myahtravels/backup.env ]; then
  # shellcheck disable=SC1091
  source /etc/myahtravels/backup.env
fi

if [ -z "${BACKUP_AGE_PUBLIC_KEY:-}" ]; then
  echo "ERROR: BACKUP_AGE_PUBLIC_KEY not set in /etc/myahtravels/backup.env"
  exit 1
fi

if ! command -v age >/dev/null 2>&1; then
  echo "ERROR: age is not installed (sudo apt install age)"
  exit 1
fi

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
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

exec 200>"${LOCK_FILE}"
flock -n 200 || { echo "Backup already running"; exit 1; }

mkdir -p "${DB_DIR}" "${MEDIA_DIR}" "${SYSTEM_DIR}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "${LOG_FILE}"
}

log "Starting backup..."

# ─── Database ───

log "Backing up database..."

if [ ! -f "${DB_PATH}" ]; then
    log "ERROR: Database file not found at ${DB_PATH}"
    exit 1
fi

DUMP_PATH="${TMP_DIR}/site-${DATE}.db"
sqlite3 "${DB_PATH}" "VACUUM INTO '${DUMP_PATH}'"

INTEGRITY=$(sqlite3 "${DUMP_PATH}" "PRAGMA integrity_check;")
if [ "${INTEGRITY}" != "ok" ]; then
    log "ERROR: Database backup integrity check failed: ${INTEGRITY}"
    exit 1
fi
log "Database integrity: OK"

# Compress + encrypt (age)
gzip -c "${DUMP_PATH}" \
    | age -r "${BACKUP_AGE_PUBLIC_KEY}" \
    > "${DB_DIR}/site-${DATE}.db.gz.age"

# Verify the encrypted file can be read back before trusting it
if ! age -d -i /root/.age/backup-key.txt "${DB_DIR}/site-${DATE}.db.gz.age" 2>/dev/null | gzip -t 2>/dev/null; then
    log "ERROR: Encrypted backup failed round-trip verification"
    rm -f "${DB_DIR}/site-${DATE}.db.gz.age"
    exit 1
fi

# Verify the decrypted round-trip still passes integrity
DECRYPTED_CHECK="${TMP_DIR}/verify.db"
age -d -i /root/.age/backup-key.txt "${DB_DIR}/site-${DATE}.db.gz.age" | gunzip > "${DECRYPTED_CHECK}"
VERIFY_INTEGRITY=$(sqlite3 "${DECRYPTED_CHECK}" "PRAGMA integrity_check;")
if [ "${VERIFY_INTEGRITY}" != "ok" ]; then
    log "ERROR: Encrypted backup failed integrity after round-trip"
    rm -f "${DB_DIR}/site-${DATE}.db.gz.age"
    exit 1
fi

log "Database backup complete: site-${DATE}.db.gz.age"

# Rotate: keep 30 daily
find "${DB_DIR}" -name "*.db.age" -mtime +30 -delete
log "Old database backups cleaned (30+ days)"

# ─── Media ───

log "Backing up media..."

if [ -d "${UPLOADS_PATH}" ]; then
    # Tar media into a single encrypted archive
    tar -czf - -C "${SITE_DIR}/public" uploads \
        | age -r "${BACKUP_AGE_PUBLIC_KEY}" \
        > "${MEDIA_DIR}/media-${DATE}.tar.gz.age"
    log "Media backup complete: media-${DATE}.tar.gz.age"

    find "${MEDIA_DIR}" -name "*.tar.gz.age" -mtime +14 -delete
    log "Old media backups cleaned (14+ days)"
else
    log "WARNING: Uploads directory not found at ${UPLOADS_PATH}"
fi

# ─── Weekly system config backup ───

if [ "$(date +%u)" -eq 7 ]; then
    log "Running weekly system config backup..."
    tar -czf - \
        -C "${SITE_DIR}" \
        package.json package-lock.json drizzle/ \
        -C /etc nginx/ \
        /etc/systemd/system/myahtravels.service 2>/dev/null \
        | age -r "${BACKUP_AGE_PUBLIC_KEY}" \
        > "${SYSTEM_DIR}/system-${DATE}.tar.gz.age"
    log "System config backup complete"

    find "${SYSTEM_DIR}" -name "*.tar.gz.age" -mtime +90 -delete
    log "Old system backups cleaned (90+ days)"
fi

log "Backup complete."
