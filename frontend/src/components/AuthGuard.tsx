'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const authToken = getAuthToken();

  // List of public paths that don't require authentication
  const publicPaths = ['/', '/auth/login', '/auth/register', '/terms', '/privacy']; // Add other public paths as needed

  useEffect(() => {
    if (!authToken && !publicPaths.includes(pathname)) {
      router.push('/auth/login');
    }
  }, [authToken, pathname, router, publicPaths]);

  // Render children only if authenticated or on a public path
  if (authToken || publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // Optionally, render a loading spinner or null while redirecting
  return null;
}