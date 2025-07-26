

import Image from 'next/image';
import { notFound } from 'next/navigation';

// Client wrapper for BookingForm
// BookingForm must be rendered in a client component, so we use a wrapper
function BookingFormClientWrapper({ restaurantId }: { restaurantId: number }) {
  'use client';
  const BookingForm = require('@/components/BookingForm').default;
  return <BookingForm restaurantId={restaurantId} />;
}

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

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

async function getRestaurant(id: string): Promise<Restaurant | null> {
  try {
    const res = await fetch(`${API_URL}/api/restaurants/${id}/`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


export default async function RestaurantDetailPage({ params }: PageProps) {
  const { id } = await params;
  const restaurant = await getRestaurant(id);
  if (!restaurant) return notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          {restaurant.image_url && (
            <Image
              src={restaurant.image_url}
              alt={restaurant.name}
              width={400}
              height={300}
              className="rounded-lg object-cover w-full h-auto"
              priority
            />
          )}
        </div>
        <div className="md:w-2/3 space-y-4">
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-muted-foreground">{restaurant.address}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><b>Cuisine:</b> {restaurant.cuisine_type}</span>
            <span><b>Price:</b> {'$'.repeat(restaurant.price_range)}</span>
            <span><b>Capacity:</b> {restaurant.capacity}</span>
            <span><b>Rating:</b> {restaurant.rating}/5</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><b>Phone:</b> {restaurant.phone_number}</span>
            <span><b>Email:</b> {restaurant.email}</span>
            {restaurant.website && (
              <span><b>Website:</b> <a href={restaurant.website} className="underline text-blue-400" target="_blank" rel="noopener noreferrer">{restaurant.website}</a></span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><b>Open:</b> {restaurant.opening_time} - {restaurant.closing_time}</span>
            <span><b>Status:</b> {restaurant.is_active ? 'Active' : 'Inactive'}</span>
            {restaurant.is_featured && <span className="bg-yellow-200 text-yellow-800 px-2 rounded">Featured</span>}
          </div>
          <p className="mt-4">{restaurant.description}</p>
          <BookingFormClientWrapper restaurantId={restaurant.id} />
        </div>
      </div>
    </div>
  );
}
