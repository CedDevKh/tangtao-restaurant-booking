"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, RefreshCw, Star, Eye, EyeOff } from 'lucide-react';

interface OwnedRestaurant {
	id: number;
	name: string;
	address: string;
	cuisine_type: string;
	price_range: number;
	capacity: number;
	rating: number;
	image_url?: string;
	is_active: boolean;
	is_featured: boolean;
	opening_time?: string;
	closing_time?: string;
	description?: string;
	created_at: string;
	updated_at: string;
}

interface Offer {
	id: number;
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
	recurring: string;
	days_of_week?: string;
	available_quantity: number;
	max_people_per_booking: number;
	min_advance_booking: number;
	is_active: boolean;
	is_featured: boolean;
	discounted_price?: string;
	savings_amount?: string;
	restaurant_name?: string;
	restaurant_cuisine?: string;
}

interface Booking {
	id: number;
	diner: { id: number; username: string };
	offer?: number | null;
	restaurant?: number | null;
	restaurant_name?: string | null;
	booking_time: string;
	number_of_people: number;
	status: string;
	created_at: string;
}

const API_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');

type OfferTimeSlotForm = {
	id?: number;
	start_time: string; // 'HH:MM'
	end_time: string;   // 'HH:MM'
	discount_percentage?: number | null;
	discount_amount?: number | null;
	is_active?: boolean;
};

