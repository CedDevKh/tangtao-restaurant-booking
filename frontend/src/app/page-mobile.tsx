'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, MapPin, Clock, Search, ChevronDown } from 'lucide-react';
import { getRestaurants } from '@/lib/api';
import { Restaurant } from '@/lib/types';

const cuisineTypes = [
  { name: 'Buffet', emoji: '🍽️', image: '/cuisine/buffet.jpg' },
  { name: 'Italian', emoji: '🍝', image: '/cuisine/italian.jpg' },
  { name: 'Japanese', emoji: '🍣', image: '/cuisine/japanese.jpg' },
  { name: 'Thai', emoji: '🌶️', image: '/cuisine/thai.jpg' },
  { name: 'Chinese', emoji: '🥟', image: '/cuisine/chinese.jpg' },
  { name: 'Indian', emoji: '🍛', image: '/cuisine/indian.jpg' },
  { name: 'Korean', emoji: '🥘', image: '/cuisine/korean.jpg' },
  { name: 'International', emoji: '🌍', image: '/cuisine/international.jpg' },
];

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Bangkok');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await getRestaurants();
        setRestaurants(data.slice(0, 6)); // Show first 6 restaurants
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white px-4 py-3 shadow-sm sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-gray-900">{selectedLocation}</h1>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
          <Search className="h-5 w-5 text-gray-500" />
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search restaurants, cuisines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 border-0 rounded-full"
          />
        </div>
      </div>

      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden sm:block bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Discover Amazing Restaurants
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Book top restaurants with up to 50% off
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              <Link href="/restaurants">Browse Restaurants</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/auth/register">Book a Table</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Promotion Banner */}
      <div className="mx-4 my-4 sm:container sm:mx-auto sm:my-8">
        <Card className="bg-gradient-to-r from-green-400 to-blue-500 text-white overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Badge className="bg-red-500 text-white mb-2">
                  up to 50%
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">WoW Wednesday</h2>
                <p className="text-sm sm:text-base opacity-90">Book with code [WOWWED] and get 100฿ Off, On Wednesday Only!</p>
                <p className="text-xs sm:text-sm mt-1 opacity-75">ดื่มด่ำจอง 11.00 - 14.00 น. เท่านั้น!</p>
              </div>
              <div className="text-4xl sm:text-6xl">🍽️</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cuisine Categories */}
      <div className="px-4 mb-6 sm:container sm:mx-auto">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {cuisineTypes.map((cuisine) => (
            <Link 
              key={cuisine.name}
              href={`/restaurants?cuisine=${encodeURIComponent(cuisine.name)}`}
              className="group"
            >
              <div className="bg-white rounded-lg p-3 shadow-sm group-hover:shadow-md transition-all">
                <div className="text-2xl text-center mb-1">{cuisine.emoji}</div>
                <p className="text-xs font-medium text-gray-700 text-center">{cuisine.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Reserve Now Section */}
      <div className="px-4 mb-6 sm:container sm:mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Reserve Now</h2>
          <Link href="/restaurants" className="text-blue-600 text-sm font-medium">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:space-y-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:space-y-0">
            {restaurants.map((restaurant) => (
              <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={restaurant.image || 'https://placehold.co/600x300/f3f4f6/9ca3af?text=Restaurant'}
                        alt={restaurant.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex space-x-2">
                        {restaurant.rating && restaurant.rating > 4.0 && (
                          <Badge className="bg-pink-500 text-white">Hot</Badge>
                        )}
                        <Badge className="bg-orange-500 text-white">New</Badge>
                      </div>
                      
                      {/* Favorite Button */}
                      <button className="absolute top-3 right-3 bg-white/80 rounded-full p-2 hover:bg-white transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      
                      {/* Discount Badge */}
                      {restaurant.rating && restaurant.rating > 4.0 && (
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-red-500 text-white font-bold">
                            Up to 30% OFF
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine_type}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span>{restaurant.rating || '4.5'}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{restaurant.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>25-35 min</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="px-4 pb-6 sm:container sm:mx-auto sm:text-center">
        <Button asChild className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-full">
          <Link href="/restaurants">
            Explore All Restaurants
          </Link>
        </Button>
      </div>
    </div>
  );
}
