'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface User {
  first_name?: string;
  [key: string]: any;
}

interface HomeContentProps {
  isLoggedIn: boolean;
  user: User | null;
}

// Component that handles both logged-in and logged-out states
export default function HomeContent({ isLoggedIn, user }: HomeContentProps) {
  if (isLoggedIn) {
    return (
      <div className="relative z-10 p-4">
        <h1 className="font-headline text-5xl font-bold tracking-tight text-white md:text-7xl">
          Welcome back, {user?.first_name || 'User'}!
        </h1>
        <p className="mt-4 text-xl text-white/90 md:text-2xl">
          Discover amazing dining experiences
        </p>
        <Button asChild size="lg" className="mt-8 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-lg">
          <Link href="/restaurants">Browse Restaurants</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative z-10 p-4">
      <h1 className="font-headline text-5xl font-bold tracking-tight text-white md:text-7xl">
        Book top restaurants
      </h1>
      <p className="mt-4 text-xl text-white/90 md:text-2xl">
        with up to 50% off
      </p>
      <div className="mt-8 space-x-4">
        <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-lg">
          <Link href="/auth/register">Get Started</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="bg-silver-100/20 border-silver-300/50 text-white hover:bg-silver-100/30 backdrop-blur-sm">
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
