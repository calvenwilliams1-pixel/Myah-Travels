#!/bin/bash

# ============================================
# Myah Travels - Deployment Script
# ============================================
# Pulls latest code, builds, migrates, restarts
# Aborts on migration failure with rollback

set -euo pipefail

SITE_DIR="/var/www/site"
LOG_FILE="/var/log/myahtravels-deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "Starting deployment..."

cd "${SITE_DIR}"

PREV_COMMIT=$(git rev-parse HEAD)
log "Previous commit: ${PREV_COMMIT}"

log "Pulling latest code..."
git pull origin main

log "Installing dependencies..."
npm ci

log "Running database migrations..."
if ! npm run db:migrate; then
    log "❌ ERROR: Migration failed. Aborting deployment."
    git reset --hard "${PREV_COMMIT}"
    exit 1
fi

log "Building application..."
npm run build

log "Restarting service..."
systemctl restart myahtravels

log "Waiting for service to start..."
sleep 5

if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
    log "✅ Deployment successful."
    echo "Deployment successful."
else
    log "❌ ERROR: Health check failed. Rolling back..."
    git reset --hard "${PREV_COMMIT}"
    npm ci
    npm run build
    systemctl restart myahtravels
    echo "Deployment failed. Rolled back to ${PREV_COMMIT}"
    exit 1
fi
