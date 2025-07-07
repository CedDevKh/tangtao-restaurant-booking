@echo off
echo =====================================
echo    Tangtao Restaurant Booking App
echo =====================================
echo.

echo Checking if environment files exist...
if not exist "backend\core\.env" (
    echo WARNING: backend\.env file not found!
    echo Please copy .env.example to .env and configure it.
    echo.
)

if not exist "frontend\.env.local" (
    echo WARNING: frontend\.env.local file not found!
    echo Please copy .env.example to .env.local and configure it.
    echo.
)

echo Starting Django Backend on http://localhost:8000...
start "Django Backend" cmd /k "cd backend\core && python manage.py runserver"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Next.js Frontend on http://localhost:9003...
start "Next.js Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================
echo Both services are starting...
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:9003
echo Admin Panel: http://localhost:8000/admin
echo.
echo You can close this window.
echo =====================================
