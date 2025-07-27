# Tangtao - Restaurant Booking Platform

## 📊 Project Overview for Managers (2025)

Tangtao is a full-stack, production-ready restaurant booking platform designed for both end-users and administrators. It leverages a modern tech stack (Next.js, Django, PostgreSQL) and is built for scalability, mobile-first UX, and extensibility.

### Key Implementations

- **Frontend (Next.js + TypeScript):**
  - Dynamic restaurant listing and detail pages (data fetched from backend)
  - Admin dashboard for CRUD operations on restaurants
  - User 6. **Mobile Navigation**: Verify bottom navigation visibility on mobile devices
7. **PWA Installation**: Check manifest.json and service worker registration
8. **Search Navigation**: Ensure search bar properly navigates to search page with URL parameters
9. **Cuisine Categories**: Verify all 14 cuisine types display correctly including Khmer and Fine Dining
10. **Google Images**: Test external image loading from Google Images domain
11. **Booking Status Updates**: Check admin booking management functionalitythentication, profile management, and booking management
  - AI-powered restaurant recommendations and advanced search/filtering
  - Responsive, mobile-first UI with dark/light/system theme support
  - PWA features: installable, offline support, service worker, manifest
  - Modern UI/UX: Tailwind CSS, Radix UI, custom components, inline SVG icons

- **Backend (Django + Django REST Framework):**
  - RESTful API for restaurants, users, and bookings
  - Custom user model with extended profile fields
  - Restaurant model supports flexible image URLs, time fields, and rich metadata
  - Admin endpoints for secure management (CRUD, stats, analytics-ready)
  - Token-based authentication, CORS, and security best practices
  - PostgreSQL for production, SQLite for development

### Current Features

- **For Users:**
  - Browse, search, and filter restaurants with real-time updates
  - Advanced search functionality with navigation from search bar to dedicated search page
  - View detailed restaurant pages (dynamic, not static)
  - Make and manage bookings with comprehensive booking management
  - Personalized AI recommendations
  - Mobile-optimized navigation and PWA install
  - Support for Google Images integration with optimized image loading

- **For Admins:**
  - Add, edit, and delete restaurants via comprehensive dashboard
  - Set opening/closing times, image URLs, and all metadata
  - Support for 14 cuisine types including Khmer and Fine Dining categories
  - View platform stats and analytics (extensible)
  - Manage featured/active status for restaurants
  - Complete booking management with status updates (pending, confirmed, completed, cancelled)

### Architecture Highlights

- **API-first:** All data flows through a documented REST API
- **Type Safety:** TypeScript (frontend) and Python (backend)
- **Modern DevOps:** .env-based config, scripts for setup/start, Vercel-ready frontend
- **Security:** Token auth, CORS, XSS/SQLi protection, password validation
- **Performance:** SSR, lazy loading, optimized images, skeleton loaders

For more details, see the full documentation below or contact the dev team.

