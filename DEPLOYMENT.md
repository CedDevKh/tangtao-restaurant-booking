# DigitalOcean Deployment Guide

This project is configured for deployment on DigitalOcean App Platform with separate frontend and backend services.

## Deployment Configuration

The deployment is configured via `.do/app.yaml` with:

- **Backend Service**: Django/Python with Gunicorn
- **Frontend Service**: Next.js/Node.js 
- **Database**: PostgreSQL managed database

## Environment Variables

Set these environment variables in DigitalOcean App Platform:

### Backend (tangtao-backend)
- `SECRET_KEY`: Django secret key (generate a secure one)
- `DATABASE_URL`: Automatically provided by DigitalOcean
- `CORS_ALLOWED_ORIGINS`: Will be set to frontend URL automatically

### Frontend (tangtao-frontend)
- `NEXT_PUBLIC_API_URL`: Will be set to backend URL automatically

## Deployment Steps

1. **Push to GitHub**: Ensure your code is in a GitHub repository
2. **Create DigitalOcean App**: 
   - Go to DigitalOcean App Platform
   - Click "Create App"
   - Connect your GitHub repository
   - Upload the `.do/app.yaml` file when prompted
3. **Set Environment Variables**: Add the required secret environment variables
4. **Deploy**: DigitalOcean will automatically build and deploy your app

## Health Check

The backend includes a health check endpoint at `/health/` that verifies:
- Application is running
- Database connection is working

## Production Features

- **Static Files**: Served via WhiteNoise
- **Database**: PostgreSQL with automatic migrations
- **Security**: Production security settings enabled
- **Logging**: Structured logging for debugging
- **Auto-scaling**: Configured for horizontal scaling

## Local Development

For local development, use:
```bash
# Backend
cd backend/core
python manage.py runserver

# Frontend  
cd frontend
npm run dev
```

## Troubleshooting

- Check application logs in DigitalOcean dashboard
- Verify environment variables are set correctly
- Ensure GitHub repository is accessible
- Check health endpoint: `https://your-backend-url/health/`
