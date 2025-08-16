'use client';
import { getAllBookings, BookingResponse } from '@/lib/booking-api';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Star, Eye, EyeOff, Search, Filter, X } from 'lucide-react';

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

interface DashboardStats {
  total_restaurants: number;
  active_restaurants: number;
  featured_restaurants: number;
  total_offers: number;
  total_bookings: number;
  cuisine_stats: Array<{ cuisine_type: string; count: number }>;
}

interface RestaurantFormData {
  name: string;
  address: string;
  phone_number: string;
  email: string;
  website: string;
  description: string;
  cuisine_type: string;
  price_range: number;
  capacity: number;
  image_url: string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
  is_featured: boolean;
}

interface Offer {
  id: number;
  restaurant: number;
  restaurant_name: string;
  restaurant_cuisine: string;
  restaurant_location: string;
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
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  days_of_week?: string;
  available_quantity: number;
  max_people_per_booking: number;
  min_advance_booking: number;
  is_active: boolean;
  is_featured: boolean;
  is_available_today: boolean;
  created_at: string;
  updated_at: string;
}

interface OfferFormData {
  restaurant: number;
  title: string;
  description: string;
  offer_type: 'percentage' | 'amount' | 'special';
  discount_percentage?: number;
  discount_amount?: number;
  original_price?: number;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  days_of_week?: string;
  available_quantity: number;
  max_people_per_booking: number;
  min_advance_booking: number;
  is_active: boolean;
  is_featured: boolean;
}

interface OwnerCandidate { id: number; username: string; email: string }

