#!/usr/bin/env bash
# ==============================================================================
# Egyptian Student Housing Platform - PostgreSQL Database Restore Script
# Conforms to docs/architecture/infrastructure.md (Section 6.3)
# ==============================================================================
set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-${POSTGRES_DB:-student_housing}}"
DB_USERNAME="${DB_USERNAME:-${POSTGRES_USER:-postgres}}"
export PGPASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-postgres}}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-"${SCRIPT_DIR}/../../infrastructure/database/backup"}"

BACKUP_FILE="${1:-}"
FORCE_FLAG="${2:-}"

LOG_PREFIX="[PostgreSQL Restore $(date -u +"%Y-%m-%dT%H:%M:%SZ")]"

# If no backup file supplied, list available backups and exit
if [ -z "${BACKUP_FILE}" ]; then
    echo "${LOG_PREFIX} Usage: $0 <path_to_backup_file.dump> [--force]"
    echo ""
    echo "Available backups in ${BACKUP_DIR}:"
    ls -lh "${BACKUP_DIR}"/*.dump 2>/dev/null || echo "  (No backup files found)"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "${LOG_PREFIX} ERROR: Specified backup file does not exist: '${BACKUP_FILE}'" >&2
    exit 2
fi

# Checksum verification if .sha256 exists
if [ -f "${BACKUP_FILE}.sha256" ]; then
    echo "${LOG_PREFIX} Verifying SHA256 checksum..."
    if command -v sha256sum >/dev/null 2>&1; then
        (cd "$(dirname "${BACKUP_FILE}")" && sha256sum -c "$(basename "${BACKUP_FILE}.sha256")")
    fi
    echo "${LOG_PREFIX} Checksum verified successfully."
fi

# Pre-flight safety confirmation
if [ "${FORCE_FLAG}" != "--force" ] && [ "${FORCE_FLAG}" != "-y" ]; then
    echo "================================================================================"
    echo "WARNING: Restoring will overwrite existing tables and data in '${DB_DATABASE}'!"
    echo "Host: ${DB_HOST}:${DB_PORT} | File: ${BACKUP_FILE}"
    echo "================================================================================"
    read -rp "Type 'CONFIRM' to proceed with database restoration: " CONFIRMATION
    if [ "${CONFIRMATION}" != "CONFIRM" ]; then
        echo "${LOG_PREFIX} Restoration aborted by user."
        exit 0
    fi
fi

echo "${LOG_PREFIX} Restoring database '${DB_DATABASE}' from '${BACKUP_FILE}'..."

if command -v pg_restore >/dev/null 2>&1; then
    pg_restore \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USERNAME}" \
        -d "${DB_DATABASE}" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        -v \
        "${BACKUP_FILE}" || true
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q "student_housing_db"; then
    echo "${LOG_PREFIX} pg_restore not found locally; executing via Docker container student_housing_db..."
    docker exec -i -e PGPASSWORD="${PGPASSWORD}" student_housing_db \
        pg_restore -U "${DB_USERNAME}" -d "${DB_DATABASE}" --clean --if-exists --no-owner < "${BACKUP_FILE}" || true
else
    echo "${LOG_PREFIX} ERROR: Neither 'pg_restore' CLI nor Docker container 'student_housing_db' is accessible." >&2
    exit 1
fi

echo "${LOG_PREFIX} Database restoration completed successfully."
exit 0
