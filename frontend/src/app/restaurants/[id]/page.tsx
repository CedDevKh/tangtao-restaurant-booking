
'use client';

import Image from 'next/image';
import { notFound, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import BookingForm from '@/components/BookingForm';

// Client wrapper for BookingForm is no longer needed since this is now a client component

interface Restaurant {
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
  owner_username: string;
  owner_email: string;
  total_offers: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

interface PageProps {
  params: { id: string };
}

const API_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000'));

async function getRestaurant(id: string): Promise<Restaurant | null> {
  try {
    const res = await fetch(`${API_URL}/api/restaurants/${id}/`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default function RestaurantDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    }>
      <RestaurantContent params={params} />
    </Suspense>
  );
}

function RestaurantContent({ params }: PageProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const offerId = searchParams.get('offer');

  useEffect(() => {
    async function loadRestaurant() {
      const resolvedParams = await params;
      const restaurantData = await getRestaurant(resolvedParams.id);
      setRestaurant(restaurantData);
      setLoading(false);
    }
    loadRestaurant();
  }, [params]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!restaurant) return notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2">
          {restaurant.image_url && (
            <Image
              src={restaurant.image_url}
              alt={restaurant.name}
              width={600}
              height={400}
              className="rounded-lg object-cover w-full h-auto shadow-lg"
              priority
            />
          )}
        </div>
        <div className="lg:w-1/2 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">{restaurant.name}</h1>
            <p className="text-muted-foreground text-lg">{restaurant.address}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div><span className="font-semibold">Cuisine:</span> <span className="capitalize">{restaurant.cuisine_type.replace('_', ' ')}</span></div>
                <div><span className="font-semibold">Price Range:</span> <span>{'$'.repeat(restaurant.price_range)}</span></div>
                <div><span className="font-semibold">Capacity:</span> <span>{restaurant.capacity} guests</span></div>
                <div><span className="font-semibold">Rating:</span> <span>{restaurant.rating}/5 ⭐</span></div>
              </div>
              <div className="space-y-2">
                <div><span className="font-semibold">Phone:</span> <span>{restaurant.phone_number}</span></div>
                <div><span className="font-semibold">Email:</span> <span>{restaurant.email}</span></div>
                <div><span className="font-semibold">Hours:</span> <span>{restaurant.opening_time} - {restaurant.closing_time}</span></div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    restaurant.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {restaurant.is_active ? 'Open' : 'Closed'}
                  </span>
                  {restaurant.is_featured && (
                    <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 text-xs rounded-full">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>

            {restaurant.website && (
              <div>
                <span className="font-semibold">Website:</span>{' '}
                <a 
                  href={restaurant.website} 
                  className="text-primary hover:underline" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {restaurant.website}
                </a>
              </div>
            )}

            {restaurant.description && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">About This Restaurant</h3>
                <p className="text-muted-foreground leading-relaxed">{restaurant.description}</p>
              </div>
            )}
          </div>

          <BookingForm 
            restaurantId={restaurant.id} 
            offerId={offerId ? parseInt(offerId) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