A modern, full-stack restaurant booking platform built with Next.js and Django. Tangtao allows users to discover restaurants, make reservations, and provides administrators with powerful tools to manage their restaurant listings.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![Django](https://img.shields.io/badge/Django-5.2.4-green)
![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue)
![Python](https://img.shields.io/badge/Python-3.13-blue)

## 🚀 Features

### For Users
- **Restaurant Discovery**: Browse restaurants with detailed information, photos, and ratings
- **Advanced Search & Filtering**: 
  - Filter by cuisine type (14 categories including Khmer and Fine Dining), rating, price range, and more
  - Real-time search with navigation from search bar to dedicated search page
  - URL parameter-based search for bookmarkable results
- **AI-Powered Recommendations**: Get personalized restaurant suggestions based on preferences
- **Enhanced Booking System**: 
  - View and manage restaurant reservations with detailed booking information
  - Real-time booking status updates (pending, confirmed, completed, cancelled)
- **Google Images Integration**: Support for external images with optimized loading from Google Images
- **Mobile-First Design**: Optimized mobile experience with bottom navigation
- **User Authentication**: Secure registration and login system
- **User Profiles**: Manage personal information and preferences
- **Theme Support**: Light, dark, and system theme options
- **PWA Ready**: Progressive Web App capabilities for mobile installation

### For Administrators
- **Restaurant Management**: Full CRUD operations for restaurant listings with comprehensive admin dashboard
- **Cuisine Type Management**: Support for 14 cuisine categories including Khmer and Fine Dining
- **Booking Management**: 
  - View all customer bookings across the platform
  - Update booking statuses (pending → confirmed → completed, or cancelled)
  - Comprehensive booking analytics and statistics
- **Image Management**: Support for Google Images and external image URLs with Next.js optimization
- **User Management**: Monitor and manage user accounts
- **Analytics Ready**: Built with extensibility for future analytics features
- **Restaurant Status Control**: Toggle active/featured status for restaurants

### Technical Features
- **Modern UI/UX**: Built with Tailwind CSS and Radix UI components
- **Type Safety**: Full TypeScript implementation
- **API Integration**: RESTful API with Django REST Framework
- **Advanced Search System**: 
  - URL parameter-based search with navigation
  - Real-time filtering and search functionality
  - Dedicated search page with comprehensive results
- **Enhanced Image Support**: 
  - Next.js Image optimization for external URLs
  - Google Images integration with proper configuration
  - Remote image pattern support for multiple domains
- **Comprehensive Booking System**:
  - Real-time booking status management
  - Admin booking oversight with update capabilities
  - Detailed booking analytics and customer information
- **Extended Cuisine Support**: 14 cuisine types including Khmer and Fine Dining categories
- **Authentication**: Token-based authentication with secure session management
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Smooth loading experiences with skeleton screens
- **Hydration-Safe**: Zero hydration errors with proper SSR/client rendering
- **Mobile Navigation**: Accessible bottom navigation for mobile devices
- **Theme System**: Complete dark/light mode with system preference detection
- **PWA Features**: Service worker, manifest, and offline-ready capabilities

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **Icons**: Inline SVGs (optimized for hydration)
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom error handling
- **PWA**: Service Worker, Web App Manifest
- **Theme System**: Light/Dark/System theme support
- **Image Optimization**: Next.js Image component with remote pattern support for Google Images
- **Search System**: URL parameter-based navigation with dedicated search page

### Backend
- **Framework**: Django 5.2.4
- **API**: Django REST Framework 3.16.0
- **Database**: PostgreSQL (with SQLite for development)
- **Authentication**: Django Token Authentication
- **CORS**: django-cors-headers for frontend integration
- **Environment**: django-environ for configuration management
- **Filtering**: django-filter for advanced search and filtering
- **Image Handling**: Support for external image URLs including Google Images
- **Booking System**: Comprehensive booking management with status tracking

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

### 5. Test Key Features

- **Homepage**: Browse featured restaurants and search
- **Advanced Search**: Use the search bar to navigate to the dedicated search page with URL parameters
- **Restaurants**: Filter and browse all restaurants with 14 cuisine types including Khmer and Fine Dining
- **Booking Management**: Test the comprehensive booking system with status updates
- **Admin Dashboard**: Access admin features for restaurant and booking management
- **Google Images**: Test external image loading and optimization
- **Mobile Navigation**: Test bottom navigation on mobile devices
- **Theme Switching**: Try light/dark mode in Settings
- **AI Recommendations**: Get personalized restaurant suggestions

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
│   │   │   ├── search/        # Advanced search functionality with URL parameters
│   │   │   ├── bookings/      # Comprehensive booking management
│   │   │   ├── recommendations/ # AI recommendations
│   │   │   ├── settings/      # User settings & theme
│   │   │   └── page.tsx       # Home page
│   │   ├── components/        # Reusable components
│   │   │   ├── ui/            # UI components
│   │   │   └── layout/        # Layout components (navbar, footer, mobile nav)
│   │   ├── contexts/          # React contexts (Auth, Theme)
│   │   ├── lib/               # Utilities and API
│   │   └── hooks/             # Custom React hooks
│   ├── public/                # Static assets & PWA files
│   │   ├── icons/             # App icons for PWA
│   │   ├── manifest.json      # PWA manifest
│   │   ├── sw.js             # Service worker
│   │   └── theme-init.js     # Theme initialization
│   ├── package.json           # Node.js dependencies
│   ├── next.config.ts         # Next.js configuration with image optimization
│   └── tailwind.config.ts     # Tailwind configuration
├── start_app.bat              # Windows startup script
├── start_frontend.bat         # Frontend startup script
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

# Image optimization configuration is handled in next.config.ts
# Supports Google Images and other external domains
```

## 📱 Mobile & PWA Features

### Mobile Navigation
- **Bottom Navigation**: Easy thumb-friendly navigation on mobile devices
- **Responsive Design**: Optimized layouts for all screen sizes
- **Touch Interactions**: Smooth touch gestures and animations

### Progressive Web App
- **Installable**: Can be installed as a native app on mobile devices
- **Offline Support**: Basic offline functionality with service worker
- **App-like Experience**: Native app feel with proper theming and navigation

### Theme System
- **Light Mode**: Clean, bright interface for daytime use
- **Dark Mode**: Eye-friendly dark interface for low-light conditions
- **System Mode**: Automatically follows device preference
- **Persistent**: Theme choice persists across sessions

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

### Booking Endpoints

- `GET /api/bookings/` - List user bookings
- `GET /api/admin/bookings/` - List all bookings (admin only)
- `POST /api/bookings/` - Create new booking
- `GET /api/bookings/{id}/` - Get booking details
- `PATCH /api/bookings/{id}/` - Update booking status
- `DELETE /api/bookings/{id}/` - Cancel booking

### Query Parameters

**Restaurant Listing**:
- `cuisine_type` - Filter by cuisine (supports 14 types including 'khmer' and 'fine_dining')
- `price_range` - Filter by price range (1-4)
- `rating__gte` - Filter by minimum rating
- `is_featured` - Filter featured restaurants
- `is_active` - Filter active restaurants
- `search` - Search restaurants by name, cuisine, or location
- `ordering` - Sort results (rating, -rating, created_at, -created_at)

**Search Functionality**:
- URL parameter support: `/search?q=restaurant_name&location=city`
- Real-time filtering and navigation from search bar

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

### Development Notes

### Recent Updates (Latest)

**🔍 Enhanced Search & Navigation System**:
- Implemented comprehensive search functionality with navigation from search bar to dedicated search page
- Added URL parameter-based search for bookmarkable results
- Real-time search with automatic query parameter detection
- Search across restaurant names, locations, and cuisine types

**🍽️ Extended Cuisine Categories**:
- Added Khmer cuisine type to support Cambodian restaurants
- Added Fine Dining category for upscale restaurant experiences
- Updated all frontend components to support 14 total cuisine categories
- Created database migration for new cuisine types

**📸 Google Images Integration**:
- Configured Next.js Image optimization for external domains
- Added support for Google Images (lh3.googleusercontent.com) in remote patterns
- Enhanced image loading performance with optimized configurations

**📊 Comprehensive Booking Management**:
- Enhanced admin dashboard with complete booking oversight
- Added booking status management (pending, confirmed, completed, cancelled)
- Implemented detailed booking analytics with customer information
- Real-time booking status updates with proper API integration

**⚡ Performance & System Improvements**:
- Fixed Django backend dependency issues with proper virtual environment setup
- Enhanced database migrations for new features
- Improved error handling and user feedback throughout the application

**� Hydration & Performance Fixes**:
- Replaced all Lucide React icons with inline SVGs to eliminate hydration errors
- Added client-side mounting checks to prevent SSR/client mismatches
- Implemented comprehensive theme system with proper hydration handling

**📱 Mobile-First Optimization**:
- Added mobile bottom navigation with accessibility features
- Implemented responsive design patterns throughout
- Enhanced PWA configuration with proper manifest and service worker

**🎨 UI/UX Improvements**:
- Added dark/light/system theme support with persistent preferences
- Created settings page for user customization
- Enhanced search functionality with real-time filtering
- Added skeleton loaders and proper loading states

**🚀 New Features**:
- AI-powered restaurant recommendations
- Advanced search and filtering capabilities
- Mobile-optimized booking management
- Progressive Web App installation support

### Database Models

**User Model**:
- Extended Django User with profile fields
- Includes phone, date of birth, profile picture
- Account lockout for security

**Restaurant Model**:
- Comprehensive restaurant information
- Cuisine types (14 categories including Khmer and Fine Dining)
- Pricing, capacity, operating hours
- Ratings, featured status, image support
- External image URL support including Google Images

### Security Features

- Token-based authentication
- CORS protection
- SQL injection protection (Django ORM)
- XSS protection (React)
- Password validation and hashing
- Account lockout after failed attempts

### Performance Considerations

- Database query optimization with proper indexing
- Image optimization with Next.js Image component and remote pattern support
- Lazy loading for restaurant listings and images
- Efficient filtering and pagination with advanced search capabilities
- Client-side caching with React state management
- Hydration-safe rendering to prevent layout shifts
- Service worker caching for offline functionality
- Optimized bundle size with tree shaking
- Inline SVGs for better performance and fewer requests
- URL parameter-based navigation for better user experience and SEO

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS settings include frontend URL
2. **Authentication Issues**: Check token storage and API headers  
3. **Database Errors**: Verify database connection and migrations
4. **Build Errors**: Check TypeScript types and dependency versions
5. **Hydration Errors**: Ensure client/server rendering consistency (now fixed)
6. **Theme Issues**: Check theme initialization script loading
7. **Mobile Navigation**: Verify bottom navigation visibility on mobile devices
8. **PWA Installation**: Check manifest.json and service worker registration

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
- Community contributors for SVG icons and design inspiration

## 📞 Support

For support, create an issue in the repository or contact the development team.

---

**Built with ❤️ for the modern web - Mobile-first, PWA-ready, and performance-optimized**