const API_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, '0');
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour}:${min}`;
});

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurants, setSelectedRestaurants] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCuisine, setFilterCuisine] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    address: '',
    phone_number: '',
    email: '',
    website: '',
    description: '',
    cuisine_type: 'other',
    price_range: 2,
    capacity: 50,
    image_url: '',
    opening_time: '',
    closing_time: '',
    is_active: true,
    is_featured: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Offers state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<number[]>([]);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  // Schedule generator (Eatigo style) state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<any | null>(null);
  const [scheduleErrors, setScheduleErrors] = useState<string | null>(null);
  interface ScheduleForm {
    restaurant: number; // single restaurant (ignored if selectedRestaurants not empty)
    selectedRestaurants: number[]; // multi-target batch
    offer_type: 'percentage' | 'amount';
    title_template: string;
    description: string;
    start_date: string;
    end_date: string;
    days_of_week: string | undefined; // csv of 0-6
    hours: number[]; // integers 0-23
    base_pattern: Array<{ minute: 0 | 30; discount_percentage?: number; discount_amount?: number }>;
    hour_overrides: Record<string, Array<{ minute: 0 | 30; discount_percentage?: number; discount_amount?: number }>>; // hour string => pattern
    original_price?: number;
    replace: boolean;
  }
  const todayISO = new Date().toISOString().split('T')[0];
  const in7 = (() => { const d = new Date(); d.setDate(d.getDate()+7); return d.toISOString().split('T')[0]; })();
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    restaurant: 0,
    selectedRestaurants: [],
    offer_type: 'percentage',
    title_template: 'Deal {hour}:00',
    description: 'Auto generated schedule',
    start_date: todayISO,
    end_date: in7,
    days_of_week: undefined,
    hours: [11,12,13,18,19,20],
    base_pattern: [
      { minute: 0, discount_percentage: 50 },
      { minute: 30, discount_percentage: 40 }
    ],
    hour_overrides: {},
    original_price: undefined,
    replace: true,
  });
  const [offerSearchTerm, setOfferSearchTerm] = useState('');
  const [filterOfferType, setFilterOfferType] = useState('');
  const [filterOfferActive, setFilterOfferActive] = useState('');
  const [offerFormData, setOfferFormData] = useState<OfferFormData>(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      restaurant: 0,
      title: '',
      description: '',
      offer_type: 'percentage',
      discount_percentage: 20,
      original_price: 0,
      start_date: tomorrow.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
      start_time: '18:00',
      end_time: '21:00',
      recurring: 'none',
      available_quantity: 10,
      max_people_per_booking: 6,
      min_advance_booking: 1,
      is_active: true,
      is_featured: false,
    };
  });
  const [offerFormErrors, setOfferFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const [ownerCandidates, setOwnerCandidates] = useState<OwnerCandidate[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferRestaurant, setTransferRestaurant] = useState<Restaurant | null>(null);
  const [selectedNewOwner, setSelectedNewOwner] = useState<number | null>(null);

  const cuisineTypes = [
    { value: 'italian', label: 'Italian' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'indian', label: 'Indian' },
    { value: 'french', label: 'French' },
    { value: 'american', label: 'American' },
    { value: 'thai', label: 'Thai' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'korean', label: 'Korean' },
    { value: 'vietnamese', label: 'Vietnamese' },
    { value: 'khmer', label: 'Khmer' },
    { value: 'fine_dining', label: 'Fine Dining' },
    { value: 'other', label: 'Other' },
  ];

  // Admin Bookings Tab
  const renderBookingsTab = () => {
    const getStatusBadgeVariant = (status: string) => {
      switch (status) {
        case 'confirmed': return 'default';
        case 'pending': return 'secondary';
        case 'cancelled': return 'destructive';
        case 'completed': return 'outline';
        default: return 'default';
      }
    };

    const formatBookingTime = (dateString: string) => {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      };
    };

    // Calculate booking statistics
    const bookingStats = {
      total: Array.isArray(bookings) ? bookings.length : 0,
      pending: Array.isArray(bookings) ? bookings.filter(b => b.status === 'pending').length : 0,
      confirmed: Array.isArray(bookings) ? bookings.filter(b => b.status === 'confirmed').length : 0,
      completed: Array.isArray(bookings) ? bookings.filter(b => b.status === 'completed').length : 0,
      cancelled: Array.isArray(bookings) ? bookings.filter(b => b.status === 'cancelled').length : 0,
    };

    return (
      <div className="space-y-6 mt-6">
        {/* Booking Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{bookingStats.total}</div>
              <div className="text-xs text-muted-foreground">Total Bookings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{bookingStats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{bookingStats.confirmed}</div>
              <div className="text-xs text-muted-foreground">Confirmed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{bookingStats.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{bookingStats.cancelled}</div>
              <div className="text-xs text-muted-foreground">Cancelled</div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">All Bookings ({Array.isArray(bookings) ? bookings.length : 0})</h3>
            <p className="text-sm text-muted-foreground">
              Manage and view all customer bookings across the platform
            </p>
          </div>
        </div>

        {/* Bookings List */}
        {Array.isArray(bookings) && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map(booking => {
              const { date, time } = formatBookingTime(booking.booking_time);
              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Booking Info */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {booking.restaurant_name || 'Unknown Restaurant'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {booking.offer_title || 'Direct Booking'}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize">
                            {booking.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Booking ID:</span>
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              #{booking.id}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Party Size:</span>
                            <span>{booking.number_of_people} {booking.number_of_people === 1 ? 'guest' : 'guests'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Date & Time Info */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          Reservation Details
                        </h5>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Date:</span>
                            <span>{date}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Time:</span>
                            <span>{time}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Created:</span>
                            <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          Customer Information
                        </h5>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Name:</span>
                            <span>
                              {booking.diner?.first_name && booking.diner?.last_name 
                                ? `${booking.diner.first_name} ${booking.diner.last_name}`
                                : booking.diner?.username || 'N/A'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Username:</span>
                            <span>{booking.diner?.username || 'N/A'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Email:</span>
                            <span>{booking.diner?.email || 'N/A'}</span>
                          </div>
                          
                          {booking.diner?.phone_number && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Phone:</span>
                              <span>{booking.diner.phone_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">No bookings found</h3>
                <p className="text-muted-foreground">
                  When customers make reservations, they will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  useEffect(() => {
    console.log('Admin Dashboard: useEffect triggered');
    console.log('Admin Dashboard: user object:', user);
    console.log('Admin Dashboard: user.is_staff:', user?.is_staff);
    
    // Check if user is admin
    if (!user || !user.is_staff) {
      console.log('Admin Dashboard: User is not admin, redirecting...');
      router.push('/');
      return;
    }
    
    // Fetch all bookings for admin
    console.log('Admin Dashboard: Fetching bookings for admin...');
    getAllBookings()
      .then((bookingsData) => {
        console.log('Admin Dashboard: Bookings fetched successfully:', bookingsData);
        // Ensure bookingsData is always an array
        if (Array.isArray(bookingsData)) {
          setBookings(bookingsData);
        } else if (bookingsData && Array.isArray((bookingsData as any).results)) {
          setBookings((bookingsData as any).results);
        } else {
          console.warn('Bookings data is not in expected format:', bookingsData);
          setBookings([]);
        }
      })
      .catch((error) => {
        console.error('Admin Dashboard: Error fetching bookings:', error);
        setBookings([]); // Set empty array on error
      });
      
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      const token = getAuthToken();
      console.log('Auth token:', token ? `${token.substring(0, 10)}...` : 'No token');
      console.log('Current user:', user);
      console.log('User is staff:', user?.is_staff);
      
      if (!token) {
        console.error('No auth token available');
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        });
        router.push('/auth/login');
        return;
      }

      const headers = {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('Making requests with headers:', headers);

      // Fetch restaurants and stats
      const [restaurantsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/restaurants/`, { headers }),
        fetch(`${API_URL}/api/admin/restaurants/stats/`, { headers })
      ]);

      console.log('Restaurants response status:', restaurantsRes.status);
      console.log('Stats response status:', statsRes.status);

      if (restaurantsRes.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this resource. Please ensure you're logged in as an admin.",
          variant: "destructive",
        });
        router.push('/');
        return;
      }

      if (restaurantsRes.ok) {
        const restaurantsData = await restaurantsRes.json();
        setRestaurants(restaurantsData.results || restaurantsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch offers
      await fetchOffers();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRestaurantStatus = async (restaurantId: number, action: 'active' | 'featured') => {
    try {
      const token = getAuthToken();
      const endpoint = action === 'active' ? 'toggle_active' : 'toggle_featured';
      
      const response = await fetch(`${API_URL}/api/admin/restaurants/${restaurantId}/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchData(); // Refresh data
        toast({
          title: "Success",
          description: `Restaurant ${action} status updated successfully.`,
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to update restaurant ${action} status.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error toggling ${action}:`, error);
      toast({
        title: "Error",
        description: `An error occurred while updating the restaurant.`,
        variant: "destructive",
      });
    }
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const token = getAuthToken();
      const url = `${API_URL}/api/bookings/${bookingId}/`;
      console.log('updateBookingStatus: Making request to:', url);
      
      // Find the booking to get its data
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        console.error('Booking not found:', bookingId);
        toast({
          title: "Error",
          description: "Booking not found.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('updateBookingStatus: Found booking:', booking);
      console.log('updateBookingStatus: Booking offer field:', booking.offer);
      console.log('updateBookingStatus: Booking restaurant field:', booking.restaurant);
      
      const updatePayload: any = {
        status: newStatus,
        booking_time: booking.booking_time,
        number_of_people: booking.number_of_people,
      };
      
      // Include offer if it exists and is not null
      if (booking.offer !== null && booking.offer !== undefined) {
        updatePayload.offer = booking.offer;
        console.log('updateBookingStatus: Including offer field:', booking.offer);
      }
      // Include restaurant if it exists and is not null (fallback)
      else if (booking.restaurant !== null && booking.restaurant !== undefined) {
        updatePayload.restaurant = booking.restaurant;
        console.log('updateBookingStatus: Including restaurant field:', booking.restaurant);
      }
      // If neither offer nor restaurant exists, we need to identify the restaurant from restaurant_name
      else if (booking.restaurant_name) {
        console.log('updateBookingStatus: No offer/restaurant ID found, trying to find restaurant by name:', booking.restaurant_name);
        // Try to find restaurant ID from the restaurants list
        const restaurant = restaurants.find(r => r.name === booking.restaurant_name);
        if (restaurant) {
          updatePayload.restaurant = restaurant.id;
          console.log('updateBookingStatus: Found restaurant ID by name:', restaurant.id);
        } else {
          console.error('updateBookingStatus: Could not find restaurant for booking');
          toast({
            title: "Error",
            description: "Could not identify restaurant for this booking.",
            variant: "destructive",
          });
          return;
        }
      } else {
        console.error('updateBookingStatus: Booking has no offer, restaurant, or restaurant_name');
        toast({
          title: "Error",
          description: "Booking is missing required restaurant/offer information.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('updateBookingStatus: Final update payload:', updatePayload);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      console.log('updateBookingStatus: Response status:', response.status);

      if (response.ok) {
        // Refresh bookings data
        getAllBookings()
          .then((bookingsData) => {
            console.log('Admin Dashboard: Bookings refreshed after status update:', bookingsData);
            // Ensure bookingsData is always an array
            if (Array.isArray(bookingsData)) {
              setBookings(bookingsData);
            } else if (bookingsData && Array.isArray((bookingsData as any).results)) {
              setBookings((bookingsData as any).results);
            } else {
              console.warn('Bookings data is not in expected format:', bookingsData);
              setBookings([]);
            }
          })
          .catch((error) => {
            console.error('Admin Dashboard: Error refreshing bookings:', error);
            setBookings([]);
          });
        
        toast({
          title: "Success",
          description: `Booking status updated to ${newStatus}.`,
        });
      } else {
        const errorData = await response.text();
        console.error('updateBookingStatus: Error response:', errorData);
        toast({
          title: "Error",
          description: "Failed to update booking status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating the booking.",
        variant: "destructive",
      });
    }
  };

  const deleteRestaurant = async (restaurantId: number) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/admin/restaurants/${restaurantId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        fetchData(); // Refresh data
        toast({
          title: "Success",
          description: "Restaurant deleted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete restaurant.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the restaurant.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone_number: '',
      email: '',
      website: '',
      description: '',
      cuisine_type: 'other',
      price_range: 2,
      capacity: 50,
      image_url: '',
      opening_time: '',
      closing_time: '',
      is_active: true,
      is_featured: false,
    });
    setFormErrors({});
  };

  const handleCreateClick = () => {
    resetForm();
    setEditingRestaurant(null);
    setShowCreateModal(true);
  };

  const handleEditClick = (restaurant: Restaurant) => {
    setFormData({
      name: restaurant.name,
      address: restaurant.address,
      phone_number: restaurant.phone_number || '',
      email: restaurant.email || '',
      website: restaurant.website || '',
      description: restaurant.description || '',
      cuisine_type: restaurant.cuisine_type,
      price_range: restaurant.price_range,
      capacity: restaurant.capacity,
      image_url: restaurant.image_url || '',
      opening_time: restaurant.opening_time || '',
      closing_time: restaurant.closing_time || '',
      is_active: restaurant.is_active,
      is_featured: restaurant.is_featured,
    });
    setFormErrors({});
    setEditingRestaurant(restaurant);
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const token = getAuthToken();
      console.log('Form submission - Auth token:', token ? `${token.substring(0, 10)}...` : 'No token');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        });
        router.push('/auth/login');
        return;
      }

      const url = editingRestaurant 
        ? `${API_URL}/api/admin/restaurants/${editingRestaurant.id}/`
        : `${API_URL}/api/admin/restaurants/`;
      
      const method = editingRestaurant ? 'PUT' : 'POST';

      console.log('Making request to:', url);
      console.log('Method:', method);
      console.log('Form data:', formData);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Don't send owner field - let backend handle it
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to perform this action. Please ensure you're logged in as an admin.",
          variant: "destructive",
        });
        return;
      }

      if (response.ok) {
        setShowCreateModal(false);
        setEditingRestaurant(null);
        resetForm();
        fetchData(); // Refresh data
        toast({
          title: "Success",
          description: `Restaurant ${editingRestaurant ? 'updated' : 'created'} successfully.`,
        });
      } else {
        const errorData = await response.json();
        console.error('Validation errors:', errorData);
        setFormErrors(errorData);
        
        // Show specific error messages
        const errorMessages = [];
        if (typeof errorData === 'object') {
          for (const [field, messages] of Object.entries(errorData)) {
            if (field === 'non_field_errors') {
              if (Array.isArray(messages)) {
                errorMessages.push(...messages);
              } else if (typeof messages === 'string') {
                errorMessages.push(messages);
              }
            } else {
              const fieldLabel = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              if (Array.isArray(messages)) {
                errorMessages.push(`${fieldLabel}: ${messages.join(', ')}`);
              } else if (typeof messages === 'string') {
                errorMessages.push(`${fieldLabel}: ${messages}`);
              }
            }
          }
        }
        
        toast({
          title: "Validation Error",
          description: errorMessages.length > 0 
            ? errorMessages.slice(0, 3).join('\n') + (errorMessages.length > 3 ? '\n...' : '')
            : "Please check the form for errors and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
      setFormErrors({ general: 'An error occurred while saving the restaurant' });
      toast({
        title: "Error",
        description: "An error occurred while saving the restaurant.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof RestaurantFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Offer management functions
  const fetchOffers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/offers/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOffers(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch offers. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteOffer = async (offerId: number) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/offers/${offerId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchOffers();
      toast({
        title: "Success",
        description: "Offer deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: "Error",
        description: "Failed to delete offer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleOfferActive = async (offerId: number) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/offers/${offerId}/toggle_active/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchOffers();
      toast({
        title: "Success",
        description: "Offer status updated successfully!",
      });
    } catch (error) {
      console.error('Error toggling offer status:', error);
      toast({
        title: "Error",
        description: "Failed to update offer status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleOfferFeatured = async (offerId: number) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/offers/${offerId}/toggle_featured/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchOffers();
      toast({
        title: "Success",
        description: "Offer featured status updated successfully!",
      });
    } catch (error) {
      console.error('Error toggling offer featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update offer featured status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetOfferForm = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    setOfferFormData({
      restaurant: 0,
      title: '',
      description: '',
      offer_type: 'percentage',
      discount_percentage: 20,
      original_price: 0,
      start_date: tomorrow.toISOString().split('T')[0], // Tomorrow as default start
      end_date: nextWeek.toISOString().split('T')[0], // Next week as default end
      start_time: '18:00', // 6 PM
      end_time: '21:00', // 9 PM
      recurring: 'none',
      available_quantity: 10,
      max_people_per_booking: 6,
      min_advance_booking: 1,
      is_active: true,
      is_featured: false,
    });
    setOfferFormErrors({});
  };

  const handleCreateOfferClick = () => {
    resetOfferForm();
    setEditingOffer(null);
    setShowCreateOfferModal(true);
  };

  const handleEditOfferClick = (offer: Offer) => {
    setOfferFormData({
      restaurant: offer.restaurant,
      title: offer.title,
      description: offer.description,
      offer_type: offer.offer_type,
      discount_percentage: offer.discount_percentage || 0,
      discount_amount: offer.discount_amount || 0,
      original_price: offer.original_price || 0,
      start_date: offer.start_date,
      end_date: offer.end_date,
      start_time: offer.start_time,
      end_time: offer.end_time,
      recurring: offer.recurring,
      days_of_week: offer.days_of_week,
      available_quantity: offer.available_quantity,
      max_people_per_booking: offer.max_people_per_booking,
      min_advance_booking: offer.min_advance_booking,
      is_active: offer.is_active,
      is_featured: offer.is_featured,
    });
    setOfferFormErrors({});
    setEditingOffer(offer);
    setShowCreateOfferModal(true);
  };

  const handleOfferFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOffer(true);
    setOfferFormErrors({});

    try {
      const token = getAuthToken();
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const url = editingOffer 
        ? `${API_URL}/api/offers/${editingOffer.id}/`
        : `${API_URL}/api/offers/`;
      
      const method = editingOffer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerFormData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 400 && responseData) {
          setOfferFormErrors(responseData);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchOffers();
      setShowCreateOfferModal(false);
      resetOfferForm();
      toast({
        title: "Success",
        description: `Offer ${editingOffer ? 'updated' : 'created'} successfully!`,
      });
    } catch (error) {
      console.error('Error submitting offer form:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingOffer ? 'update' : 'create'} offer. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const clearOfferFormError = (field: string) => {
    if (offerFormErrors[field]) {
      setOfferFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(offerSearchTerm.toLowerCase()) ||
                         offer.description.toLowerCase().includes(offerSearchTerm.toLowerCase()) ||
                         offer.restaurant_name.toLowerCase().includes(offerSearchTerm.toLowerCase());
    const matchesType = !filterOfferType || filterOfferType === 'all' || offer.offer_type === filterOfferType;
    const matchesActive = !filterOfferActive || filterOfferActive === 'all' || 
                         (filterOfferActive === 'active' && offer.is_active) ||
                         (filterOfferActive === 'inactive' && !offer.is_active);
    
    return matchesSearch && matchesType && matchesActive;
  });

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = !filterCuisine || filterCuisine === 'all' || restaurant.cuisine_type === filterCuisine;
    const matchesActive = !filterActive || filterActive === 'all' || 
                         (filterActive === 'active' && restaurant.is_active) ||
                         (filterActive === 'inactive' && !restaurant.is_active);
    
    return matchesSearch && matchesCuisine && matchesActive;
  });

  const fetchOwnerCandidates = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/admin/restaurants/owner_candidates/`, { headers: { 'Authorization': `Token ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setOwnerCandidates(data);
      }
    } catch (e) { console.error('Error fetching owner candidates', e); }
  };

  const openTransferModal = (restaurant: Restaurant) => {
    setTransferRestaurant(restaurant);
    setSelectedNewOwner(null);
    setShowTransferModal(true);
    fetchOwnerCandidates();
  };

  const submitOwnershipTransfer = async () => {
    if (!transferRestaurant || !selectedNewOwner) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/admin/restaurants/${transferRestaurant.id}/transfer_owner/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_owner_id: selectedNewOwner })
      });
      if (res.ok) {
        toast({ title: 'Ownership Transferred', description: `Restaurant now owned by selected user.` });
        setShowTransferModal(false);
        setTransferRestaurant(null);
        fetchData();
      } else {
        const err = await res.json().catch(()=>({error:'Unknown error'}));
        toast({ title: 'Transfer Failed', description: err.error || 'Could not transfer ownership.', variant: 'destructive' });
      }
    } catch (e) {
      console.error('Transfer error', e);
      toast({ title: 'Error', description: 'Unexpected error transferring ownership.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

        <TabsContent value="bookings">
          {renderBookingsTab()}
        </TabsContent>
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage restaurants and platform settings</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Restaurant
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_restaurants}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_restaurants} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.featured_restaurants}</div>
              <p className="text-xs text-muted-foreground">restaurants featured</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_offers}</div>
              <p className="text-xs text-muted-foreground">across all restaurants</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_bookings}</div>
              <p className="text-xs text-muted-foreground">lifetime bookings</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="restaurants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search restaurants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cuisine Type</Label>
                  <Select value={filterCuisine || undefined} onValueChange={(value) => setFilterCuisine(value === 'all' ? '' : value || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="All cuisines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All cuisines</SelectItem>
                      {cuisineTypes.map(cuisine => (
                        <SelectItem key={cuisine.value} value={cuisine.value}>
                          {cuisine.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterActive || undefined} onValueChange={(value) => setFilterActive(value === 'all' ? '' : value || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restaurants Table */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurants ({filteredRestaurants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{restaurant.name}</h3>
                          {restaurant.is_featured && (
                            <Badge variant="secondary">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <Badge variant={restaurant.is_active ? "default" : "destructive"}>
                            {restaurant.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Cuisine: {restaurant.cuisine_type}</span>
                          <span>Rating: {restaurant.rating}/5</span>
                          <span>Offers: {restaurant.total_offers}</span>
                          <span>Bookings: {restaurant.total_bookings}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRestaurantStatus(restaurant.id, 'featured')}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRestaurantStatus(restaurant.id, 'active')}
                        >
                          {restaurant.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(restaurant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTransferModal(restaurant)}
                        >
                          Transfer Owner
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{restaurant.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteRestaurant(restaurant.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search offers, descriptions, restaurants..."
                      value={offerSearchTerm}
                      onChange={(e) => setOfferSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Offer Type</Label>
                  <Select value={filterOfferType} onValueChange={setFilterOfferType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="percentage">Percentage Discount</SelectItem>
                      <SelectItem value="amount">Fixed Amount</SelectItem>
                      <SelectItem value="special">Special Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterOfferActive} onValueChange={setFilterOfferActive}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setOfferSearchTerm('');
                    setFilterOfferType('');
                    setFilterOfferActive('');
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <Button onClick={handleCreateOfferClick}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offer
                </Button>
                <Button variant="secondary" onClick={() => { setScheduleResult(null); setScheduleErrors(null); setShowScheduleModal(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Offers List */}
          <Card>
            <CardHeader>
              <CardTitle>Offers ({filteredOffers.length})</CardTitle>
              <CardDescription>
                Manage discount offers for restaurants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredOffers.map((offer) => (
                  <div key={offer.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{offer.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {offer.restaurant_name} • {offer.restaurant_cuisine}
                        </p>
                        <p className="text-sm">{offer.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={offer.is_active ? "default" : "secondary"}>
                          {offer.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {offer.is_featured && (
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        )}
                        {offer.is_available_today && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Available Today
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span>{' '}
                        {offer.offer_type === 'percentage' ? 'Percentage' : 
                         offer.offer_type === 'amount' ? 'Fixed Amount' : 'Special'}
                      </div>
                      <div>
                        <span className="font-medium">Discount:</span>{' '}
                        {offer.offer_type === 'percentage' && offer.discount_percentage ? `${offer.discount_percentage}%` :
                         offer.offer_type === 'amount' && offer.discount_amount ? `$${offer.discount_amount}` :
                         'Custom'}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>{' '}
                        {offer.start_date} to {offer.end_date}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span>{' '}
                        {offer.start_time} - {offer.end_time}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Available:</span>{' '}
                        {offer.available_quantity} bookings
                      </div>
                      <div>
                        <span className="font-medium">Max People:</span>{' '}
                        {offer.max_people_per_booking}
                      </div>
                      <div>
                        <span className="font-medium">Advance:</span>{' '}
                        {offer.min_advance_booking}h minimum
                      </div>
                      <div>
                        <span className="font-medium">Recurring:</span>{' '}
                        {offer.recurring === 'none' ? 'One-time' : offer.recurring}
                      </div>
                    </div>

                    {offer.original_price && (
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <span className="font-medium">Original Price:</span> ${offer.original_price}
                        </div>
                        {offer.discounted_price && (
                          <div>
                            <span className="font-medium">Discounted Price:</span> ${offer.discounted_price}
                          </div>
                        )}
                        {offer.savings_amount && (
                          <div className="text-green-600">
                            <span className="font-medium">You Save:</span> ${offer.savings_amount}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(offer.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOfferActive(offer.id)}
                        >
                          {offer.is_active ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOfferFeatured(offer.id)}
                        >
                          <Star 
                            className={`h-4 w-4 mr-1 ${offer.is_featured ? 'fill-current' : ''}`} 
                          />
                          {offer.is_featured ? 'Unfeature' : 'Feature'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOfferClick(offer)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Offer</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{offer.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteOffer(offer.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredOffers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {offers.length === 0 ? 'No offers found. Create your first offer!' : 'No offers match your filters.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          {renderBookingsTab()}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Restaurants by Cuisine Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {stats.cuisine_stats.map((stat) => (
                      <Card key={stat.cuisine_type}>
                        <CardContent className="p-4">
                          <div className="text-lg font-bold">{stat.count}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {stat.cuisine_type}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Restaurant Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
            </DialogTitle>
            <DialogDescription>
              {editingRestaurant 
                ? 'Update the restaurant information below.' 
                : 'Fill in the details to add a new restaurant to the platform.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formErrors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {formErrors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter restaurant name"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine_type">Cuisine Type</Label>
                <Select value={formData.cuisine_type} onValueChange={(value) => handleInputChange('cuisine_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map(cuisine => (
                      <SelectItem key={cuisine.value} value={cuisine.value}>
                        {cuisine.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.cuisine_type && (
                  <p className="text-sm text-red-500">{formErrors.cuisine_type}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full address"
                  className={formErrors.address ? 'border-red-500' : ''}
                />
                {formErrors.address && (
                  <p className="text-sm text-red-500">{formErrors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="Enter phone number"
                  className={formErrors.phone_number ? 'border-red-500' : ''}
                />
                {formErrors.phone_number && (
                  <p className="text-sm text-red-500">{formErrors.phone_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className={formErrors.website ? 'border-red-500' : ''}
                />
                {formErrors.website && (
                  <p className="text-sm text-red-500">{formErrors.website}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={formErrors.image_url ? 'border-red-500' : ''}
                />
                {formErrors.image_url && (
                  <p className="text-sm text-red-500">{formErrors.image_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_range">Price Range</Label>
                <Select value={formData.price_range.toString()} onValueChange={(value) => handleInputChange('price_range', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">$ - Budget</SelectItem>
                    <SelectItem value="2">$$ - Moderate</SelectItem>
                    <SelectItem value="3">$$$ - Expensive</SelectItem>
                    <SelectItem value="4">$$$$ - Very Expensive</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.price_range && (
                  <p className="text-sm text-red-500">{formErrors.price_range}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                  placeholder="Maximum guests"
                  className={formErrors.capacity ? 'border-red-500' : ''}
                />
                {formErrors.capacity && (
                  <p className="text-sm text-red-500">{formErrors.capacity}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening_time">Opening Time</Label>
                <Select
                  value={formData.opening_time}
                  onValueChange={(value) => handleInputChange('opening_time', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select opening time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.opening_time && (
                  <p className="text-sm text-red-500">{formErrors.opening_time}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing_time">Closing Time</Label>
                <Select
                  value={formData.closing_time}
                  onValueChange={(value) => handleInputChange('closing_time', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select closing time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.closing_time && (
                  <p className="text-sm text-red-500">{formErrors.closing_time}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter restaurant description"
                  rows={3}
                  className={formErrors.description ? 'border-red-500' : ''}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                  />
                  <Label htmlFor="is_featured">Featured</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  editingRestaurant ? 'Updating...' : 'Creating...'
                ) : (
                  editingRestaurant ? 'Update Restaurant' : 'Create Restaurant'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Offer Modal */}
      <Dialog open={showCreateOfferModal} onOpenChange={setShowCreateOfferModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleOfferFormSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </DialogTitle>
              <DialogDescription>
                {editingOffer ? 'Update the offer details below.' : 'Fill in the details to create a new discount offer.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Restaurant Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant">Restaurant *</Label>
                  <Select 
                    value={offerFormData.restaurant.toString()} 
                    onValueChange={(value) => {
                      setOfferFormData(prev => ({ ...prev, restaurant: parseInt(value) }));
                      clearOfferFormError('restaurant');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {offerFormErrors.restaurant && (
                    <p className="text-sm text-red-500">{offerFormErrors.restaurant}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offer_type">Offer Type *</Label>
                  <Select 
                    value={offerFormData.offer_type} 
                    onValueChange={(value: 'percentage' | 'amount' | 'special') => {
                      setOfferFormData(prev => ({ ...prev, offer_type: value }));
                      clearOfferFormError('offer_type');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Discount</SelectItem>
                      <SelectItem value="amount">Fixed Amount Discount</SelectItem>
                      <SelectItem value="special">Special Offer</SelectItem>
                    </SelectContent>
                  </Select>
                  {offerFormErrors.offer_type && (
                    <p className="text-sm text-red-500">{offerFormErrors.offer_type}</p>
                  )}
                </div>
                           </div>

              {/* Title and Description */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Happy Hour Special"
                  value={offerFormData.title}
                  onChange={(e) => {
                    setOfferFormData(prev => ({ ...prev, title: e.target.value }));
                    clearOfferFormError('title');
                  }}
                />
                {offerFormErrors.title && (
                  <p className="text-sm text-red-500">{offerFormErrors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enjoy 20% off your meal during happy hour..."
                  value={offerFormData.description}
                  onChange={(e) => {
                    setOfferFormData(prev => ({ ...prev, description: e.target.value }));
                    clearOfferFormError('description');
                  }}
                />
                {offerFormErrors.description && (
                  <p className="text-sm text-red-500">{offerFormErrors.description}</p>
                )}
              </div>

              {/* Discount Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price ($)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    value={offerFormData.original_price || ''}
                    onChange={(e) => {
                      setOfferFormData(prev => ({ ...prev, original_price: parseFloat(e.target.value) || undefined }));
                      clearOfferFormError('original_price');
                    }}
                  />
                  {offerFormErrors.original_price && (
                    <p className="text-sm text-red-500">{offerFormErrors.original_price}</p>
                  )}
                </div>

                {offerFormData.offer_type === 'percentage' && (
                  <div className="space-y-2">
                    <Label htmlFor="discount_percentage">Discount Percentage (%) *</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="20"
                      value={offerFormData.discount_percentage || ''}
                      onChange={(e) => {
                        setOfferFormData(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || undefined }));
                        clearOfferFormError('discount_percentage');
                      }}
                    />
                    {offerFormErrors.discount_percentage && (
                      <p className="text-sm text-red-500">{offerFormErrors.discount_percentage}</p>
                    )}
                  </div>
                )}

                {offerFormData.offer_type === 'amount' && (
                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">Discount Amount ($) *</Label>
                    <Input
                      id="discount_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10.00"
                      value={offerFormData.discount_amount || ''}
                      onChange={(e) => {
                        setOfferFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || undefined }));
                        clearOfferFormError('discount_amount');
                      }}
                    />
                    {offerFormErrors.discount_amount && (
                      <p className="text-sm text-red-500">{offerFormErrors.discount_amount}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Date and Time */}
              <div className="space-y-4">
                {/* Quick Date Presets */}
                <div className="space-y-2">
                  <Label>Quick Date Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const dayAfter = new Date(tomorrow);
                        dayAfter.setDate(dayAfter.getDate() + 1);
                        
                        setOfferFormData(prev => ({
                          ...prev,
                          start_date: tomorrow.toISOString().split('T')[0],
                          end_date: dayAfter.toISOString().split('T')[0]
                        }));
                      }}
                    >
                      Tomorrow Only
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const nextWeek = new Date(today);
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        
                        setOfferFormData(prev => ({
                          ...prev,
                          start_date: today.toISOString().split('T')[0],
                          end_date: nextWeek.toISOString().split('T')[0]
                        }));
                      }}
                    >
                      Next 7 Days
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const nextMonth = new Date(today);
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        
                        setOfferFormData(prev => ({
                          ...prev,
                          start_date: today.toISOString().split('T')[0],
                          end_date: nextMonth.toISOString().split('T')[0]
                        }));
                      }}
                    >
                      Next Month
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        // Next Friday
                        const nextFriday = new Date(today);
                        const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
                        nextFriday.setDate(today.getDate() + daysUntilFriday);
                        // Next Sunday
                        const nextSunday = new Date(nextFriday);
                        nextSunday.setDate(nextFriday.getDate() + 2);
                        
                        setOfferFormData(prev => ({
                          ...prev,
                          start_date: nextFriday.toISOString().split('T')[0],
                          end_date: nextSunday.toISOString().split('T')[0],
                          days_of_week: '4,5,6' // Friday, Saturday, Sunday
                        }));
                      }}
                    >
                      Weekend Special
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={offerFormData.start_date}
                      min={new Date().toISOString().split('T')[0]} // Today's date as minimum
                      onChange={(e) => {
                        setOfferFormData(prev => ({ ...prev, start_date: e.target.value }));
                        clearOfferFormError('start_date');
                      }}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Select the start date for this offer
                    </p>
                    {offerFormErrors.start_date && (
                      <p className="text-sm text-red-500">{offerFormErrors.start_date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={offerFormData.end_date}
                      min={offerFormData.start_date || new Date().toISOString().split('T')[0]} // Start date as minimum
                      onChange={(e) => {
                        setOfferFormData(prev => ({ ...prev, end_date: e.target.value }));
                        clearOfferFormError('end_date');
                      }}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Select the end date for this offer
                    </p>
                    {offerFormErrors.end_date && (
                      <p className="text-sm text-red-500">{offerFormErrors.end_date}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Select 
                    value={offerFormData.start_time} 
                    onValueChange={(value) => {
                      setOfferFormData(prev => ({ ...prev, start_time: value }));
                      clearOfferFormError('start_time');
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(time => {
                        const [hour, minute] = time.split(':');
                        const hour24 = parseInt(hour);
                        const period = hour24 >= 12 ? 'PM' : 'AM';
                        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                        const displayTime = `${hour12}:${minute} ${period} (${time})`;
                        
                        return (
                          <SelectItem key={time} value={time}>
                            {displayTime}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Daily start time for the offer (e.g., 6:00 PM for dinner)
                  </p>
                  {offerFormErrors.start_time && (
                    <p className="text-sm text-red-500">{offerFormErrors.start_time}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Select 
                    value={offerFormData.end_time} 
                    onValueChange={(value) => {
                      setOfferFormData(prev => ({ ...prev, end_time: value }));
                      clearOfferFormError('end_time');
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(time => {
                        const [hour, minute] = time.split(':');
                        const hour24 = parseInt(hour);
                        const period = hour24 >= 12 ? 'PM' : 'AM';
                        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                        const displayTime = `${hour12}:${minute} ${period} (${time})`;
                        
                        return (
                          <SelectItem key={time} value={time}>
                            {displayTime}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Daily end time for the offer (e.g., 9:00 PM)
                  </p>
                  {offerFormErrors.end_time && (
                    <p className="text-sm text-red-500">{offerFormErrors.end_time}</p>
                  )}
                </div>
              </div>

              {/* Recurring and Days */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurring">Recurring</Label>
                  <Select 
                    value={offerFormData.recurring} 
                    onValueChange={(value: 'none' | 'daily' | 'weekly' | 'monthly') => {
                      setOfferFormData(prev => ({ ...prev, recurring: value }));
                      clearOfferFormError('recurring');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">One-time offer</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Days of Week (optional)</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { value: '0', label: 'Mon' },
                      { value: '1', label: 'Tue' },
                      { value: '2', label: 'Wed' },
                      { value: '3', label: 'Thu' },
                      { value: '4', label: 'Fri' },
                      { value: '5', label: 'Sat' },
                      { value: '6', label: 'Sun' },
                    ].map(day => {
                      const isSelected = offerFormData.days_of_week?.split(',').includes(day.value) || false;
                      
                      return (
                        <Button
                          key={day.value}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="h-10"
                          onClick={() => {
                            const currentDays = offerFormData.days_of_week ? offerFormData.days_of_week.split(',') : [];
                            let newDays;
                            
                            if (isSelected) {
                              newDays = currentDays.filter(d => d !== day.value);
                            } else {
                              newDays = [...currentDays, day.value].sort();
                            }
                            
                            setOfferFormData(prev => ({ 
                              ...prev, 
                              days_of_week: newDays.length > 0 ? newDays.join(',') : undefined 
                            }));
                            clearOfferFormError('days_of_week');
                          }}
                        >
                          {day.label}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select which days of the week this offer is available. Leave empty for all days.
                  </p>
                  {offerFormErrors.days_of_week && (
                    <p className="text-sm text-red-500">{offerFormErrors.days_of_week}</p>
                  )}
                </div>
              </div>

              {/* Booking Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="available_quantity">Available Quantity *</Label>
                  <Input
                    id="available_quantity"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={offerFormData.available_quantity}
                    onChange={(e) => {
                      setOfferFormData(prev => ({ ...prev, available_quantity: parseInt(e.target.value) || 1 }));
                      clearOfferFormError('available_quantity');
                    }}
                  />
                  {offerFormErrors.available_quantity && (
                    <p className="text-sm text-red-500">{offerFormErrors.available_quantity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_people_per_booking">Max People *</Label>
                  <Input
                    id="max_people_per_booking"
                    type="number"
                    min="1"
                    placeholder="6"
                    value={offerFormData.max_people_per_booking}
                    onChange={(e) => {
                      setOfferFormData(prev => ({ ...prev, max_people_per_booking: parseInt(e.target.value) || 1 }));
                      clearOfferFormError('max_people_per_booking');
                    }}
                  />
                  {offerFormErrors.max_people_per_booking && (
                    <p className="text-sm text-red-500">{offerFormErrors.max_people_per_booking}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_advance_booking">Min Advance (hours) *</Label>
                  <Input
                    id="min_advance_booking"
                    type="number"
                    min="0"
                    placeholder="1"
                    value={offerFormData.min_advance_booking}
                    onChange={(e) => {
                      setOfferFormData(prev => ({ ...prev, min_advance_booking: parseInt(e.target.value) || 0 }));
                      clearOfferFormError('min_advance_booking');
                    }}
                  />
                  {offerFormErrors.min_advance_booking && (
                    <p className="text-sm text-red-500">{offerFormErrors.min_advance_booking}</p>
                  )}
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={offerFormData.is_active}
                    onCheckedChange={(checked) => setOfferFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={offerFormData.is_featured}
                    onCheckedChange={(checked) => setOfferFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                  <Label htmlFor="is_featured">Featured</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateOfferModal(false)}
                disabled={isSubmittingOffer}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingOffer}>
                {isSubmittingOffer ? (
                  editingOffer ? 'Updating...' : 'Creating...'
                ) : (
                  editingOffer ? 'Update Offer' : 'Create Offer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Schedule (Eatigo style) Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Offer Schedule</DialogTitle>
            <DialogDescription>Create multiple hourly offers each with two 30-min discounts.</DialogDescription>
          </DialogHeader>
          {/* Basic form */}
          {scheduleErrors && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-2 rounded mb-2">{scheduleErrors}</div>
          )}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Restaurant *</Label>
                <Select value={scheduleForm.restaurant ? String(scheduleForm.restaurant) : ''} onValueChange={(v)=> setScheduleForm(f=>({...f, restaurant: parseInt(v)}))}>
                  <SelectTrigger><SelectValue placeholder="Select restaurant" /></SelectTrigger>
                  <SelectContent>
                    {restaurants.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="pt-2 space-y-1">
                  <Label className="text-xs">Or select multiple:</Label>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 grid grid-cols-2 gap-2 text-xs">
                    {restaurants.map(r => {
                      const checked = scheduleForm.selectedRestaurants.includes(r.id);
                      return (
                        <button key={r.id} type="button" onClick={()=> setScheduleForm(f=> ({...f, selectedRestaurants: checked? f.selectedRestaurants.filter(id=> id!==r.id): [...f.selectedRestaurants, r.id]}))} className={`border rounded px-2 py-1 text-left ${checked? 'bg-primary text-primary-foreground':'bg-muted/40'}`}>{r.name}</button>
                      );
                    })}
                  </div>
                  {scheduleForm.selectedRestaurants.length>0 && (
                    <p className="text-xs text-muted-foreground">Will generate for {scheduleForm.selectedRestaurants.length} restaurants (single select above ignored).</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Offer Type</Label>
                <Select value={scheduleForm.offer_type} onValueChange={(v: any)=> setScheduleForm(f=>({...f, offer_type: v, base_pattern: f.base_pattern.map(p=>({ ...p, discount_amount: undefined, discount_percentage: p.minute===0? (v==='percentage'?50:undefined): (v==='percentage'?40:undefined) })), hour_overrides: {} }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Original Price (if using amount)</Label>
                <Input type="number" min={0} step="0.01" value={scheduleForm.original_price ?? ''} onChange={(e)=> setScheduleForm(f=>({...f, original_price: e.target.value? parseFloat(e.target.value): undefined}))} />
                <p className="text-xs text-muted-foreground">Needed to compute % display if amount discounts.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title Template</Label>
                <Input value={scheduleForm.title_template} onChange={(e)=> setScheduleForm(f=>({...f, title_template: e.target.value}))} />
                <p className="text-xs text-muted-foreground">Use {'{hour}'} placeholder (24h). Example template: Deal {'{hour}'}:00</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={scheduleForm.description} onChange={(e)=> setScheduleForm(f=>({...f, description: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={scheduleForm.start_date} onChange={(e)=> setScheduleForm(f=>({...f, start_date: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={scheduleForm.end_date} min={scheduleForm.start_date} onChange={(e)=> setScheduleForm(f=>({...f, end_date: e.target.value}))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {[{v:'0',l:'Mon'},{v:'1',l:'Tue'},{v:'2',l:'Wed'},{v:'3',l:'Thu'},{v:'4',l:'Fri'},{v:'5',l:'Sat'},{v:'6',l:'Sun'}].map(d=>{
                    const selected = scheduleForm.days_of_week?.split(',').includes(d.v) || false;
                    return <Button key={d.v} type="button" size="sm" variant={selected? 'default':'outline'} onClick={()=> setScheduleForm(f=>{ const cur = f.days_of_week? f.days_of_week.split(','):[]; const next = selected? cur.filter(x=>x!==d.v): [...cur,d.v]; return {...f, days_of_week: next.length? next.sort().join(','): undefined}; })}>{d.l}</Button>;
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Leave empty for all days.</p>
              </div>
            </div>
            {/* Hour selection */}
            <div className="space-y-2">
              <Label>Hours</Label>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                {Array.from({length:24},(_,h)=>h).map(h=>{
                  const sel = scheduleForm.hours.includes(h);
                  return <Button key={h} type="button" size="sm" variant={sel? 'default':'outline'} className="px-2" onClick={()=> setScheduleForm(f=> ({...f, hours: sel? f.hours.filter(x=>x!==h): [...f.hours,h].sort((a,b)=>a-b)}))}>{h.toString().padStart(2,'0')}</Button>;
                })}
              </div>
              <p className="text-xs text-muted-foreground">Select one or more hours (24h). Each generates a one-hour offer.</p>
            </div>
            {/* Base pattern */}
            <div className="space-y-3">
              <Label>Base 30-min Discount Pattern</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                {scheduleForm.base_pattern.map((p,idx)=> (
                  <div key={p.minute} className="space-y-1">
                    <Label>{p.minute === 0? 'HH:00 - HH:30':'HH:30 - HH+1:00'}</Label>
                    <Input type="number" min={0} step="0.01" placeholder={scheduleForm.offer_type==='percentage'? 'Percent':'Amount'} value={scheduleForm.offer_type==='percentage'? (p.discount_percentage ?? ''): (p.discount_amount ?? '')} onChange={(e)=> {
                      const val = e.target.value ? parseFloat(e.target.value): undefined;
                      setScheduleForm(f=> ({...f, base_pattern: f.base_pattern.map(bp=> bp.minute===p.minute? ({...bp, discount_percentage: f.offer_type==='percentage'? val: undefined, discount_amount: f.offer_type==='amount'? val: undefined }): bp)}));
                    }} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Applied to every selected hour unless overridden below.</p>
            </div>
            {/* Hour overrides */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Per-Hour Overrides</Label>
                <Button type="button" size="sm" variant="outline" onClick={()=> setScheduleForm(f=>({...f, hour_overrides:{}}))}>Clear Overrides</Button>
              </div>
              <div className="space-y-2">
                {scheduleForm.hours.map(h=> {
                  const key = String(h);
                  const pattern = scheduleForm.hour_overrides[key];
                  return (
                    <div key={key} className="border rounded p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">Hour {key.padStart(2,'0')}:00</div>
                        <div className="space-x-2">
                          <Button type="button" size="sm" variant="outline" onClick={()=> setScheduleForm(f=> ({...f, hour_overrides: {...f.hour_overrides, [key]: f.base_pattern.map(p=> ({...p})) }}))}>Copy Base</Button>
                          {pattern && <Button type="button" size="sm" variant="ghost" onClick={()=> setScheduleForm(f=> { const ho = {...f.hour_overrides}; delete ho[key]; return {...f, hour_overrides: ho}; })}>Remove</Button>}
                        </div>
                      </div>
                      {pattern ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {pattern.map(p=> (
                            <div key={p.minute} className="space-y-1">
                              <Label className="text-xs">{p.minute===0? '00-30':'30-60'} ({scheduleForm.offer_type==='percentage'? '%':'$'})</Label>
                              <Input type="number" min={0} step="0.01" value={scheduleForm.offer_type==='percentage'? (p.discount_percentage ?? ''): (p.discount_amount ?? '')} onChange={(e)=> {
                                const val = e.target.value? parseFloat(e.target.value): undefined;
                                setScheduleForm(f=> ({...f, hour_overrides: {...f.hour_overrides, [key]: f.hour_overrides[key].map(ep=> ep.minute===p.minute? ({...ep, discount_percentage: f.offer_type==='percentage'? val: undefined, discount_amount: f.offer_type==='amount'? val: undefined }): ep ) }}));
                              }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No override. Using base pattern.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="replace" checked={scheduleForm.replace} onCheckedChange={(c)=> setScheduleForm(f=>({...f, replace: c}))} />
              <Label htmlFor="replace">Replace existing offers for selected hours in range</Label>
            </div>
            <div className="text-xs text-muted-foreground">Existing one-hour offers starting at a selected hour and matching date range will be deleted when Replace is on.</div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={()=> setShowScheduleModal(false)} disabled={scheduleSubmitting}>Cancel</Button>
              <Button type="button" disabled={scheduleSubmitting} onClick={async ()=> {
                setScheduleErrors(null); setScheduleResult(null);
                // Basic validation
                if(!scheduleForm.restaurant && scheduleForm.selectedRestaurants.length===0){ setScheduleErrors('Select at least one restaurant'); return; }
                if(!scheduleForm.hours.length){ setScheduleErrors('Select at least one hour'); return; }
                if(!(scheduleForm.base_pattern.length || Object.keys(scheduleForm.hour_overrides).length)){ setScheduleErrors('Provide a base pattern or at least one hour override'); return; }
                setScheduleSubmitting(true);
                try {
                  const token = getAuthToken();
                  const targetRestaurants = scheduleForm.selectedRestaurants.length? scheduleForm.selectedRestaurants: [scheduleForm.restaurant];
                  const aggregate = { created_total:0, deleted_total:0, perRestaurant: [] as any[] };
                  for(const rid of targetRestaurants){
                    const payload:any = {
                      restaurant: rid,
                      offer_type: scheduleForm.offer_type,
                      title_template: scheduleForm.title_template,
                      description: scheduleForm.description,
                      start_date: scheduleForm.start_date,
                      end_date: scheduleForm.end_date,
                      hours: scheduleForm.hours,
                      slots_pattern: scheduleForm.base_pattern.map(p=> ({ minute: p.minute, discount_percentage: p.discount_percentage, discount_amount: p.discount_amount })).filter(p=> (p.discount_percentage!=null || p.discount_amount!=null)),
                      hour_specific: Object.fromEntries(Object.entries(scheduleForm.hour_overrides).map(([h,pat])=> [h, pat.map(p=> ({ minute: p.minute, discount_percentage: p.discount_percentage, discount_amount: p.discount_amount })) ])),
                      replace: scheduleForm.replace,
                    };
                    if(scheduleForm.days_of_week) payload.days_of_week = scheduleForm.days_of_week;
                    if(scheduleForm.original_price!=null) payload.original_price = scheduleForm.original_price;
                    let res: Response | null = null; let data: any = null;
                    try {
                      res = await fetch(`${API_URL}/api/offers/generate_schedule/`, {
                        method: 'POST',
                        headers: { 'Content-Type':'application/json', ...(token? { 'Authorization': `Token ${token}`}: {}) },
                        body: JSON.stringify(payload)
                      });
                      const ct = res.headers.get('content-type') || '';
                      if(ct.includes('application/json')) {
                        data = await res.json();
                      } else {
                        const text = await res.text();
                        setScheduleErrors(`Non-JSON response (status ${res.status}). Snippet: ${text.slice(0,80)}`);
                        continue;
                      }
                    } catch(fetchErr:any){
                      setScheduleErrors(fetchErr.message || 'Network error');
                      continue;
                    }
                    if(!res.ok){ setScheduleErrors(data?.error || `Failed on restaurant ${rid} (status ${res.status})`); continue; }
                    aggregate.created_total += data.created_count || 0;
                    aggregate.deleted_total += data.deleted_replaced || 0;
                    aggregate.perRestaurant.push({ restaurant: rid, ...data });
                  }
                  setScheduleResult(aggregate);
                  toast({ title: 'Schedule Generated', description: `${aggregate.created_total} offers created total.` });
                  fetchOffers();
                } catch(err:any){ setScheduleErrors(err.message || 'Error'); }
                finally { setScheduleSubmitting(false); }
              }}>{scheduleSubmitting? 'Generating...':'Generate'}</Button>
            </div>
            {scheduleResult && (
              <div className="mt-4 border rounded p-3 bg-muted/40 text-sm space-y-2">
                {'perRestaurant' in scheduleResult ? (
                  <>
                    <div><span className="font-medium">Total Created:</span> {scheduleResult.created_total}</div>
                    <div><span className="font-medium">Total Deleted (replaced):</span> {scheduleResult.deleted_total}</div>
                    <div className="space-y-1">
                      {scheduleResult.perRestaurant.map((r:any)=> (
                        <div key={r.restaurant} className="border rounded px-2 py-1">
                          <div className="font-medium">Restaurant {r.restaurant}</div>
                          <div>Created: {r.created_count} | Deleted: {r.deleted_replaced} {r.skipped_existing?.length? `| Skipped hours: ${r.skipped_existing.join(',')}`: ''}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div><span className="font-medium">Created:</span> {scheduleResult.created_count}</div>
                    {scheduleResult.deleted_replaced ? <div><span className="font-medium">Deleted (replaced):</span> {scheduleResult.deleted_replaced}</div>: null}
                    {scheduleResult.skipped_existing?.length ? <div><span className="font-medium">Skipped hours:</span> {scheduleResult.skipped_existing.join(', ')}</div>: null}
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
            <DialogDescription>
              {transferRestaurant ? `Select a new owner for ${transferRestaurant.name}` : 'Select a new owner'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="newOwner">New Owner</Label>
            <Select value={selectedNewOwner ? String(selectedNewOwner) : undefined} onValueChange={(v)=> setSelectedNewOwner(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
              <SelectContent>
                {ownerCandidates.length === 0 && <SelectItem value="none" disabled>No restaurant_owner users</SelectItem>}
                {ownerCandidates.map(o => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.username} ({o.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setShowTransferModal(false)}>Cancel</Button>
            <Button disabled={!selectedNewOwner} onClick={submitOwnershipTransfer}>Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
