#!/usr/bin/env bash
# ==============================================================================
# Egyptian Student Housing Platform - Automated PostgreSQL Backup Script
# Conforms to docs/architecture/infrastructure.md (Section 6.3)
# ==============================================================================
set -euo pipefail

# Configuration with environment defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-${POSTGRES_DB:-student_housing}}"
DB_USERNAME="${DB_USERNAME:-${POSTGRES_USER:-postgres}}"
export PGPASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-postgres}}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Resolve target backup directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-"${SCRIPT_DIR}/../../infrastructure/database/backup"}"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE="${BACKUP_DIR}/${DB_DATABASE}_backup_${TIMESTAMP}.dump"
LOG_PREFIX="[PostgreSQL Backup $(date -u +"%Y-%m-%dT%H:%M:%SZ")]"

echo "${LOG_PREFIX} Starting database backup for database: '${DB_DATABASE}' at ${DB_HOST}:${DB_PORT}..."

# Execute pg_dump with custom compressed archive format (-Fc)
if command -v pg_dump >/dev/null 2>&1; then
    pg_dump \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USERNAME}" \
        -d "${DB_DATABASE}" \
        -F c \
        -b \
        -v \
        -f "${BACKUP_FILE}"
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q "student_housing_db"; then
    echo "${LOG_PREFIX} pg_dump not found locally; executing via Docker container student_housing_db..."
    docker exec -e PGPASSWORD="${PGPASSWORD}" student_housing_db \
        pg_dump -U "${DB_USERNAME}" -d "${DB_DATABASE}" -F c -b > "${BACKUP_FILE}"
else
    echo "${LOG_PREFIX} ERROR: Neither 'pg_dump' CLI nor Docker container 'student_housing_db' is accessible." >&2
    exit 1
fi

# Verify backup file size
if [ ! -s "${BACKUP_FILE}" ]; then
    echo "${LOG_PREFIX} ERROR: Backup file is empty or was not created. Removing invalid file." >&2
    rm -f "${BACKUP_FILE}"
    exit 2
fi

BACKUP_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
echo "${LOG_PREFIX} Backup successful: ${BACKUP_FILE} (Size: ${BACKUP_SIZE})"

# Generate SHA256 verification checksum
if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
fi

# Purge snapshots older than RETENTION_DAYS
echo "${LOG_PREFIX} Cleaning up backups older than ${RETENTION_DAYS} days in ${BACKUP_DIR}..."
PURGED_COUNT=0
while IFS= read -r old_file; do
    if [ -n "${old_file}" ]; then
        rm -f "${old_file}" "${old_file}.sha256"
        PURGED_COUNT=$((PURGED_COUNT + 1))
        echo "${LOG_PREFIX} Purged expired backup: $(basename "${old_file}")"
    fi
done < <(find "${BACKUP_DIR}" -name "${DB_DATABASE}_backup_*.dump" -type f -mtime +"${RETENTION_DAYS}" 2>/dev/null || true)

echo "${LOG_PREFIX} Backup process completed cleanly. Purged ${PURGED_COUNT} expired backups."
exit 0
