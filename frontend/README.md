# TangTao - Restaurant Booking App Frontend

This is the Next.js frontend for the TangTao restaurant booking application.

## Features

- 🍽️ Browse and search restaurants
- 📅 Make restaurant reservations
- 👤 User authentication (login/register)
- 📱 Progressive Web App (PWA) - installable on mobile
- 🔐 Admin dashboard for restaurant management
- 🎨 Modern, responsive UI with Tailwind CSS
- 📲 Offline functionality with service worker

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:9003](http://localhost:9003) in your browser.

## PWA Installation

This app can be installed as a Progressive Web App:
- Look for the install prompt in your browser
- On mobile, use "Add to Home Screen" option
- Works offline with cached content

## Project Structure

- `src/app/` - Next.js app router pages
- `src/components/` - Reusable React components
- `src/lib/` - Utilities and API functions
- `src/contexts/` - React context providers
- `public/` - Static assets and PWA files

## Backend

This frontend connects to a Django REST API backend. Make sure the backend is running on the configured API URL.
