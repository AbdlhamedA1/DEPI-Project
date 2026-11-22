<#
.SYNOPSIS
  Egyptian Student Housing Platform - Automated PostgreSQL Backup Script (Windows PowerShell)
.DESCRIPTION
  Creates a compressed timestamped PostgreSQL custom dump, generates SHA256 checksum,
  and purges backup archives older than the specified retention window (default 7 days).
#>
[CmdletBinding()]
param(
    [string]$DbHost = $(if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }),
    [int]$DbPort = [int]$(if ($env:DB_PORT) { $env:DB_PORT } else { 5432 }),
    [string]$DbName = $(if ($env:DB_DATABASE) { $env:DB_DATABASE } elseif ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "student_housing" }),
    [string]$DbUser = $(if ($env:DB_USERNAME) { $env:DB_USERNAME } elseif ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }),
    [string]$DbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } elseif ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "postgres" }),
    [string]$BackupDir = $(if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { "$PSScriptRoot\..\..\infrastructure\database\backup" }),
    [int]$RetentionDays = 7
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$resolvedBackupDir = [System.IO.Path]::GetFullPath($BackupDir)

if (-not (Test-Path $resolvedBackupDir)) {
    New-Item -ItemType Directory -Path $resolvedBackupDir -Force | Out-Null
}

$backupFilePath = Join-Path $resolvedBackupDir "${DbName}_backup_${timestamp}.dump"
$sha256FilePath = "$backupFilePath.sha256"

Write-Host "[$((Get-Date).ToString('u'))] Initiating backup for '$DbName' on ${DbHost}:${DbPort}..." -ForegroundColor Cyan

$env:PGPASSWORD = $DbPassword

# Detect pg_dump binary
$pgDumpCmd = Get-Command "pg_dump" -ErrorAction SilentlyContinue
if (-not $pgDumpCmd) {
    # Check standard PostgreSQL program files locations
    $standardPaths = Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Filter "pg_dump.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($standardPaths) {
        $pgDumpCmd = $standardPaths.FullName
    }
}

if ($pgDumpCmd) {
    & $pgDumpCmd -h $DbHost -p $DbPort -U $DbUser -d $DbName -F c -b -f $backupFilePath
    if ($LASTEXITCODE -ne 0) {
        Write-Error "pg_dump failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
} else {
    # Fallback to docker exec if container is running
    $dockerContainer = docker ps --format "{{.Names}}" 2>$null | Select-String "student_housing_db"
    if ($dockerContainer) {
        Write-Host "Local pg_dump not found; falling back to Docker container 'student_housing_db'..." -ForegroundColor Yellow
        docker exec -e PGPASSWORD=$DbPassword student_housing_db pg_dump -U $DbUser -d $DbName -F c -b > $backupFilePath
    } else {
        Write-Error "Neither pg_dump nor Docker container 'student_housing_db' is accessible."
        exit 1
    }
}

if (-not (Test-Path $backupFilePath) -or (Get-Item $backupFilePath).Length -eq 0) {
    Write-Error "Backup failed: Output file is missing or zero bytes."
    if (Test-Path $backupFilePath) { Remove-Item $backupFilePath -Force }
    exit 2
}

$fileSizeMb = [math]::Round((Get-Item $backupFilePath).Length / 1MB, 2)
Write-Host "[$((Get-Date).ToString('u'))] Backup created: $backupFilePath ($fileSizeMb MB)" -ForegroundColor Green

# Generate SHA256 checksum
$hash = (Get-FileHash -Path $backupFilePath -Algorithm SHA256).Hash
Set-Content -Path $sha256FilePath -Value "$hash *$((Split-Path $backupFilePath -Leaf))"

# Retention Purge
Write-Host "[$((Get-Date).ToString('u'))] Cleaning backups older than $RetentionDays days..." -ForegroundColor Gray
$cutoff = (Get-Date).AddDays(-$RetentionDays)
$purged = 0

Get-ChildItem -Path $resolvedBackupDir -Filter "${DbName}_backup_*.dump" | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
    $itemSha = "$($_.FullName).sha256"
    Remove-Item $_.FullName -Force
    if (Test-Path $itemSha) { Remove-Item $itemSha -Force }
    Write-Host "Purged expired snapshot: $($_.Name)" -ForegroundColor DarkYellow
    $purged++
}

Write-Host "[$((Get-Date).ToString('u'))] Backup complete. Purged $purged expired files." -ForegroundColor Green
exit 0
