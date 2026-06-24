# stop.ps1
# PowerShell script to tear down the local DailyNotesCloud development environment

param (
    [switch]$Reset
)

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Stopping DailyNotesCloud Environment... " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

if ($Reset) {
    Write-Host "`nStopping containers and deleting database volumes (-Reset)..." -ForegroundColor Yellow
    docker compose down -v
} else {
    Write-Host "`nStopping containers (database volumes will be preserved)..." -ForegroundColor Yellow
    docker compose down
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nEnvironment stopped successfully." -ForegroundColor Green
} else {
    Write-Warning "Docker Compose encountered an issue while stopping."
}
Write-Host "=============================================" -ForegroundColor Cyan
