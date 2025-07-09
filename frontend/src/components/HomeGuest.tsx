import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomeGuest() {
  return (
    <>
      <section className="relative flex h-[60vh] items-center justify-center text-center">
        <div className="relative z-10 p-4">
          <h1 className="font-headline text-5xl font-bold tracking-tight text-primary md:text-7xl">
            Book top restaurants
          </h1>
          <p className="mt-4 text-xl text-foreground/80 md:text-2xl">
            with up to 50% off
          </p>
          <div className="mt-8 space-x-4">
            <Button asChild size="lg">
              <Link href="/auth/register">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Join thousands of food lovers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Create your free account to unlock exclusive deals, save your favorite restaurants, and make reservations with ease.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">Quick Reservations</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Book your table in seconds with our streamlined reservation system.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">Exclusive Deals</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Access member-only discounts and special offers at top restaurants.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">Save Favorites</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Build your personal list of favorite restaurants and get personalized recommendations.
                </p>
              </div>
            </div>
            <div className="mt-12">
              <Button asChild size="lg">
                <Link href="/auth/register">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
