<#
.SYNOPSIS
  Egyptian Student Housing Platform - PostgreSQL Restore Script (Windows PowerShell)
.DESCRIPTION
  Restores a PostgreSQL database from a custom compressed backup file with pre-flight safety prompts.
#>
[CmdletBinding()]
param(
    [Parameter(Position=0, Mandatory=$false)]
    [string]$BackupFile,
    [switch]$Force,
    [string]$DbHost = $(if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }),
    [int]$DbPort = [int]$(if ($env:DB_PORT) { $env:DB_PORT } else { 5432 }),
    [string]$DbName = $(if ($env:DB_DATABASE) { $env:DB_DATABASE } elseif ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "student_housing" }),
    [string]$DbUser = $(if ($env:DB_USERNAME) { $env:DB_USERNAME } elseif ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }),
    [string]$DbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } elseif ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "postgres" }),
    [string]$BackupDir = $(if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { "$PSScriptRoot\..\..\infrastructure\database\backup" })
)

$ErrorActionPreference = "Stop"
$resolvedBackupDir = [System.IO.Path]::GetFullPath($BackupDir)

if ([string]::IsNullOrWhiteSpace($BackupFile)) {
    Write-Host "Usage: .\restore.ps1 -BackupFile <path_to_dump> [-Force]" -ForegroundColor Yellow
    Write-Host "`nAvailable backups in $resolvedBackupDir:" -ForegroundColor Cyan
    Get-ChildItem -Path $resolvedBackupDir -Filter "*.dump" -ErrorAction SilentlyContinue | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
    exit 1
}

if (-not (Test-Path $BackupFile)) {
    Write-Error "Specified backup file does not exist: $BackupFile"
    exit 2
}

# Optional checksum check
$shaFile = "$BackupFile.sha256"
if (Test-Path $shaFile) {
    Write-Host "Validating SHA256 checksum..." -ForegroundColor Gray
    $expectedHash = ((Get-Content $shaFile).Split(' ')[0]).Trim()
    $actualHash = (Get-FileHash -Path $BackupFile -Algorithm SHA256).Hash
    if ($expectedHash -ne $actualHash) {
        Write-Error "Checksum mismatch! Expected: $expectedHash, Actual: $actualHash"
        exit 3
    }
    Write-Host "Checksum verified OK." -ForegroundColor Green
}

if (-not $Force) {
    Write-Host "================================================================================" -ForegroundColor Red
    Write-Host "WARNING: Restoring will overwrite existing tables in '$DbName' on ${DbHost}:${DbPort}!" -ForegroundColor Red
    Write-Host "Backup File: $BackupFile" -ForegroundColor Yellow
    Write-Host "================================================================================" -ForegroundColor Red
    $response = Read-Host "Type 'CONFIRM' to proceed with restoration"
    if ($response -ne "CONFIRM") {
        Write-Host "Restoration aborted." -ForegroundColor DarkYellow
        exit 0
    }
}

Write-Host "[$((Get-Date).ToString('u'))] Restoring database '$DbName'..." -ForegroundColor Cyan
$env:PGPASSWORD = $DbPassword

$pgRestoreCmd = Get-Command "pg_restore" -ErrorAction SilentlyContinue
if (-not $pgRestoreCmd) {
    $standardPaths = Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Filter "pg_restore.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($standardPaths) { $pgRestoreCmd = $standardPaths.FullName }
}

if ($pgRestoreCmd) {
    & $pgRestoreCmd -h $DbHost -p $DbPort -U $DbUser -d $DbName --clean --if-exists --no-owner $BackupFile
} else {
    $dockerContainer = docker ps --format "{{.Names}}" 2>$null | Select-String "student_housing_db"
    if ($dockerContainer) {
        Write-Host "Local pg_restore not found; using Docker container 'student_housing_db'..." -ForegroundColor Yellow
        Get-Content $BackupFile -Raw | docker exec -i -e PGPASSWORD=$DbPassword student_housing_db pg_restore -U $DbUser -d $DbName --clean --if-exists --no-owner
    } else {
        Write-Error "Neither pg_restore nor Docker container 'student_housing_db' is available."
        exit 1
    }
}

Write-Host "[$((Get-Date).ToString('u'))] Database restoration completed successfully." -ForegroundColor Green
exit 0
