'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TimeslotChips from '@/components/TimeslotChips';
import SearchBar from '@/components/search-bar';
import { useAuth } from '@/contexts/AuthContext';
import HomeContent from '@/components/HomeContent';

interface BackendRestaurant {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  email: string;
  website: string;
  description: string;
  cuisine_type: string;
  price_range: number;
  capacity: number;
  rating: number;
  image_url: string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  active_offers?: Offer[];
  featured_offer?: Offer;
}

interface Offer {
  id: number;
  title: string;
  description: string;
  offer_type: 'percentage' | 'amount' | 'special';
  discount_percentage?: number;
  discount_amount?: number;
  original_price?: number;
  discounted_price?: number;
  savings_amount?: number;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_featured: boolean;
  is_available_today: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

export default function Home() {
  const { isLoggedIn, user } = useAuth();
  const [restaurants, setRestaurants] = useState<BackendRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${API_URL}/api/restaurants/?is_active=true&ordering=-rating,-created_at`);
        if (response.ok) {
          const data = await response.json();
          setRestaurants(data.results || data);
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const featuredRestaurants = restaurants.filter(r => r.is_featured).slice(0, 4);
  const restaurantsWithOffers = restaurants.filter(r => r.featured_offer).slice(0, 4);
  const displayRestaurants = featuredRestaurants.length > 0 ? featuredRestaurants : restaurants.slice(0, 4);

  const getPriceRangeDisplay = (priceRange: number) => {
    switch (priceRange) {
      case 1: return '$';
      case 2: return '$$';
      case 3: return '$$$';
      case 4: return '$$$$';
      default: return '$$';
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // We're already using hasMounted above, no need for another mounted state

  return (
    <div className="flex flex-col">
      {/* Eatigo-style search bar at very top */}
      <section className="sticky top-0 z-20 bg-background pt-2 pb-2">
        <div className="container mx-auto px-2">
          <SearchBar />
        </div>
      </section>

      {/* Hero section with image background - this works on server and client */}
      <section className="relative flex h-[60vh] items-center justify-center text-center">
        <Image 
          src="/restaurant-interior.jpg" 
          alt="Modern restaurant interior with warm lighting and elegant design" 
          fill
          priority
          className="absolute z-0 object-cover" 
        />
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 z-[1] bg-black/40"></div>
        
        {/* Conditionally render content only on client-side to avoid hydration mismatch */}
        {hasMounted ? (
          <HomeContent isLoggedIn={isLoggedIn} user={user} />
        ) : (
          <div className="relative z-10 p-4">
            <h1 className="font-headline text-5xl font-bold tracking-tight text-white md:text-7xl">
              Book top restaurants
            </h1>
            <p className="mt-4 text-xl text-white/90 md:text-2xl">
              with up to 50% off
            </p>
          </div>
        )}
      </section>

      {/* Benefits section for non-logged-in users */}
      {hasMounted && !isLoggedIn && (
        <section className="bg-secondary/50 py-16">
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
      )}

      {/* Special Offers Section */}
      {restaurantsWithOffers.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 text-white rounded-full mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h2 className="font-headline text-4xl font-bold text-red-700 dark:text-red-300">
              🔥 Special Offers Available Now!
            </h2>
            <p className="mt-4 text-lg text-red-600 dark:text-red-400">
              Don't miss these limited-time deals at our partner restaurants
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {restaurantsWithOffers.map((restaurant) => (
              <Card key={restaurant.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-red-200 dark:border-red-800 bg-white dark:bg-gray-900">
                <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-200">
                  {restaurant.image_url ? (
                    <Image
                      src={restaurant.image_url}
                      alt={restaurant.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  {restaurant.is_featured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">
                      Featured
                    </Badge>
                  )}
                  <Badge className="absolute top-2 right-2 bg-background/80 text-foreground">
                    {getPriceRangeDisplay(restaurant.price_range)}
                  </Badge>
                  {restaurant.featured_offer && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <Badge className="w-full justify-center bg-red-500 text-white font-bold text-sm py-2 animate-pulse">
                        {restaurant.featured_offer.offer_type === 'percentage' && restaurant.featured_offer.discount_percentage
                          ? `🎉 ${restaurant.featured_offer.discount_percentage}% OFF 🎉`
                          : restaurant.featured_offer.offer_type === 'amount' && restaurant.featured_offer.discount_amount
                          ? `🎉 $${restaurant.featured_offer.discount_amount} OFF 🎉`
                          : '🎉 SPECIAL OFFER 🎉'
                        }
                      </Badge>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="truncate">{restaurant.name}</CardTitle>
                  <CardDescription className="capitalize text-sm">
                    {restaurant.cuisine_type.replace('_', ' ')} Cuisine
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>{restaurant.rating}/5</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                    {restaurant.opening_time && restaurant.closing_time && (
                      <div className="flex items-center gap-1">
                        <span>{formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span>Up to {restaurant.capacity} guests</span>
                    </div>
                  </div>
                  {restaurant.featured_offer && (
                    <div className="mt-3 p-3 bg-red-100 dark:bg-red-950/50 rounded-lg border-2 border-red-300 dark:border-red-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-red-800 dark:text-red-200 text-sm">
                            {restaurant.featured_offer.title}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-300 mt-1 font-medium">
                            🕒 {restaurant.featured_offer.start_time} - {restaurant.featured_offer.end_time}
                          </p>
                        </div>
                        <div className="text-right">
                          {restaurant.featured_offer.offer_type === 'percentage' && restaurant.featured_offer.discount_percentage && (
                            <div className="font-black text-red-800 dark:text-red-200 text-lg">
                              {restaurant.featured_offer.discount_percentage}% OFF
                            </div>
                          )}
                          {restaurant.featured_offer.offer_type === 'amount' && restaurant.featured_offer.discount_amount && (
                            <div className="font-black text-red-800 dark:text-red-200 text-lg">
                              ${restaurant.featured_offer.discount_amount} OFF
                            </div>
                          )}
                          {restaurant.featured_offer.original_price && restaurant.featured_offer.discounted_price && (
                            <div className="text-xs text-red-600 dark:text-red-300 mt-1">
                              <span className="line-through">${restaurant.featured_offer.original_price}</span>
                              {' → '}
                              <span className="font-bold text-green-600">${restaurant.featured_offer.discounted_price}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <Button asChild className="w-full bg-red-500 hover:bg-red-600 text-white font-bold">
                      <Link href={`/restaurants/${restaurant.id}${restaurant.featured_offer ? `?offer=${restaurant.featured_offer.id}` : ''}`}>
                        🎯 Claim This Offer!
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-3">
                    <TimeslotChips restaurantId={restaurant.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-red-500 hover:bg-red-600 text-white font-bold">
              <Link href="/restaurants">
                View All Restaurants with Offers 🔥
              </Link>
            </Button>
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center font-headline text-4xl font-bold">
          {featuredRestaurants.length > 0 ? 'Featured Restaurants' : 'Our Restaurants'}
        </h2>
        
        {loading ? (
          <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : displayRestaurants.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {displayRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="group cursor-pointer hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-200">
                  {restaurant.image_url ? (
                    <Image
                      src={restaurant.image_url}
                      alt={restaurant.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  {restaurant.is_featured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">
                      Featured
                    </Badge>
                  )}
                  <Badge className="absolute top-2 right-2 bg-background/80 text-foreground">
                    {getPriceRangeDisplay(restaurant.price_range)}
                  </Badge>
                  {restaurant.featured_offer && (
                    <Badge className="absolute bottom-2 left-2 bg-red-500 text-white font-bold">
                      {restaurant.featured_offer.offer_type === 'percentage' && restaurant.featured_offer.discount_percentage
                        ? `${restaurant.featured_offer.discount_percentage}% OFF`
                        : restaurant.featured_offer.offer_type === 'amount' && restaurant.featured_offer.discount_amount
                        ? `$${restaurant.featured_offer.discount_amount} OFF`
                        : 'SPECIAL OFFER'
                      }
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="truncate">{restaurant.name}</CardTitle>
                  <CardDescription className="capitalize text-sm">
                    {restaurant.cuisine_type.replace('_', ' ')} Cuisine
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>{restaurant.rating}/5</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                    {restaurant.opening_time && restaurant.closing_time && (
                      <div className="flex items-center gap-1">
                        <span>{formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span>Up to {restaurant.capacity} guests</span>
                    </div>
                  </div>
                  {restaurant.description && (
                    <p className="mt-3 text-sm text-muted-foreground overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {restaurant.description}
                    </p>
                  )}
                  {restaurant.featured_offer && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
                            {restaurant.featured_offer.title}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                            {restaurant.featured_offer.start_time} - {restaurant.featured_offer.end_time}
                          </p>
                        </div>
                        <div className="text-right">
                          {restaurant.featured_offer.offer_type === 'percentage' && restaurant.featured_offer.discount_percentage && (
                            <div className="font-bold text-red-800 dark:text-red-200">
                              {restaurant.featured_offer.discount_percentage}% OFF
                            </div>
                          )}
                          {restaurant.featured_offer.offer_type === 'amount' && restaurant.featured_offer.discount_amount && (
                            <div className="font-bold text-red-800 dark:text-red-200">
                              ${restaurant.featured_offer.discount_amount} OFF
                            </div>
                          )}
                          {restaurant.featured_offer.original_price && restaurant.featured_offer.discounted_price && (
                            <div className="text-xs text-red-600 dark:text-red-300">
                              <span className="line-through">${restaurant.featured_offer.original_price}</span>
                              {' → '}
                              <span className="font-semibold">${restaurant.featured_offer.discounted_price}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <Button asChild className="w-full">
                      <Link href={`/restaurants/${restaurant.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No restaurants available</h3>
            <p className="mt-2 text-sm text-gray-600">
              There are currently no restaurants to display. Check back later!
            </p>
          </div>
        )}
        
        {displayRestaurants.length > 0 && (
          <div className="mt-12 text-center">
            <Button asChild variant="outline">
              <Link href="/restaurants">View All Restaurants</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
