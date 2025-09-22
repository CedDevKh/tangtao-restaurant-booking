"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/base-url';
import { getAuthToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OfferComposer, { type SimpleRestaurant, type OfferComposerInitial } from '@/components/offers/OfferComposer';
import { Plus, Star, Eye, EyeOff, Trash2, Pencil } from 'lucide-react';

type Restaurant = {
  id: number;
  name: string;
  address: string;
  cuisine_type: string;
  is_active: boolean;
  is_featured: boolean;
};

type Offer = {
  id: number;
  restaurant: number;
  restaurant_name?: string;
  title: string;
  description: string;
  offer_type: 'percentage' | 'amount' | 'special';
  discount_percentage?: number;
  discount_amount?: number;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_featured: boolean;
};

type Booking = {
  id: number;
  diner?: { id: number; username?: string; first_name?: string; last_name?: string; email?: string };
  offer?: number | null;
  restaurant?: number | null;
  restaurant_name?: string | null;
  booking_time: string;
  number_of_people: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  contact?: { name?: string; email?: string; phone?: string } | null;
};

type Stats = {
  total_restaurants: number;
  active_restaurants: number;
  featured_restaurants: number;
  total_offers: number;
  total_bookings: number;
};

type RestaurantForm = {
  name: string;
  address: string;
  cuisine_type: string;
  price_range: number;
  image_url?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  description?: string;
  opening_time?: string;
  closing_time?: string;
  latitude?: string;
  longitude?: string;
  is_active?: boolean;
  is_featured?: boolean;
  owner_id?: number | null;
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Avoid SSR/client HTML drift
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Data
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Transfer ownership modal
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState<Restaurant | null>(null);
  const [ownerCandidates, setOwnerCandidates] = useState<Array<{ id: number; username: string; email?: string }>>([]);
  const [selectedOwner, setSelectedOwner] = useState<number | null>(null);

  // Restaurant create/edit
  const [showCreateRestaurant, setShowCreateRestaurant] = useState(false);
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [restaurantForm, setRestaurantForm] = useState<RestaurantForm | null>(null);

  // Offer creation
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showEditOffer, setShowEditOffer] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editingInitial, setEditingInitial] = useState<OfferComposerInitial | null>(null);
  const simpleRestaurants: SimpleRestaurant[] = useMemo(() => restaurants.map(r => ({ id: r.id, name: r.name })), [restaurants]);

  const authHeaders = () => ({
    'Authorization': `Token ${getAuthToken()}`,
    'Content-Type': 'application/json'
  });

  useEffect(() => {
    if (!mounted) return;
    if (!user || !user.is_staff) {
      router.push('/');
      return;
    }
  const load = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
          toast({ title: 'Auth required', description: 'Please log in again.', variant: 'destructive' });
          router.push('/auth/login');
          return;
        }
        const [rRes, oRes, bRes, sRes] = await Promise.all([
          fetch(buildApiUrl('/api/admin/restaurants/'), { headers: authHeaders() }),
          fetch(buildApiUrl('/api/offers/'), { headers: authHeaders() }),
          fetch(buildApiUrl('/api/bookings/'), { headers: authHeaders() }),
          fetch(buildApiUrl('/api/admin/restaurants/stats/'), { headers: authHeaders() }),
        ]);
        if (rRes.ok) {
          const rData = await rRes.json();
          setRestaurants(Array.isArray(rData) ? rData : (rData.results || []));
        }
        if (oRes.ok) {
          const oData = await oRes.json();
          setOffers(Array.isArray(oData) ? oData : (oData.results || []));
        }
        if (bRes.ok) {
          const bData = await bRes.json();
          setBookings(Array.isArray(bData) ? bData : (bData.results || []));
        }
        if (sRes.ok) {
          const sData = await sRes.json();
          setStats(sData);
        }
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to load admin data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mounted, user, router, toast]);

  const refreshOffers = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/offers/'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOffers(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (e) { console.error(e); }
  };

  const refreshRestaurants = async () => {
    try {
      const rRes = await fetch(buildApiUrl('/api/admin/restaurants/'), { headers: authHeaders() });
      if (rRes.ok) {
        const rData = await rRes.json();
        setRestaurants(Array.isArray(rData) ? rData : (rData.results || []));
      }
    } catch (e) { console.error(e); }
  };

  const refreshBookings = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/bookings/'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (e) { console.error(e); }
  };

  const toggleRestaurantStatus = async (id: number, kind: 'active' | 'featured') => {
    try {
      const endpoint = kind === 'active' ? 'toggle_active' : 'toggle_featured';
      const res = await fetch(buildApiUrl(`/api/admin/restaurants/${id}/${endpoint}/`), { method: 'POST', headers: authHeaders() });
      if (res.ok) await refreshRestaurants();
    } catch (e) { console.error(e); }
  };

  const loadOwnerCandidates = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/admin/restaurants/owner_candidates/'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOwnerCandidates(data || []);
      }
    } catch (e) { console.error(e); }
  };

  const openCreateRestaurant = async () => {
    setRestaurantForm({
      name: '',
      address: '',
      cuisine_type: 'other',
      price_range: 2,
      is_active: true,
      is_featured: false,
      owner_id: null,
    });
    setShowCreateRestaurant(true);
    await loadOwnerCandidates();
  };

  const openEditRestaurant = async (r: Restaurant) => {
    setEditingRestaurant(r);
    setRestaurantForm({
      name: r.name,
      address: (r as any).address || '',
      cuisine_type: r.cuisine_type || 'other',
      price_range: (r as any).price_range ?? 2,
      image_url: (r as any).image_url || '',
      phone_number: (r as any).phone_number || '',
      email: (r as any).email || '',
      website: (r as any).website || '',
      description: (r as any).description || '',
      opening_time: (r as any).opening_time || '',
      closing_time: (r as any).closing_time || '',
      latitude: (r as any).latitude ? String((r as any).latitude) : '',
      longitude: (r as any).longitude ? String((r as any).longitude) : '',
      is_active: r.is_active,
      is_featured: r.is_featured,
      owner_id: null,
    });
    setShowEditRestaurant(true);
    await loadOwnerCandidates();
  };

  const submitRestaurant = async (mode: 'create' | 'edit') => {
    if (!restaurantForm) return;
  const payload: any = { ...restaurantForm };
    // Clean up empty strings and convert numeric fields
  const cleanup = (obj: any) => {
      const out: any = {};
      Object.entries(obj).forEach(([k, v]) => {
        if (v === '' || v === undefined) return;
        if (k === 'price_range' && typeof v !== 'number') out[k] = Number(v);
    // Keep lat/lng as strings to preserve precision; DRF accepts decimal strings
    else if ((k === 'latitude' || k === 'longitude') && v !== undefined && v !== '') out[k] = String(v);
        else out[k] = v;
      });
      return out;
    };
    const body = JSON.stringify(cleanup(payload));
    try {
      if (mode === 'create') {
        const res = await fetch(buildApiUrl('/api/admin/restaurants/'), { method: 'POST', headers: authHeaders(), body });
        const data = await res.json().catch(()=>null);
        if (!res.ok) {
          toast({ title: 'Create failed', description: data ? JSON.stringify(data) : 'Unable to create restaurant', variant: 'destructive' });
          return;
        }
        toast({ title: 'Restaurant created' });
        setShowCreateRestaurant(false);
      } else if (mode === 'edit' && editingRestaurant) {
        const res = await fetch(buildApiUrl(`/api/admin/restaurants/${editingRestaurant.id}/`), { method: 'PATCH', headers: authHeaders(), body });
        const data = await res.json().catch(()=>null);
        if (!res.ok) {
          toast({ title: 'Update failed', description: data ? JSON.stringify(data) : 'Unable to update restaurant', variant: 'destructive' });
          return;
        }
        toast({ title: 'Restaurant updated' });
        setShowEditRestaurant(false);
        setEditingRestaurant(null);
      }
      await refreshRestaurants();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const deleteRestaurant = async (r: Restaurant) => {
    if (!confirm(`Delete restaurant "${r.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(buildApiUrl(`/api/admin/restaurants/${r.id}/`), { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        const text = await res.text();
        console.error(text);
        toast({ title: 'Delete failed', description: 'Could not remove restaurant', variant: 'destructive' });
        return;
      }
      toast({ title: 'Deleted', description: `${r.name} removed` });
      await refreshRestaurants();
    } catch (e) { console.error(e); }
  };

  const toggleOfferFlag = async (offer: Offer, kind: 'active' | 'featured') => {
    try {
      const endpoint = kind === 'active' ? 'toggle_active' : 'toggle_featured';
      const res = await fetch(buildApiUrl(`/api/offers/${offer.id}/${endpoint}/`), { method: 'POST', headers: authHeaders() });
      if (res.ok) refreshOffers();
    } catch (e) { console.error(e); }
  };

  const openEdit = async (offer: Offer) => {
    setEditingOffer(offer);
    try {
      const res = await fetch(buildApiUrl(`/api/offers/${offer.id}/`), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const init: OfferComposerInitial = {
          restaurant: data.restaurant,
          title: data.title,
          description: data.description,
          start_date: data.start_date,
          end_date: data.end_date,
          discount_percentage: data.discount_percentage ?? undefined,
          available_quantity: data.available_quantity ?? undefined,
          days_of_week: data.days_of_week ?? undefined,
          time_slots: Array.isArray(data.time_slots_detail) ? data.time_slots_detail : [],
          is_active: data.is_active,
        };
        setEditingInitial(init);
        setShowEditOffer(true);
      }
    } catch (e) { console.error(e); }
  };

  const submitEdit = async (payload: any) => {
    if (!editingOffer) return;
    try {
      const res = await fetch(buildApiUrl(`/api/offers/${editingOffer.id}/`), { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json().catch(()=>null);
      if (!res.ok) {
        toast({ title: 'Update failed', description: data ? JSON.stringify(data) : 'Could not update offer', variant: 'destructive' });
        return;
      }
      toast({ title: 'Offer updated' });
      setShowEditOffer(false);
      setEditingOffer(null);
      setEditingInitial(null);
      refreshOffers();
    } catch (e) { console.error(e); }
  };

  const deleteOffer = async (offer: Offer) => {
    if (!confirm('Delete this offer?')) return;
    try {
      const res = await fetch(buildApiUrl(`/api/offers/${offer.id}/`), { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        toast({ title: 'Deleted', description: 'Offer removed' });
        refreshOffers();
      }
    } catch (e) { console.error(e); }
  };

  const updateBookingStatus = async (booking: Booking, next: Booking['status']) => {
    try {
      const payload: any = { status: next, booking_time: booking.booking_time, number_of_people: booking.number_of_people };
      if (booking.offer != null) payload.offer = booking.offer;
      else if (booking.restaurant != null) payload.restaurant = booking.restaurant;
      else if (booking.restaurant_name) {
        const r = restaurants.find(x => x.name === booking.restaurant_name);
        if (r) payload.restaurant = r.id;
      }
      const res = await fetch(buildApiUrl(`/api/bookings/${booking.id}/`), { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        toast({ title: 'Updated', description: `Booking marked ${next}` });
        refreshBookings();
      } else {
        const text = await res.text();
        console.error(text);
        toast({ title: 'Failed', description: 'Could not update booking', variant: 'destructive' });
      }
    } catch (e) { console.error(e); }
  };

  const openTransfer = async (r: Restaurant) => {
    setTransferTarget(r);
    setSelectedOwner(null);
    setShowTransfer(true);
  await loadOwnerCandidates();
  };

  const submitTransfer = async () => {
    if (!transferTarget || !selectedOwner) return;
    try {
      const res = await fetch(buildApiUrl(`/api/admin/restaurants/${transferTarget.id}/transfer_owner/`), {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ new_owner_id: selectedOwner })
      });
      if (res.ok) {
        toast({ title: 'Transferred', description: 'Ownership updated' });
        setShowTransfer(false);
      } else {
        const err = await res.text();
        console.error(err);
        toast({ title: 'Failed', description: 'Could not transfer owner', variant: 'destructive' });
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateOffer = async (payload: any) => {
    try {
      const res = await fetch(buildApiUrl('/api/offers/'), { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast({ title: 'Create failed', description: data ? JSON.stringify(data) : 'Could not create offer', variant: 'destructive' });
        return;
      }
      toast({ title: 'Offer created' });
      setShowCreateOffer(false);
      refreshOffers();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to create offer', variant: 'destructive' });
    }
  };

  if (!mounted) return null;
  if (!user?.is_staff) return null;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage restaurants and offers</p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <Button className="w-full sm:w-auto" variant="outline" onClick={openCreateRestaurant}>
            <Plus className="h-4 w-4 mr-2" /> Add Restaurant
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => setShowCreateOffer(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Offer
          </Button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <Tabs defaultValue="restaurants" className="space-y-4">
          <TabsList className="overflow-x-auto no-scrollbar whitespace-nowrap justify-start">
            <TabsTrigger className="text-sm px-3 py-2" value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger className="text-sm px-3 py-2" value="offers">Offers</TabsTrigger>
            <TabsTrigger className="text-sm px-3 py-2" value="bookings">Bookings</TabsTrigger>
          </TabsList>

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.total_restaurants}</div><div className="text-xs text-muted-foreground">Restaurants</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.active_restaurants}</div><div className="text-xs text-muted-foreground">Active</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.featured_restaurants}</div><div className="text-xs text-muted-foreground">Featured</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.total_offers}</div><div className="text-xs text-muted-foreground">Offers</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.total_bookings}</div><div className="text-xs text-muted-foreground">Bookings</div></CardContent></Card>
            </div>
          )}

          <TabsContent value="restaurants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Restaurants ({restaurants.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {restaurants.map(r => (
                    <div key={r.id} className="border rounded p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{r.name}</h3>
                          {r.is_featured && <Badge variant="secondary">Featured</Badge>}
                          <Badge variant={r.is_active ? 'default' : 'destructive'}>{r.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{r.address}</div>
                        <div className="text-xs text-muted-foreground">Cuisine: {r.cuisine_type}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-nowrap w-full sm:w-auto">
                        <Button className="flex-1 sm:flex-none" size="sm" variant="outline" onClick={() => openEditRestaurant(r)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button className="flex-1 sm:flex-none" size="sm" variant="outline" title="Toggle Featured" onClick={() => toggleRestaurantStatus(r.id, 'featured')}>
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button className="flex-1 sm:flex-none" size="sm" variant="outline" title={r.is_active ? 'Deactivate' : 'Activate'} onClick={() => toggleRestaurantStatus(r.id, 'active')}>
                          {r.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button className="flex-1 sm:flex-none" size="sm" variant="outline" onClick={() => openTransfer(r)}>Transfer</Button>
                        <Button className="flex-1 sm:flex-none" size="sm" variant="destructive" onClick={() => deleteRestaurant(r)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!restaurants.length && <div className="text-sm text-muted-foreground">No restaurants found.</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offers ({offers.length})</CardTitle>
                <CardDescription>Toggle status or remove offers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
      {offers.map(o => (
                    <div key={o.id} className="border rounded p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{o.title}</h3>
                          <Badge variant={o.is_active ? 'default' : 'secondary'}>{o.is_active ? 'Active' : 'Inactive'}</Badge>
                          {o.is_featured && <Badge variant="outline">Featured</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">{o.restaurant_name || `Restaurant #${o.restaurant}`}</div>
                        <div className="text-xs text-muted-foreground">{o.start_date} {o.start_time} — {o.end_date} {o.end_time}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-nowrap w-full sm:w-auto">
        <Button className="flex-1 sm:flex-none" size="sm" variant="outline" onClick={() => openEdit(o)}>Edit</Button>
                        <Button className="flex-1 sm:flex-none" size="sm" variant="outline" onClick={() => toggleOfferFlag(o, 'featured')}><Star className="h-4 w-4" /></Button>
                        <Button className="flex-1 sm:flex-none" size="sm" variant="outline" onClick={() => toggleOfferFlag(o, 'active')}>
                          {o.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button className="flex-1 sm:flex-none" size="sm" variant="destructive" onClick={() => deleteOffer(o)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {!offers.length && <div className="text-sm text-muted-foreground">No offers found.</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bookings ({bookings.length})</CardTitle>
                <CardDescription>Review and update booking statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookings.map(b => (
                    <div key={b.id} className="border rounded p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{b.status}</Badge>
                          <span className="text-sm">#{b.id}</span>
                        </div>
                        <div className="text-sm">{b.restaurant_name || (b.restaurant ? `Restaurant #${b.restaurant}` : 'Direct')}</div>
                        <div className="text-xs text-muted-foreground">{new Date(b.booking_time).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Party: {b.number_of_people}</div>
                        <div className="text-xs text-muted-foreground">Customer: {b.diner?.first_name || ''} {b.diner?.last_name || ''} {b.diner?.username ? `(${b.diner.username})` : ''}</div>
                        {b.contact && (b.contact.name || b.contact.email || b.contact.phone) && (
                          <div className="text-xs text-muted-foreground">Contact: {[b.contact.name, b.contact.email, b.contact.phone].filter(Boolean).join(' · ')}</div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-nowrap w-full sm:w-auto">
                        {b.status === 'pending' && (
                          <>
                            <Button className="flex-1 sm:flex-none" size="sm" variant="outline" onClick={() => updateBookingStatus(b, 'confirmed')}>Confirm</Button>
                            <Button className="flex-1 sm:flex-none" size="sm" variant="destructive" onClick={() => updateBookingStatus(b, 'cancelled')}>Cancel</Button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <Button className="flex-1 sm:flex-none" size="sm" variant="outline" onClick={() => updateBookingStatus(b, 'completed')}>Complete</Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!bookings.length && <div className="text-sm text-muted-foreground">No bookings found.</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={showCreateOffer} onOpenChange={setShowCreateOffer}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Offer</DialogTitle>
            <DialogDescription>Compose and publish a new offer</DialogDescription>
          </DialogHeader>
          <OfferComposer
            restaurants={simpleRestaurants}
            onCancel={() => setShowCreateOffer(false)}
            onSubmit={handleCreateOffer}
          />
        </DialogContent>
      </Dialog>

      {/* Create Restaurant */}
      <Dialog open={showCreateRestaurant} onOpenChange={setShowCreateRestaurant}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Restaurant</DialogTitle>
            <DialogDescription>Create a new restaurant listing</DialogDescription>
          </DialogHeader>
          {restaurantForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>Name</Label>
                <Input value={restaurantForm.name} onChange={e=>setRestaurantForm({ ...restaurantForm, name: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input value={restaurantForm.address} onChange={e=>setRestaurantForm({ ...restaurantForm, address: e.target.value })} />
              </div>
              <div>
                <Label>Cuisine</Label>
                <Select value={restaurantForm.cuisine_type} onValueChange={v=>setRestaurantForm({ ...restaurantForm, cuisine_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Cuisine" /></SelectTrigger>
                  <SelectContent>
                    {['italian','chinese','japanese','mexican','indian','french','american','thai','mediterranean','korean','vietnamese','khmer','fine_dining','other'].map(c => (
                      <SelectItem key={c} value={c}>{c.replace('_',' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price Range</Label>
                <Select value={String(restaurantForm.price_range)} onValueChange={v=>setRestaurantForm({ ...restaurantForm, price_range: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Price" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(n => (<SelectItem key={n} value={String(n)}>{'$'.repeat(n)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Image URL</Label>
                <Input value={restaurantForm.image_url || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, image_url: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={restaurantForm.phone_number || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, phone_number: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={restaurantForm.email || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, email: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Website</Label>
                <Input value={restaurantForm.website || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, website: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea value={restaurantForm.description || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, description: e.target.value })} />
              </div>
              <div>
                <Label>Opening Time</Label>
                <Input value={restaurantForm.opening_time || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, opening_time: e.target.value })} placeholder="e.g. 10:00" />
              </div>
              <div>
                <Label>Closing Time</Label>
                <Input value={restaurantForm.closing_time || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, closing_time: e.target.value })} placeholder="e.g. 22:00" />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input inputMode="decimal" type="text" value={restaurantForm.latitude || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, latitude: e.target.value })} placeholder="e.g. 11.556432198765" />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input inputMode="decimal" type="text" value={restaurantForm.longitude || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, longitude: e.target.value })} placeholder="e.g. 104.928245671234" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm mt-2">
                  <input type="checkbox" checked={!!restaurantForm.is_active} onChange={e=>setRestaurantForm({ ...restaurantForm, is_active: e.target.checked })} /> Active
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm mt-2">
                  <input type="checkbox" checked={!!restaurantForm.is_featured} onChange={e=>setRestaurantForm({ ...restaurantForm, is_featured: e.target.checked })} /> Featured
                </label>
              </div>
              <div className="md:col-span-2">
                <Label>Owner (optional)</Label>
                <Select value={restaurantForm.owner_id ? String(restaurantForm.owner_id) : undefined} onValueChange={v=>setRestaurantForm({ ...restaurantForm, owner_id: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Assign owner" /></SelectTrigger>
                  <SelectContent>
                    {ownerCandidates.length === 0 && <SelectItem value="none" disabled>No restaurant_owner users</SelectItem>}
                    {ownerCandidates.map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.username}{o.email ? ` (${o.email})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreateRestaurant(false)}>Cancel</Button>
                <Button onClick={() => submitRestaurant('create')}>Create</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Restaurant */}
      <Dialog open={showEditRestaurant} onOpenChange={setShowEditRestaurant}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Restaurant</DialogTitle>
            <DialogDescription>Update restaurant details</DialogDescription>
          </DialogHeader>
          {restaurantForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>Name</Label>
                <Input value={restaurantForm.name} onChange={e=>setRestaurantForm({ ...restaurantForm, name: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input value={restaurantForm.address} onChange={e=>setRestaurantForm({ ...restaurantForm, address: e.target.value })} />
              </div>
              <div>
                <Label>Cuisine</Label>
                <Select value={restaurantForm.cuisine_type} onValueChange={v=>setRestaurantForm({ ...restaurantForm, cuisine_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Cuisine" /></SelectTrigger>
                  <SelectContent>
                    {['italian','chinese','japanese','mexican','indian','french','american','thai','mediterranean','korean','vietnamese','khmer','fine_dining','other'].map(c => (
                      <SelectItem key={c} value={c}>{c.replace('_',' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price Range</Label>
                <Select value={String(restaurantForm.price_range)} onValueChange={v=>setRestaurantForm({ ...restaurantForm, price_range: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Price" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(n => (<SelectItem key={n} value={String(n)}>{'$'.repeat(n)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Image URL</Label>
                <Input value={restaurantForm.image_url || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, image_url: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={restaurantForm.phone_number || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, phone_number: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={restaurantForm.email || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, email: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Website</Label>
                <Input value={restaurantForm.website || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, website: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea value={restaurantForm.description || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, description: e.target.value })} />
              </div>
              <div>
                <Label>Opening Time</Label>
                <Input value={restaurantForm.opening_time || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, opening_time: e.target.value })} placeholder="e.g. 10:00" />
              </div>
              <div>
                <Label>Closing Time</Label>
                <Input value={restaurantForm.closing_time || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, closing_time: e.target.value })} placeholder="e.g. 22:00" />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input inputMode="decimal" type="text" value={restaurantForm.latitude || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, latitude: e.target.value })} placeholder="e.g. 11.556432198765" />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input inputMode="decimal" type="text" value={restaurantForm.longitude || ''} onChange={e=>setRestaurantForm({ ...restaurantForm, longitude: e.target.value })} placeholder="e.g. 104.928245671234" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm mt-2">
                  <input type="checkbox" checked={!!restaurantForm.is_active} onChange={e=>setRestaurantForm({ ...restaurantForm, is_active: e.target.checked })} /> Active
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm mt-2">
                  <input type="checkbox" checked={!!restaurantForm.is_featured} onChange={e=>setRestaurantForm({ ...restaurantForm, is_featured: e.target.checked })} /> Featured
                </label>
              </div>
              <div className="md:col-span-2">
                <Label>Reassign Owner (optional)</Label>
                <Select value={restaurantForm.owner_id ? String(restaurantForm.owner_id) : undefined} onValueChange={v=>setRestaurantForm({ ...restaurantForm, owner_id: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Select new owner" /></SelectTrigger>
                  <SelectContent>
                    {ownerCandidates.length === 0 && <SelectItem value="none" disabled>No restaurant_owner users</SelectItem>}
                    {ownerCandidates.map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.username}{o.email ? ` (${o.email})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowEditRestaurant(false)}>Cancel</Button>
                <Button onClick={() => submitRestaurant('edit')}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditOffer} onOpenChange={setShowEditOffer}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
            <DialogDescription>Update the offer details and publish changes</DialogDescription>
          </DialogHeader>
          {editingInitial && (
            <OfferComposer
              restaurants={simpleRestaurants}
              defaultRestaurantId={editingInitial.restaurant}
              initial={editingInitial}
              onCancel={() => setShowEditOffer(false)}
              onSubmit={(payload)=> submitEdit(payload)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
            <DialogDescription>{transferTarget ? `Select new owner for ${transferTarget.name}` : 'Select new owner'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New Owner</Label>
            <Select value={selectedOwner ? String(selectedOwner) : undefined} onValueChange={(v) => setSelectedOwner(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
              <SelectContent>
                {ownerCandidates.length === 0 && <SelectItem value="none" disabled>No restaurant_owner users</SelectItem>}
                {ownerCandidates.map(o => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.username}{o.email ? ` (${o.email})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancel</Button>
              <Button disabled={!selectedOwner} onClick={submitTransfer}>Transfer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
