# PowerShell script to start Django backend with network binding
# Purge expired offers on startup (safe no-op if none)
Write-Host "Purging expired offers..." -ForegroundColor Yellow
python manage.py purge_expired_offers

Write-Host "Starting Django backend on all interfaces (0.0.0.0:8000)..." -ForegroundColor Green
python manage.py runserver 0.0.0.0:8000