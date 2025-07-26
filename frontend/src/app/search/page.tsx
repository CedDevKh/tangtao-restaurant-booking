'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';


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
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

// Inline SVG icons to prevent hydration errors
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
  </svg>
);

export default function SearchPage() {
  const [restaurants, setRestaurants] = useState<BackendRestaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<BackendRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${API_URL}/api/restaurants/?is_active=true&ordering=-rating,-created_at`);
        if (response.ok) {
          const data = await response.json();
          const restaurantData = data.results || data;
          setRestaurants(restaurantData);
          setFilteredRestaurants(restaurantData);
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    } else {
      setFilteredRestaurants(restaurants);
    }
  }, [searchQuery, restaurants]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-4 py-4 shadow-sm">
          <div className="relative mb-4">
            <div className="h-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="bg-white rounded-lg p-0 animate-pulse">
                <div className="flex">
                  <div className="w-24 h-24 bg-gray-200 rounded-l-lg"></div>
                  <div className="flex-1 p-3">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search restaurants, cuisines, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 border-0 rounded-full"
            autoFocus
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <FilterIcon className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              Sort by
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            {filteredRestaurants.length} results
          </p>
        </div>
      </div>

      {/* Search Results */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-24 h-24 bg-gray-200 rounded-l-lg"></div>
                    <div className="flex-1 p-3">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <img
                          src={restaurant.image_url || '/restaurant-interior.jpg'}
                          alt={restaurant.name}
                          className="w-full h-full object-cover rounded-l-lg"
                        />
                        {restaurant.rating && restaurant.rating > 4.0 && (
                          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs">
                            HOT
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex-1 p-3">
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                          {restaurant.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">
                          {restaurant.cuisine_type}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <StarIcon className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                              <span>{restaurant.rating || '4.5'}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPinIcon className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-20">{restaurant.address}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            <span>25-35 min</span>
                          </div>
                        </div>

                        {restaurant.rating && restaurant.rating > 4.0 && (
                          <div className="mt-2">
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Up to 30% OFF
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No restaurants found' : 'Start searching'}
            </h3>
            <p className="text-gray-600">
              {searchQuery 
                ? `Try searching for different keywords or check your spelling.`
                : 'Search for restaurants, cuisines, or locations to get started.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
