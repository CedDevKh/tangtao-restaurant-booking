import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";
import PWARegistration from "@/components/PWARegistration";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { cn } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "TangTao - Restaurant Booking",
  description: "Book top restaurants with up to 50% off",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TangTao",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const getTheme = () => {
                    if (typeof window === 'undefined') return 'system';
                    
                    try {
                      const stored = localStorage.getItem('theme');
                      if (stored && ['light', 'dark', 'system'].includes(stored)) {
                        return stored;
                      }
                    } catch (e) {
                      // localStorage might not be available
                    }
                    return 'system';
                  };

                  const applyTheme = () => {
                    if (typeof window === 'undefined' || !document.documentElement) return;
                    
                    const theme = getTheme();
                    const root = document.documentElement;
                    
                    // Remove existing theme classes
                    root.classList.remove('light', 'dark');
                    
                    if (theme === 'system') {
                      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                      if (isDark) {
                        root.classList.add('dark');
                      } else {
                        root.classList.add('light');
                      }
                    } else {
                      root.classList.add(theme);
                    }
                  };

                  // Apply theme immediately
                  applyTheme();
                } catch (error) {
                  // Fallback to light theme if anything goes wrong
                  if (typeof document !== 'undefined' && document.documentElement) {
                    document.documentElement.classList.add('light');
                  }
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="TangTao" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TangTao" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/icon-192x192.png" color="#3b82f6" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased"
        )}
      >
        <ThemeProvider>
          <AuthProvider>
            <OfflineIndicator />
            <div className="relative flex min-h-dvh flex-col">
              <Navbar className="hidden sm:flex" />
              <main className="flex-1 pb-16 sm:pb-0">
                <AuthGuard>{children}</AuthGuard>
              </main>
              <Footer className="hidden sm:block" />
              <MobileBottomNav />
            </div>
            <Toaster />
            <PWAInstallPrompt />
            <PWARegistration />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
