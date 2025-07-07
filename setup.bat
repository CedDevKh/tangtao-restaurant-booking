@echo off
echo =====================================
echo    Tangtao Setup Script
echo =====================================
echo.

echo Setting up Backend...
echo.

cd backend

echo Creating Python virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

cd core

echo Creating environment file...
if not exist ".env" (
    copy .env.example .env
    echo Environment file created. Please edit .env with your settings.
) else (
    echo Environment file already exists.
)

echo Running database migrations...
python manage.py migrate

echo Creating superuser (follow the prompts)...
python manage.py createsuperuser

cd ..\..

echo.
echo Setting up Frontend...
echo.

cd frontend

echo Installing Node.js dependencies...
npm install

echo Creating environment file...
if not exist ".env.local" (
    copy .env.example .env.local
    echo Environment file created. Please edit .env.local if needed.
) else (
    echo Environment file already exists.
)

cd ..

echo.
echo =====================================
echo Setup completed!
echo.
echo To start the application, run:
echo   start_app.bat
echo.
echo Or manually:
echo   Backend:  cd backend\core && python manage.py runserver
echo   Frontend: cd frontend && npm run dev
echo.
echo Access the app at:
echo   Frontend: http://localhost:9003
echo   Backend:  http://localhost:8000
echo   Admin:    http://localhost:8000/admin
echo =====================================

pause
