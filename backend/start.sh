#!/bin/bash
# Startup script for Django backend

# Navigate to the Django project directory
cd backend/core

# Collect static files
python manage.py collectstatic --noinput

# Run database migrations
python manage.py migrate

# Start Gunicorn server
exec gunicorn --bind 0.0.0.0:8000 --workers 3 core.wsgi:application