export default function RestaurantOwnerDashboard() {
	const { user, isLoggedIn } = useAuth();
	const router = useRouter();
	const { toast } = useToast();

	const [loading, setLoading] = useState(true);
	const [restaurants, setRestaurants] = useState<OwnedRestaurant[]>([]);
	const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
	const [offers, setOffers] = useState<Offer[]>([]);
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [slots, setSlots] = useState<any[]>([]);
	const [showSlotModal, setShowSlotModal] = useState(false);
	const [slotForm, setSlotForm] = useState<any>({});
	const [editingSlot, setEditingSlot] = useState<any>(null);
	const [showOfferModal, setShowOfferModal] = useState(false);
	const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
	const [offerForm, setOfferForm] = useState<any>({});
	const [offerSubmitting, setOfferSubmitting] = useState(false);
	const [offerTimeSlots, setOfferTimeSlots] = useState<OfferTimeSlotForm[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const deleteOffer = async (offerId: number, restaurantId: number) => {
		if (!confirm('Delete this offer?')) return;
		try {
			const res = await fetch(`${API_URL}/api/offers/${offerId}/`, { method: 'DELETE', headers: authHeaders() });
			if (!res.ok) {
				const data = await res.json().catch(()=>null);
				toast({ title: 'Delete Failed', description: data ? JSON.stringify(data) : 'Could not delete offer', variant: 'destructive' });
				return;
			}
			toast({ title: 'Deleted', description: 'Offer removed' });
			await fetchOffers(restaurantId);
		} catch (e) {
			console.error(e);
			toast({ title: 'Error', description: 'Failed to delete offer', variant: 'destructive' });
		}
	};

	// Redirect if not restaurant owner
	useEffect(() => {
		if (!isLoggedIn) return;
		if (user && user.user_type !== 'restaurant_owner' && !user.is_staff) {
			router.push('/');
		}
	}, [user, isLoggedIn, router]);

	useEffect(() => {
		if (isLoggedIn) {
			loadData();
		}
	}, [isLoggedIn]);

	const authHeaders = () => {
		const token = getAuthToken();
		return {
			'Authorization': `Token ${token}`,
			'Content-Type': 'application/json'
		};
	};

	const loadData = async () => {
		try {
			setLoading(true);
			const res = await fetch(`${API_URL}/api/restaurants/mine/`, { headers: authHeaders() });
			if (!res.ok) throw new Error('Failed restaurants');
			const data = await res.json();
			const list: OwnedRestaurant[] = Array.isArray(data) ? data : (data.results || []);
			setRestaurants(list);
			if (list.length && !selectedRestaurantId) setSelectedRestaurantId(list[0].id);
			await Promise.all([fetchOffers(list.length ? list[0].id : null), fetchBookings()]);
		} catch (e) {
			console.error(e);
			toast({ title: 'Error', description: 'Failed loading dashboard data', variant: 'destructive' });
		} finally {
			setLoading(false);
		}
	};

	const fetchOffers = async (restaurantId: number | null = selectedRestaurantId) => {
		if (!restaurantId) return;
		try {
			const res = await fetch(`${API_URL}/api/offers/?restaurant=${restaurantId}`, { headers: authHeaders() });
			if (!res.ok) throw new Error('Failed offers');
			const data = await res.json();
			setOffers(Array.isArray(data) ? data : data.results || []);
		} catch (e) { console.error(e); }
	};

	const fetchSlots = async (restaurantId: number | null = selectedRestaurantId) => {
		if (!restaurantId) return;
		try {
			const res = await fetch(`${API_URL}/api/booking-slots/?restaurant=${restaurantId}`, { headers: authHeaders() });
			if (!res.ok) throw new Error('Failed slots');
			const data = await res.json();
			setSlots(Array.isArray(data) ? data : data.results || []);
		} catch (e) { console.error(e); }
	};

	const fetchBookings = async () => {
		try {
			const res = await fetch(`${API_URL}/api/bookings/`, { headers: authHeaders() });
			if (!res.ok) throw new Error('Failed bookings');
			const data = await res.json();
			setBookings(Array.isArray(data) ? data : data.results || []);
		} catch (e) { console.error(e); }
	};

	const refreshAll = async () => {
		setRefreshing(true);
		await loadData();
		if (selectedRestaurantId) await Promise.all([fetchOffers(selectedRestaurantId), fetchSlots(selectedRestaurantId)]);
		setRefreshing(false);
	};

	const resetOfferForm = (restaurantId: number) => {
		const today = new Date();
		const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
		const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
		setOfferForm({
			restaurant: restaurantId,
			title: '',
			description: '',
			offer_type: 'percentage',
			discount_percentage: 10,
			original_price: 0,
			start_date: tomorrow.toISOString().split('T')[0],
			end_date: nextWeek.toISOString().split('T')[0],
			start_time: '18:00',
			end_time: '19:00',
			recurring: 'none',
			days_of_week: '',
			available_quantity: 10,
			max_people_per_booking: 6,
			min_advance_booking: 1,
			is_active: true,
			is_featured: false,
		});
		setEditingOffer(null);
	};

	const openCreateOffer = () => {
		if (!selectedRestaurantId) return;
		resetOfferForm(selectedRestaurantId);
		setOfferTimeSlots([]);
		setShowOfferModal(true);
	};

	useEffect(()=> {
		if (selectedRestaurantId) {
			fetchSlots(selectedRestaurantId);
		}
	}, [selectedRestaurantId]);

	const openCreateSlot = () => {
		if (!selectedRestaurantId) return;
		const today = new Date();
		const dateStr = today.toISOString().split('T')[0];
		setSlotForm({
			restaurant: selectedRestaurantId,
			date: dateStr,
			start_time: '18:00:00',
			end_time: '19:00:00',
			discount_percentage: 10,
			capacity: 20,
			min_party_size: 1,
			max_party_size: 8,
			lead_time_minutes: 60,
			status: 'open',
			is_active: true,
			rules: {}
		});
		setEditingSlot(null);
		setShowSlotModal(true);
	};

	const openEditSlot = (slot: any) => {
		setSlotForm({...slot});
		setEditingSlot(slot);
		setShowSlotModal(true);
	};

	const submitSlot = async () => {
		if (!slotForm.restaurant) return;
		try {
			const method = editingSlot ? 'PUT' : 'POST';
			const url = editingSlot ? `${API_URL}/api/booking-slots/${editingSlot.id}/` : `${API_URL}/api/booking-slots/`;
			const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(slotForm) });
			const data = await res.json().catch(()=>null);
			if (!res.ok) {
				toast({ title: 'Slot Error', description: data ? JSON.stringify(data) : 'Failed saving slot', variant: 'destructive' });
				return;
			}
			toast({ title: 'Success', description: `Slot ${editingSlot ? 'updated' : 'created'}` });
			setShowSlotModal(false);
			await fetchSlots(slotForm.restaurant);
		} catch (e) {
			console.error(e);
			toast({ title: 'Error', description: 'Could not save slot', variant: 'destructive' });
		}
	};

	const deleteSlot = async (slot: any) => {
		if (!confirm('Delete this slot?')) return;
		try {
			const res = await fetch(`${API_URL}/api/booking-slots/${slot.id}/`, { method: 'DELETE', headers: authHeaders() });
			if (res.ok) {
				toast({ title: 'Deleted', description: 'Slot removed' });
				fetchSlots(slot.restaurant);
			}
		} catch (e) { console.error(e); }
	};

	const openEditOffer = (offer: Offer) => {
			setOfferForm({ ...offer });
			setEditingOffer(offer);
			// Load existing time slots for edit
			fetch(`${API_URL}/api/offers/${offer.id}/`, { headers: authHeaders() })
				.then(r => r.json())
				.then(data => {
					const slots = (data?.time_slots_detail || []).map((s:any)=>({
						id: s.id,
						start_time: (s.start_time || '').slice(0,5),
						end_time: (s.end_time || '').slice(0,5),
						discount_percentage: s.discount_percentage != null ? Number(s.discount_percentage) : null,
						discount_amount: s.discount_amount != null ? Number(s.discount_amount) : null,
						is_active: s.is_active,
					})) as OfferTimeSlotForm[];
					setOfferTimeSlots(slots);
				})
				.catch(()=> setOfferTimeSlots([]))
				.finally(()=> setShowOfferModal(true));
	};

	const submitOffer = async () => {
		if (!offerForm.restaurant) return;
		try {
			setOfferSubmitting(true);
			const method = editingOffer ? 'PUT' : 'POST';
			const url = editingOffer ? `${API_URL}/api/offers/${editingOffer.id}/` : `${API_URL}/api/offers/`;
				const payload = {
					...offerForm,
					time_slots: offerTimeSlots.map(s => ({
						start_time: s.start_time,
						end_time: s.end_time,
						discount_percentage: s.discount_percentage ?? undefined,
						discount_amount: s.discount_amount ?? undefined,
						is_active: s.is_active ?? true,
					}))
				};
				const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
			const data = await res.json().catch(()=>null);
			if (!res.ok) {
				toast({ title: 'Offer Error', description: data ? JSON.stringify(data) : 'Failed saving offer', variant: 'destructive' });
				return;
			}
			toast({ title: 'Success', description: `Offer ${editingOffer ? 'updated' : 'created'}` });
			setShowOfferModal(false);
				setOfferTimeSlots([]);
			await fetchOffers(offerForm.restaurant);
		} catch (e) {
			console.error(e);
			toast({ title: 'Error', description: 'Could not save offer', variant: 'destructive' });
		} finally {
			setOfferSubmitting(false);
		}
	};

	const toggleOffer = async (offer: Offer, field: 'active' | 'featured') => {
		try {
			const endpoint = field === 'active' ? 'toggle_active' : 'toggle_featured';
			const res = await fetch(`${API_URL}/api/offers/${offer.id}/${endpoint}/`, { method: 'POST', headers: authHeaders() });
			if (res.ok) {
				fetchOffers(offer.restaurant);
			}
		} catch (e) { console.error(e); }
	};

	const updateBookingStatus = async (booking: Booking, status: string) => {
		try {
			const payload: any = { status, booking_time: booking.booking_time, number_of_people: booking.number_of_people };
			if (booking.offer) payload.offer = booking.offer; else if (booking.restaurant) payload.restaurant = booking.restaurant;
			const res = await fetch(`${API_URL}/api/bookings/${booking.id}/`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(payload) });
			if (res.ok) fetchBookings();
		} catch (e) { console.error(e); }
	};

	if (!isLoggedIn || loading) return <div className="container mx-auto p-6">Loading...</div>;

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
					<p className="text-muted-foreground">Manage your restaurants, offers & bookings</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={refreshAll} disabled={refreshing}>
						<RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
					</Button>
					<Button onClick={openCreateOffer} disabled={!selectedRestaurantId}><Plus className="h-4 w-4 mr-2" />New Offer</Button>
				</div>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader><CardTitle>Owned Restaurants</CardTitle></CardHeader>
					<CardContent><div className="text-2xl font-bold">{restaurants.length}</div></CardContent>
				</Card>
				<Card>
					<CardHeader><CardTitle>Active Offers</CardTitle></CardHeader>
					<CardContent><div className="text-2xl font-bold">{offers.filter(o=>o.is_active).length}</div></CardContent>
				</Card>
				<Card>
					<CardHeader><CardTitle>Bookings</CardTitle></CardHeader>
					<CardContent><div className="text-2xl font-bold">{bookings.length}</div></CardContent>
				</Card>
			</div>

			<Tabs defaultValue="restaurants" className="space-y-4">
				<TabsList>
					<TabsTrigger value="restaurants">Restaurants</TabsTrigger>
					<TabsTrigger value="offers" disabled={!selectedRestaurantId}>Offers</TabsTrigger>
					<TabsTrigger value="slots" disabled={!selectedRestaurantId}>Slots</TabsTrigger>
					<TabsTrigger value="bookings">Bookings</TabsTrigger>
				</TabsList>

				<TabsContent value="restaurants" className="space-y-4">
					<div className="space-y-4">
						{restaurants.map(r => (
							<Card key={r.id} className={selectedRestaurantId === r.id ? 'border-primary' : ''}>
								<CardHeader className="flex flex-row justify-between items-start">
									<div>
										<CardTitle className="flex items-center gap-2">
											<button onClick={()=>{setSelectedRestaurantId(r.id); fetchOffers(r.id);}} className="hover:underline text-left">{r.name}</button>
											{r.is_featured && <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Featured</Badge>}
											<Badge variant={r.is_active ? 'default' : 'destructive'}>{r.is_active? 'Active':'Inactive'}</Badge>
										</CardTitle>
										<CardDescription>{r.address}</CardDescription>
									</div>
								</CardHeader>
								<CardContent>
									<div className="text-sm flex flex-wrap gap-4 text-muted-foreground">
										<span>Cuisine: {r.cuisine_type}</span>
										<span>Rating: {r.rating || 0}/5</span>
										<span>Capacity: {r.capacity}</span>
										<span>Hours: {r.opening_time || '—'} - {r.closing_time || '—'}</span>
									</div>
									{r.description && <p className="mt-2 text-sm">{r.description}</p>}
								</CardContent>
							</Card>
						))}
						{restaurants.length === 0 && <p className="text-sm text-muted-foreground">No restaurants assigned yet.</p>}
					</div>
				</TabsContent>

				<TabsContent value="offers" className="space-y-4">
					<div className="space-y-4">
						{offers.map(o => (
							<Card key={o.id}>
								<CardHeader className="flex flex-row justify-between items-start">
									<div>
										<CardTitle className="flex items-center gap-2">
											{o.title}
											<Badge variant={o.is_active ? 'default':'secondary'}>{o.is_active? 'Active':'Inactive'}</Badge>
											{o.is_featured && <Badge variant="outline">Featured</Badge>}
										</CardTitle>
										<CardDescription>{o.description}</CardDescription>
									</div>
									<div className="flex gap-2">
										<Button size="sm" variant="outline" onClick={()=>toggleOffer(o,'featured')}><Star className="h-4 w-4" /></Button>
										<Button size="sm" variant="outline" onClick={()=>toggleOffer(o,'active')}>{o.is_active? <EyeOff className="h-4 w-4" />:<Eye className="h-4 w-4" />}</Button>
										<Button size="sm" variant="outline" onClick={()=>openEditOffer(o)}>Edit</Button>
									</div>
								</CardHeader>
								<CardContent className="text-xs space-y-1 text-muted-foreground">
									<div>Date: {o.start_date} → {o.end_date}</div>
									<div>Time: {o.start_time} - {o.end_time} | Qty/day: {o.available_quantity}</div>
									<div>Type: {o.offer_type} {o.discount_percentage ? `(${o.discount_percentage}%)`: o.discount_amount? `(-${o.discount_amount})`: ''}</div>
								</CardContent>
							</Card>
						))}
						{offers.length === 0 && <p className="text-sm text-muted-foreground">No offers yet. Create one.</p>}
					</div>
				</TabsContent>

				<TabsContent value="slots" className="space-y-4">
					<div className="flex justify-end"><Button size="sm" onClick={openCreateSlot}><Plus className="h-4 w-4 mr-1"/>New Slot</Button></div>
					<div className="space-y-4">
						{slots.map(s => (
							<Card key={s.id}>
								<CardHeader className="flex flex-row justify-between items-start">
									<div>
										<CardTitle className="flex items-center gap-2 text-sm">
											Slot {s.date} {s.start_time?.slice(0,5)}-{s.end_time?.slice(0,5)}
											<Badge variant={s.effective_status === 'open' ? 'default':'secondary'}>{s.effective_status}</Badge>
										</CardTitle>
										<CardDescription className="text-xs">Cap: {s.capacity || '∞'} Rem: {s.remaining_capacity ?? '∞'} Disc: {s.discount_percentage ?? '-'}%</CardDescription>
									</div>
									<div className="flex gap-2">
										<Button size="sm" variant="outline" onClick={()=> openEditSlot(s)}>Edit</Button>
										<Button size="sm" variant="outline" onClick={()=> deleteSlot(s)}>Del</Button>
									</div>
								</CardHeader>
							</Card>
						))}
						{slots.length === 0 && <p className="text-sm text-muted-foreground">No slots yet.</p>}
					</div>
				</TabsContent>

				<TabsContent value="bookings" className="space-y-4">
						<div className="space-y-4">
							{bookings.map(b => (
								<Card key={b.id}>
									<CardHeader className="flex flex-row justify-between items-start">
										<div>
											<CardTitle className="flex items-center gap-2">
												Booking #{b.id}
												<Badge variant="secondary">{b.status}</Badge>
											</CardTitle>
											<CardDescription>
												{b.restaurant_name || '—'} • {new Date(b.booking_time).toLocaleString()} • {b.number_of_people} ppl
											</CardDescription>
										</div>
										<div className="flex gap-2">
											{['pending','confirmed','cancelled','completed'].map(st => (
												<Button key={st} size="sm" variant={b.status===st? 'default':'outline'} onClick={()=> updateBookingStatus(b, st)}>{st}</Button>
											))}
										</div>
									</CardHeader>
								</Card>
							))}
							{bookings.length === 0 && <p className="text-sm text-muted-foreground">No bookings yet.</p>}
						</div>
				</TabsContent>
			</Tabs>

			<Dialog open={showOfferModal} onOpenChange={setShowOfferModal}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{editingOffer ? 'Edit Offer' : 'New Offer'}</DialogTitle>
						<DialogDescription>Configure a promotional offer for your restaurant.</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
						<div className="space-y-2">
							<Label>Title</Label>
							<Input value={offerForm.title || ''} onChange={e=> setOfferForm((f:any)=>({...f,title:e.target.value}))} />
						</div>
						<div className="space-y-2">
							<Label>Description</Label>
							<Textarea value={offerForm.description || ''} onChange={e=> setOfferForm((f:any)=>({...f,description:e.target.value}))} />
						</div>
							<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Type</Label>
								<Select value={offerForm.offer_type} onValueChange={(v)=> setOfferForm((f:any)=>({...f,offer_type:v}))}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="percentage">Percentage</SelectItem>
										<SelectItem value="amount">Amount</SelectItem>
										<SelectItem value="special">Special</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{offerForm.offer_type === 'percentage' && (
								<div className="space-y-2">
									<Label>Discount %</Label>
									<Input type="number" value={offerForm.discount_percentage || 0} onChange={e=> setOfferForm((f:any)=>({...f,discount_percentage:Number(e.target.value)}))} />
								</div>
							)}
							{offerForm.offer_type === 'amount' && (
								<div className="space-y-2">
									<Label>Discount Amount</Label>
									<Input type="number" value={offerForm.discount_amount || 0} onChange={e=> setOfferForm((f:any)=>({...f,discount_amount:Number(e.target.value)}))} />
								</div>
							)}
							<div className="space-y-2">
								<Label>Original Price</Label>
								<Input type="number" value={offerForm.original_price || 0} onChange={e=> setOfferForm((f:any)=>({...f,original_price:Number(e.target.value)}))} />
							</div>
						</div>
							<div className="space-y-2">
								<Label>Days of Week (0=Mon ... 6=Sun)</Label>
								<Input placeholder="e.g. 0,1,2,3,4 for weekdays" value={offerForm.days_of_week || ''} onChange={e=> setOfferForm((f:any)=>({...f,days_of_week:e.target.value}))} />
								<p className="text-xs text-muted-foreground">Leave blank for every day.</p>
							</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Start Date</Label>
								<Input type="date" value={offerForm.start_date || ''} onChange={e=> setOfferForm((f:any)=>({...f,start_date:e.target.value}))} />
							</div>
							<div className="space-y-2">
								<Label>End Date</Label>
								<Input type="date" value={offerForm.end_date || ''} onChange={e=> setOfferForm((f:any)=>({...f,end_date:e.target.value}))} />
							</div>
									<div className="space-y-2">
								<Label>Start Time</Label>
																<Input type="time" value={offerForm.start_time || ''} onChange={e=> {
																	const v = e.target.value;
																	// auto-adjust end time to +1 hour to satisfy backend validation
																	try {
																		const [h,m] = String(v).split(':').map((x:string)=> parseInt(x,10));
																		const endHour = (h + 1) % 24; const end = `${String(endHour).padStart(2,'0')}:${String(m||0).padStart(2,'0')}`;
																		setOfferForm((f:any)=>({...f,start_time:v,end_time:end}));
																	} catch {
																		setOfferForm((f:any)=>({...f,start_time:v}));
																	}
																}} />
							</div>
							<div className="space-y-2">
								<Label>End Time</Label>
								<Input type="time" value={offerForm.end_time || ''} onChange={e=> setOfferForm((f:any)=>({...f,end_time:e.target.value}))} />
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Available Quantity (per day)</Label>
								<Input type="number" value={offerForm.available_quantity || 0} onChange={e=> setOfferForm((f:any)=>({...f,available_quantity:Number(e.target.value)}))} />
							</div>
							<div className="space-y-2">
								<Label>Max People / Booking</Label>
								<Input type="number" value={offerForm.max_people_per_booking || 0} onChange={e=> setOfferForm((f:any)=>({...f,max_people_per_booking:Number(e.target.value)}))} />
							</div>
							<div className="space-y-2">
								<Label>Min Advance (hrs)</Label>
								<Input type="number" value={offerForm.min_advance_booking || 0} onChange={e=> setOfferForm((f:any)=>({...f,min_advance_booking:Number(e.target.value)}))} />
							</div>
								<div className="space-y-2">
								<Label>Recurring</Label>
								<Select value={offerForm.recurring} onValueChange={(v)=> setOfferForm((f:any)=>({...f,recurring:v}))}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="none">None</SelectItem>
										<SelectItem value="daily">Daily</SelectItem>
										<SelectItem value="weekly">Weekly</SelectItem>
										<SelectItem value="monthly">Monthly</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
												<div className="grid grid-cols-2 gap-4">
									<div className="flex items-center gap-2">
								<input id="is_active" type="checkbox" checked={offerForm.is_active} onChange={e=> setOfferForm((f:any)=>({...f,is_active:e.target.checked}))} />
								<Label htmlFor="is_active">Active</Label>
							</div>
							<div className="flex items-center gap-2">
								<input id="is_featured" type="checkbox" checked={offerForm.is_featured} onChange={e=> setOfferForm((f:any)=>({...f,is_featured:e.target.checked}))} />
								<Label htmlFor="is_featured">Featured</Label>
							</div>
						</div>
												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<Label>30-minute Time Slots</Label>
														<Button size="sm" type="button" onClick={()=> {
															const base = offerForm.start_time || '18:00';
															const [h,m] = String(base).split(':').map((x:string)=> parseInt(x,10));
															const endMin = (m + 30) % 60; const endHour = h + Math.floor((m + 30)/60);
															const end = `${String(endHour).padStart(2,'0')}:${String(endMin).padStart(2,'0')}`;
															setOfferTimeSlots(s => [...s, { start_time: base, end_time: end, discount_percentage: offerForm.discount_percentage ?? 10, discount_amount: null, is_active: true }]);
														}}>Add Slot</Button>
													</div>
													{offerTimeSlots.length === 0 && <p className="text-xs text-muted-foreground">Add 30-minute slots. Minutes must be 00 or 30. Each slot is exactly 30 minutes.</p>}
													<div className="space-y-2">
														{offerTimeSlots.map((s, idx) => (
															<div key={idx} className="grid grid-cols-12 gap-2 items-end">
																<div className="col-span-3">
																	<Label className="text-xs">Start</Label>
																	<Input type="time" step={1800} value={s.start_time} onChange={e => {
																		const start = e.target.value;
																		const [h,m] = start.split(':').map(n=>parseInt(n,10));
																		const endMin = (m + 30) % 60; const endHour = h + Math.floor((m + 30)/60);
																		const end = `${String(endHour).padStart(2,'0')}:${String(endMin).padStart(2,'0')}`;
																		setOfferTimeSlots(list => list.map((it,i)=> i===idx? {...it, start_time:start, end_time:end }: it));
																	}} />
																</div>
																<div className="col-span-3">
																	<Label className="text-xs">End</Label>
																	<Input type="time" step={1800} value={s.end_time} onChange={e => {
																		setOfferTimeSlots(list => list.map((it,i)=> i===idx? {...it, end_time:e.target.value }: it));
																	}} />
																</div>
																<div className="col-span-3">
																	<Label className="text-xs">Discount %</Label>
																	<Input type="number" value={s.discount_percentage ?? ''} onChange={e => {
																		const v = e.target.value === '' ? null : Number(e.target.value);
																		setOfferTimeSlots(list => list.map((it,i)=> i===idx? {...it, discount_percentage:v, discount_amount:null }: it));
																	}} />
																</div>
																<div className="col-span-2">
																	<Label className="text-xs">$ Amount</Label>
																	<Input type="number" value={s.discount_amount ?? ''} onChange={e => {
																		const v = e.target.value === '' ? null : Number(e.target.value);
																		setOfferTimeSlots(list => list.map((it,i)=> i===idx? {...it, discount_amount:v, discount_percentage:null }: it));
																	}} />
																</div>
																<div className="col-span-1 flex gap-2 items-center">
																	<input type="checkbox" checked={s.is_active ?? true} onChange={e => setOfferTimeSlots(list => list.map((it,i)=> i===idx? {...it, is_active:e.target.checked }: it))} />
																</div>
																<div className="col-span-12 flex justify-end">
																	<Button size="sm" variant="outline" type="button" onClick={()=> setOfferTimeSlots(list => list.filter((_,i)=> i!==idx))}>Remove</Button>
																</div>
															</div>
														))}
													</div>
												</div>
					</div>
					<DialogFooter>
								<Button variant="outline" onClick={()=> setShowOfferModal(false)}>Cancel</Button>
								{editingOffer && (
									<Button variant="outline" onClick={()=> deleteOffer(editingOffer.id, editingOffer.restaurant)}>Delete</Button>
								)}
								<Button onClick={submitOffer} disabled={offerSubmitting}>{offerSubmitting? 'Saving...':'Save Offer'}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showSlotModal} onOpenChange={setShowSlotModal}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{editingSlot ? 'Edit Slot' : 'New Slot'}</DialogTitle>
						<DialogDescription>Manage a concrete time slot for bookings & discounts.</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-sm">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<Label>Date</Label>
								<Input type="date" value={slotForm.date || ''} onChange={e=> setSlotForm((f:any)=>({...f,date:e.target.value}))} />
							</div>
							<div className="space-y-1">
								<Label>Discount %</Label>
								<Input type="number" value={slotForm.discount_percentage || ''} onChange={e=> setSlotForm((f:any)=>({...f,discount_percentage:e.target.value? Number(e.target.value): null}))} />
							</div>
							<div className="space-y-1">
								<Label>Start Time</Label>
								<Input type="time" value={slotForm.start_time?.slice(0,5) || ''} onChange={e=> setSlotForm((f:any)=>({...f,start_time:e.target.value+':00'}))} />
							</div>
							<div className="space-y-1">
								<Label>End Time</Label>
								<Input type="time" value={slotForm.end_time?.slice(0,5) || ''} onChange={e=> setSlotForm((f:any)=>({...f,end_time:e.target.value+':00'}))} />
							</div>
							<div className="space-y-1">
								<Label>Capacity (0=∞)</Label>
								<Input type="number" value={slotForm.capacity || 0} onChange={e=> setSlotForm((f:any)=>({...f,capacity:Number(e.target.value)}))} />
							</div>
							<div className="space-y-1">
								<Label>Lead Time (min)</Label>
								<Input type="number" value={slotForm.lead_time_minutes || 0} onChange={e=> setSlotForm((f:any)=>({...f,lead_time_minutes:Number(e.target.value)}))} />
							</div>
							<div className="space-y-1">
								<Label>Min Party</Label>
								<Input type="number" value={slotForm.min_party_size || 1} onChange={e=> setSlotForm((f:any)=>({...f,min_party_size:Number(e.target.value)}))} />
							</div>
							<div className="space-y-1">
								<Label>Max Party</Label>
								<Input type="number" value={slotForm.max_party_size || 1} onChange={e=> setSlotForm((f:any)=>({...f,max_party_size:Number(e.target.value)}))} />
							</div>
							<div className="space-y-1 col-span-2">
								<Label>Status</Label>
								<Select value={slotForm.status || 'open'} onValueChange={(v)=> setSlotForm((f:any)=>({...f,status:v}))}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="open">Open</SelectItem>
										<SelectItem value="closed">Closed</SelectItem>
										<SelectItem value="full">Full</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={()=> setShowSlotModal(false)}>Cancel</Button>
						<Button onClick={submitSlot}>{editingSlot? 'Update Slot':'Save Slot'}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

