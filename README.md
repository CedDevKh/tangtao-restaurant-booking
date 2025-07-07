# Tangtao - Restaurant Booking Platform

A modern, full-stack restaurant booking platform built with Next.js and Django. Tangtao allows users to discover restaurants, make reservations, and provides administrators with powerful tools to manage their restaurant listings.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![Django](https://img.shields.io/badge/Django-5.2.4-green)
![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue)
![Python](https://img.shields.io/badge/Python-3.13-blue)

## 🚀 Features

### For Users
- **Restaurant Discovery**: Browse restaurants with detailed information, photos, and ratings
- **Advanced Filtering**: Filter by cuisine type, rating, price range, and more
- **User Authentication**: Secure registration and login system
- **User Profiles**: Manage personal information and preferences
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Search**: Dynamic restaurant search and filtering

### For Administrators
- **Restaurant Management**: Full CRUD operations for restaurant listings
- **Admin Dashboard**: Dedicated interface for managing restaurants
- **User Management**: Monitor and manage user accounts
- **Analytics Ready**: Built with extensibility for future analytics features

### Technical Features
- **Modern UI/UX**: Built with Tailwind CSS and Radix UI components
- **Type Safety**: Full TypeScript implementation
- **API Integration**: RESTful API with Django REST Framework
- **Authentication**: Token-based authentication with secure session management
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Smooth loading experiences with skeleton screens

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **Icons**: Lucide React
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom error handling

### Backend
- **Framework**: Django 5.2.4
- **API**: Django REST Framework 3.16.0
- **Database**: PostgreSQL (with SQLite for development)
- **Authentication**: Django Token Authentication
- **CORS**: django-cors-headers
- **Environment**: django-environ
- **Filtering**: django-filter

### Development Tools
- **Package Manager**: npm (Frontend), pip (Backend)
- **Code Quality**: TypeScript compiler, Django built-in validation
- **Development Server**: Next.js dev server, Django development server

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **PostgreSQL** (for production) or SQLite (for development)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Tangtao
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Navigate to Django project
cd core

# Create environment file
copy .env.example .env  # Windows
# cp .env.example .env  # macOS/Linux

# Edit .env file with your database credentials
# For development, you can use SQLite (default)

# Run migrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser

# Start development server
python manage.py runserver 8000
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env.local  # Windows
# cp .env.example .env.local  # macOS/Linux

# Edit .env.local with your backend URL
# NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:9003
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin

## 📁 Project Structure

```
Tangtao/
├── backend/                    # Django backend
│   ├── core/                   # Main Django project
│   │   ├── core/              # Project settings
│   │   │   ├── settings.py    # Django settings
│   │   │   ├── urls.py        # URL routing
│   │   │   └── wsgi.py        # WSGI config
│   │   ├── users/             # User management app
│   │   │   ├── models.py      # User models
│   │   │   ├── serializers.py # API serializers
│   │   │   └── views.py       # API views
│   │   ├── marketplace/       # Restaurant management app
│   │   │   ├── models.py      # Restaurant models
│   │   │   ├── serializers.py # API serializers
│   │   │   └── views.py       # API views
│   │   └── manage.py          # Django management script
│   └── requirements.txt       # Python dependencies
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── admin/         # Admin dashboard
│   │   │   ├── restaurants/   # Restaurant pages
│   │   │   └── page.tsx       # Home page
│   │   ├── components/        # Reusable components
│   │   │   ├── ui/            # UI components
│   │   │   └── layout/        # Layout components
│   │   ├── contexts/          # React contexts
│   │   ├── lib/               # Utilities and API
│   │   └── hooks/             # Custom React hooks
│   ├── public/                # Static assets
│   ├── package.json           # Node.js dependencies
│   └── tailwind.config.ts     # Tailwind configuration
├── start_app.bat              # Windows startup script
└── README.md                  # This file
```

## 🔧 Configuration

### Backend Configuration

Create a `.env` file in `backend/core/` with the following variables:

```env
# Database
DATABASE_URL=sqlite:///db.sqlite3  # For development
# DATABASE_URL=postgresql://user:password@localhost:5432/tangtao  # For production

# Security
SECRET_KEY=your-secret-key-here
DEBUG=True  # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:9003

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Frontend Configuration

Create a `.env.local` file in `frontend/` with:

```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

## 🚀 Deployment

### Backend Deployment

1. **Prepare for Production**:
   ```bash
   # Install production dependencies
   pip install gunicorn psycopg2-binary

   # Collect static files
   python manage.py collectstatic

   # Run production checks
   python manage.py check --deploy
   ```

2. **Environment Variables**:
   - Set `DEBUG=False`
   - Configure production database
   - Set secure `SECRET_KEY`
   - Configure `ALLOWED_HOSTS`

### Frontend Deployment

1. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

2. **Deploy to Vercel** (recommended):
   ```bash
   npm install -g vercel
   vercel
   ```

## 📱 API Documentation

### Authentication Endpoints

- `POST /api/users/register/` - User registration
- `POST /api/users/login/` - User login
- `POST /api/users/logout/` - User logout
- `GET /api/users/profile/` - Get user profile
- `PUT /api/users/profile/` - Update user profile

### Restaurant Endpoints

- `GET /api/restaurants/` - List restaurants (with filtering)
- `GET /api/restaurants/{id}/` - Get restaurant details
- `POST /api/admin/restaurants/` - Create restaurant (admin only)
- `PUT /api/admin/restaurants/{id}/` - Update restaurant (admin only)
- `DELETE /api/admin/restaurants/{id}/` - Delete restaurant (admin only)

### Query Parameters

**Restaurant Listing**:
- `cuisine_type` - Filter by cuisine
- `price_range` - Filter by price range (1-4)
- `rating__gte` - Filter by minimum rating
- `is_featured` - Filter featured restaurants
- `is_active` - Filter active restaurants
- `ordering` - Sort results (rating, -rating, created_at, -created_at)

## 🧪 Testing

### Backend Tests

```bash
cd backend/core
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm run lint
npm run typecheck
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Development Notes

### Database Models

**User Model**:
- Extended Django User with profile fields
- Includes phone, date of birth, profile picture
- Account lockout for security

**Restaurant Model**:
- Comprehensive restaurant information
- Cuisine types, pricing, capacity
- Operating hours, ratings, featured status
- Image upload support

### Security Features

- Token-based authentication
- CORS protection
- SQL injection protection (Django ORM)
- XSS protection (React)
- Password validation and hashing
- Account lockout after failed attempts

### Performance Considerations

- Database query optimization
- Image optimization with Next.js
- Lazy loading for restaurant listings
- Efficient filtering and pagination
- Caching strategies ready for implementation

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS settings include frontend URL
2. **Authentication Issues**: Check token storage and API headers
3. **Database Errors**: Verify database connection and migrations
4. **Build Errors**: Check TypeScript types and dependency versions

### Debug Mode

Enable debug logging:

**Backend**:
```python
# In settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

**Frontend**:
```javascript
// Add to next.config.js
module.exports = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Django](https://www.djangoproject.com/) for the robust backend framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Lucide](https://lucide.dev/) for beautiful icons

## 📞 Support

For support, email [your-email@domain.com] or create an issue in the repository.

---

**Built with ❤️ by the Tangtao Team**
