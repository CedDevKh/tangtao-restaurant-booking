'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    // Temporarily disable service worker registration for debugging
    console.log('Service Worker registration temporarily disabled');
    /*
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
    */
  }, []);

  return null;
}
