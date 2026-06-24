# start.ps1
# PowerShell script to spin up the local DailyNotesCloud development environment

param (
    [switch]$Reset
)

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Starting DailyNotesCloud Environment... " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 0. Stop any existing environment first
Write-Host "`n[0/4] Stopping any existing environment..." -ForegroundColor Yellow
if ($Reset) {
    .\stop.ps1 -Reset
} else {
    .\stop.ps1
}

# 1. Start Docker Compose in detached mode
Write-Host "`n[1/4] Launching containers via Docker Compose..." -ForegroundColor Yellow
docker compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker Compose containers. Make sure Docker Desktop is running."
    exit $LASTEXITCODE
}

# 2. Wait for the PostgreSQL database to be healthy
Write-Host "`n[2/4] Waiting for PostgreSQL database to be ready..." -ForegroundColor Yellow
$dbReady = $false
for ($i = 1; $i -le 15; $i++) {
    # pg_isready is a built-in Postgres utility that returns 0 when the server is accepting connections
    $null = docker compose exec db pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dbReady = $true
        break
    }
    Write-Host "Database is starting up... (Attempt $i/15)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if (-not $dbReady) {
    Write-Error "Database failed to become ready in time."
    exit 1
}
Write-Host "Database is ready to accept connections!" -ForegroundColor Green

# 3. Run database migrations inside the backend container
Write-Host "`n[3/4] Running database migrations..." -ForegroundColor Yellow
docker compose exec backend npm run migrate:up

if ($LASTEXITCODE -ne 0) {
    Write-Error "Database migrations failed."
    exit $LASTEXITCODE
}

# 4. Seed default demo data
Write-Host "`n[4/4] Seeding default demo data..." -ForegroundColor Yellow
# Run the compiled seed script inside the production container
docker compose exec backend node dist/db/seed.js

if ($LASTEXITCODE -ne 0) {
    Write-Error "Database seeding failed."
    exit $LASTEXITCODE
}

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host " Environment is ready!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host " Frontend Client : http://localhost:3000" -ForegroundColor Cyan
Write-Host " Backend API     : http://localhost:5000" -ForegroundColor Cyan
Write-Host " Database Port   : localhost:5432" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Green
