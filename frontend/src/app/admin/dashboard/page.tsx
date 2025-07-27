
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
        } else if (bookingsData && Array.isArray(bookingsData.results)) {
          setBookings(bookingsData.results);
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
            } else if (bookingsData && Array.isArray(bookingsData.results)) {
              setBookings(bookingsData.results);
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
    </div>
  );
}
