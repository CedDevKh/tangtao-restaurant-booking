'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SearchBar from '@/components/search-bar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Star, MapPin, Clock, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

const cuisines = ['italian', 'japanese', 'french', 'mexican', 'indian', 'chinese', 'american', 'thai'];
const ratings = [4.5, 4.0, 3.5, 0];
const priceRanges = [1, 2, 3, 4];

function Filters({ 
  selectedCuisines, 
  setSelectedCuisines, 
  selectedRating, 
  setSelectedRating, 
  selectedPriceRange, 
  setSelectedPriceRange 
}: {
  selectedCuisines: string[];
  setSelectedCuisines: (cuisines: string[]) => void;
  selectedRating: number;
  setSelectedRating: (rating: number) => void;
  selectedPriceRange: number;
  setSelectedPriceRange: (priceRange: number) => void;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="mb-4 text-lg font-semibold">Cuisine</h3>
                    <div className="space-y-2">
                        {cuisines.map(cuisine => (
                            <div key={cuisine} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`cuisine-${cuisine}`} 
                                  checked={selectedCuisines.includes(cuisine)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedCuisines([...selectedCuisines, cuisine]);
                                    } else {
                                      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
                                    }
                                  }}
                                />
                                <Label htmlFor={`cuisine-${cuisine}`} className="capitalize">
                                  {cuisine.replace('_', ' ')}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
                <Separator />
                <div>
                    <h3 className="mb-4 text-lg font-semibold">Rating</h3>
                     <RadioGroup value={selectedRating.toString()} onValueChange={(value) => setSelectedRating(Number(value))}>
                        {ratings.map(rating => (
                            <div key={rating} className="flex items-center space-x-2">
                                <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                                <Label htmlFor={`rating-${rating}`}>
                                  {rating === 0 ? 'Any' : `${rating}+ stars`}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                 <Separator />
                <div>
                    <h3 className="mb-4 text-lg font-semibold">Price Range</h3>
                     <RadioGroup value={selectedPriceRange.toString()} onValueChange={(value) => setSelectedPriceRange(Number(value))}>
                        {priceRanges.map(priceRange => (
                            <div key={priceRange} className="flex items-center space-x-2">
                                <RadioGroupItem value={priceRange.toString()} id={`price-${priceRange}`} />
                                <Label htmlFor={`price-${priceRange}`}>
                                  {'$'.repeat(priceRange)}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            </CardContent>
        </Card>
    )
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<BackendRestaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<BackendRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('best-match');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${API_URL}/api/restaurants/?is_active=true`);
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

  useEffect(() => {
    let filtered = restaurants.filter(restaurant => {
      // Filter by cuisine
      const cuisineMatch = selectedCuisines.length === 0 || 
        selectedCuisines.includes(restaurant.cuisine_type.toLowerCase());
      
      // Filter by rating
      const ratingMatch = selectedRating === 0 || restaurant.rating >= selectedRating;
      
      // Filter by price range
      const priceMatch = selectedPriceRange === 0 || restaurant.price_range === selectedPriceRange;
      
      return cuisineMatch && ratingMatch && priceMatch;
    });

    // Sort restaurants
    switch (sortBy) {
      case 'highest-rated':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low-high':
        filtered.sort((a, b) => a.price_range - b.price_range);
        break;
      case 'price-high-low':
        filtered.sort((a, b) => b.price_range - a.price_range);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default: // best-match
        filtered.sort((a, b) => {
          // Sort by featured first, then rating
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return b.rating - a.rating;
        });
    }

    setFilteredRestaurants(filtered);
  }, [restaurants, selectedCuisines, selectedRating, selectedPriceRange, sortBy]);

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

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
            <h1 className="mb-4 text-center font-headline text-5xl font-bold">Find Your Next Meal</h1>
            <SearchBar />
        </div>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <aside className="hidden lg:block">
                <Filters 
                  selectedCuisines={selectedCuisines}
                  setSelectedCuisines={setSelectedCuisines}
                  selectedRating={selectedRating}
                  setSelectedRating={setSelectedRating}
                  selectedPriceRange={selectedPriceRange}
                  setSelectedPriceRange={setSelectedPriceRange}
                />
            </aside>

            <main className="lg:col-span-3">
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-lg">
                      Showing <span className="font-bold">{loading ? '...' : filteredRestaurants.length}</span> restaurants
                    </p>
                    <div>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="best-match">Best Match</SelectItem>
                                <SelectItem value="highest-rated">Highest Rated</SelectItem>
                                <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                                <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                                <SelectItem value="newest">Newest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                        <CardHeader>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : filteredRestaurants.length > 0 ? (
                  <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredRestaurants.map((restaurant) => (
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
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <Badge className="absolute top-2 right-2 bg-background/80 text-foreground">
                            {getPriceRangeDisplay(restaurant.price_range)}
                          </Badge>
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
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{restaurant.rating}/5</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{restaurant.address}</span>
                            </div>
                            {restaurant.opening_time && restaurant.closing_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
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
                  <div className="text-center py-12">
                    <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No restaurants found</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Try adjusting your filters to see more results.
                    </p>
                  </div>
                )}
            </main>
        </div>
    </div>
  );
}
