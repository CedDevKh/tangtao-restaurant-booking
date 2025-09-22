"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, Percent } from 'lucide-react';
import { buildApiUrl } from '@/lib/base-url';
import { checkAvailability, createHold, confirmBooking } from '@/lib/feed-api';

type Timeslot = { time: string; discount_percent?: number | null; source: 'slot'|'offer'|'both'; slot_id?: number | null; offer_id?: number | null };

export default function BookPage() {
    const routeParams = useParams<{ id: string }>();
    const restaurantId = routeParams?.id;
    const search = useSearchParams();
    const preTime = search.get('time') || '';
    const preOffer = search.get('offer') || '';
    const preSlot = search.get('slot') || '';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // fatal errors
    const [uiMessage, setUiMessage] = useState<string | null>(null); // inline, non-fatal notices
    const [restaurant, setRestaurant] = useState<any | null>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [minOfferDate, setMinOfferDate] = useState<string | null>(null);
    const [maxOfferDate, setMaxOfferDate] = useState<string | null>(null);
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState<string>('');
    const [party, setParty] = useState<number>(2);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [availability, setAvailability] = useState<{ available: boolean; remaining: number } | null>(null);
    const [hold, setHold] = useState<{ hold_id: string; expires_at: string } | null>(null);
    const [confirmState, setConfirmState] = useState<{ booking_id: string; code: string } | null>(null);
    const [resolving, setResolving] = useState(false);

    // init date today (use local date, not UTC ISO, to avoid off-by-one)
    useEffect(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDate(`${y}-${m}-${day}`);
    }, []);

    // load restaurant and timeslots
        useEffect(() => {
    let cancelled = false;
    async function load() {
                if (!restaurantId || !date) {
                    setError('Restaurant not found');
                    setLoading(false);
                    return;
                }
            setLoading(true);
            setError(null);
            try {
                    const rRes = await fetch(buildApiUrl(`/api/restaurants/${restaurantId}/`), { cache: 'no-store' });
                    if (!rRes.ok) {
                        setError('Restaurant not found');
                        setRestaurant(null);
                        return;
                    }
                const r = await rRes.json();
                if (cancelled) return;
                setRestaurant(r);
                    // Fetch active offers for this restaurant to determine selectable date range
                    try {
                        const oRes = await fetch(buildApiUrl(`/api/offers/by_restaurant/?restaurant_id=${restaurantId}`), { cache: 'no-store' });
                        if (oRes.ok) {
                            const oData = await oRes.json();
                            if (!cancelled && Array.isArray(oData)) {
                                setOffers(oData);
                                // Compute min/max across active offers
                                const todayStr = (()=>{ const d = new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; })();
                                const toISO = (s: string)=> s ? String(s) : '';
                                const sd = oData.map((o:any)=> toISO(o.start_date)).filter(Boolean).sort();
                                const ed = oData.map((o:any)=> toISO(o.end_date)).filter(Boolean).sort();
                                const minD = sd[0] || null;
                                const maxD = ed[ed.length-1] || null;
                                // Clamp min at today
                                const minClamped = (minD && minD > todayStr) ? minD : todayStr;
                                setMinOfferDate(minClamped);
                                setMaxOfferDate(maxD);
                                // If current date is outside range, reset to nearest within range
                                if (maxD && date > maxD) {
                                    setDate(maxD);
                                } else if (date < minClamped) {
                                    setDate(minClamped);
                                }
                            }
                        }
                    } catch {}
                    const tRes = await fetch(buildApiUrl(`/api/offers/timeslots/?restaurant=${restaurantId}&date=${date}`));
                const tData = await tRes.json();
                if (!cancelled) {
                    setTimeslots(Array.isArray(tData.timeslots) ? tData.timeslots : []);
                }
            } catch (e: any) {
                if (!cancelled) setError(e.message || 'Failed to load restaurant');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [restaurantId, date]);

    // restore saved contact
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setName(localStorage.getItem('bk_name') || '');
            setPhone(localStorage.getItem('bk_phone') || '');
            setEmail(localStorage.getItem('bk_email') || '');
        }
    }, []);

    // Helper to resolve a time (from offer) to a real BookingSlot id, with materialize fallback when covered by an active offer
    const resolveSlotForTime = async (t: string): Promise<string | null> => {
        if (!restaurantId || !date) return null;
        setResolving(true);
        setUiMessage(null);
        try {
            // 1) Try to find an existing live slot for this time
            const availUrl = buildApiUrl(`/api/slots/availability/?restaurant=${restaurantId}&date=${date}&party_size=${party}`);
            const res = await fetch(availUrl, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const slots: any[] = Array.isArray(data?.slots) ? data.slots : [];
                const match = slots.find((s: any) => {
                    const st = String(s?.start_time || '');
                    // API returns HH:MM:SS; compare HH:MM
                    return st.startsWith(t + ':');
                });
                if (match && match.id) {
                    return String(match.id);
                }
            }
            // 2) Materialize a slot if an active offer covers this time
            const matUrl = buildApiUrl('/api/offers/materialize_slot/');
            const matRes = await fetch(matUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurant: Number(restaurantId), date, time: t })
            });
            if (matRes.ok) {
                const slot = await matRes.json();
                if (slot?.id) return String(slot.id);
            } else {
                // surface any helpful server message
                try {
                    const err = await matRes.json();
                    setUiMessage(err?.error || 'No active offer covers this time. Please choose another.');
                } catch {
                    setUiMessage('No active offer covers this time. Please choose another.');
                }
            }
        } catch (e: any) {
            setUiMessage(e?.message || 'Failed to resolve a live slot for this time.');
        } finally {
            setResolving(false);
        }
        return null;
    };

    // preselect time/slot from query: if a slot is provided, trust it; otherwise attempt to resolve the time to a real slot
    useEffect(() => {
        let cancelled = false;
        async function run() {
            if (preSlot) {
                // try to find time from timeslots first
                const matched = timeslots.find(ts => ts.slot_id && String(ts.slot_id) === preSlot);
                if (matched) {
                    if (!cancelled) { setTime(matched.time); setSelectedSlotId(String(preSlot)); }
                    return;
                }
                // fall back to availability API to derive the time label
                try {
                    const url = buildApiUrl(`/api/slots/availability/?restaurant=${restaurantId}&date=${date}&party_size=${party}`);
                    const res = await fetch(url, { cache: 'no-store' });
                    if (res.ok) {
                        const data = await res.json();
                        const list = Array.isArray(data?.slots) ? data.slots : [];
                        const found = list.find((s: any) => String(s?.id) === String(preSlot));
                        if (!cancelled && found?.time) { setTime(found.time); setSelectedSlotId(String(preSlot)); }
                    }
                } catch {}
                return;
            }
            if (!preTime) return;
            const match = timeslots.find(ts => ts.time === preTime);
            if (!match) return;
            if (match.slot_id) {
                if (!cancelled) { setTime(preTime); setSelectedSlotId(String(match.slot_id)); }
                return;
            }
            // Attempt to resolve/materialize when it's an offer time
            const resolved = await resolveSlotForTime(preTime);
            if (!cancelled) {
                if (resolved) {
                    setTime(preTime);
                    setSelectedSlotId(resolved);
                } else {
                    setUiMessage(`The selected time ${preTime} isn't available to book. Please choose another time.`);
                    setTime('');
                    setSelectedSlotId(null);
                }
            }
        }
        run();
        return () => { cancelled = true; };
    }, [preTime, preSlot, timeslots, restaurantId, date, party]);
    // find discount & slot for selected time
    const selected = useMemo(() => {
        const t = timeslots.find(ts => ts.time === time);
        const discount = t?.discount_percent ? Math.round(Number(t.discount_percent)) : 0;
        const slotId = t?.slot_id ? String(t.slot_id) : null;
        return { discount, slotId };
    }, [timeslots, time]);

    // Require availability to be checked and available before allowing hold
    const effectiveSlotId = selected.slotId || selectedSlotId;
    const canHold = !!effectiveSlotId && name && email && phone && party > 0;
    const canConfirm = !!hold;

    const onCheck = async () => {
        setAvailability(null);
        setError(null);
        if (!effectiveSlotId) return;
        try {
            const res = await checkAvailability(effectiveSlotId, party);
            setAvailability(res);
            setUiMessage(null);
        } catch (e: any) {
            setUiMessage(e.message || 'Failed to check availability');
        }
    };

    // Helper to check availability for a specific slot id immediately
    const checkAvailabilityFor = async (slotId: string) => {
        try {
            const res = await checkAvailability(slotId, party);
            setAvailability(res);
        } catch (e: any) {
            setAvailability(null);
        }
    };

    const onHold = async () => {
        setError(null);
        if (!effectiveSlotId) return;
        try {
            const res = await createHold(effectiveSlotId, party, { name, phone, email });
            setHold({ hold_id: res.hold_id, expires_at: res.expires_at });
            localStorage.setItem('bk_name', name);
            localStorage.setItem('bk_phone', phone);
            localStorage.setItem('bk_email', email);
            setUiMessage(null);
        } catch (e: any) {
            setUiMessage(e.message || 'Unable to create hold');
        }
    };

    const onConfirm = async () => {
        if (!hold) return;
        try {
            const res = await confirmBooking(hold.hold_id);
            setConfirmState({ booking_id: res.booking_id, code: res.code });
            setUiMessage(null);
        } catch (e: any) {
            setUiMessage(e.message || 'Unable to confirm booking');
        }
    };

        if (loading) return <div className="container mx-auto p-8">Loading…</div>;
        if (error) return (
            <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center text-center">
                <h1 className="font-headline text-3xl">{error}</h1>
                <p className="mt-2 text-muted-foreground">The restaurant you’re looking for doesn’t exist or is unavailable.</p>
                <Button asChild className="mt-4"><a href="/restaurants">Back to Restaurants</a></Button>
            </div>
        );
        if (!restaurant) return null;

    const discount = selected.discount;

    return (
        <div className="bg-muted/40">
            <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <h1 className="mb-8 text-center font-headline text-4xl font-bold">Confirm Your Booking</h1>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Your Reservation</CardTitle>
                            <CardDescription>Review your booking details below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                {restaurant.image_url && (
                                    <Image src={restaurant.image_url} alt={restaurant.name} width={80} height={80} className="rounded-lg object-cover" />
                                )}
                                <div>
                                    <h3 className="font-semibold">{restaurant.name}</h3>
                                    <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                                </div>
                            </div>
                            <div className="space-y-2 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Date</span>
                                    <span>{date}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Time</span>
                                    <span>{time || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> Guests</span>
                                    <span>{party} {party === 1 ? 'person' : 'people'}</span>
                                </div>
                                <div className="flex items-center justify-between font-semibold text-primary">
                                    <span className="flex items-center gap-2"><Percent className="h-4 w-4" /> Discount</span>
                                    <span>{discount}% OFF</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Guest Details</CardTitle>
                            <CardDescription>Enter your information to complete the booking.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    min={(minOfferDate || date)}
                                    max={(maxOfferDate || undefined) as any}
                                    onChange={(e)=> {
                                        const v = e.target.value;
                                        // Clamp within offer period if known
                                        let nv = v;
                                        if (maxOfferDate && nv > maxOfferDate) nv = maxOfferDate;
                                        if (minOfferDate && nv < minOfferDate) nv = minOfferDate;
                                        setDate(nv);
                                        // reset selection and state when date changes
                                        setTime('');
                                        setSelectedSlotId(null);
                                        setAvailability(null);
                                        setHold(null);
                                        setUiMessage(null);
                                    }}
                                />
                                {(minOfferDate || maxOfferDate) && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Offer dates: {minOfferDate || '—'} to {maxOfferDate || '—'}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="guests">Number of Guests</Label>
                                <Select value={String(party)} onValueChange={(v)=> setParty(Number(v))}>
                                    <SelectTrigger id="guests">
                                        <SelectValue placeholder="Select number of guests" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[...Array(8)].map((_, i) => (
                                            <SelectItem key={i+1} value={`${i+1}`}>{i+1} guest{i > 0 && 's'}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="time">Select Time</Label>
                                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1 border rounded-md">
            {timeslots.map(ts => {
                    const isReal = !!ts.slot_id;
                    const isSelected = ts.time === time && (!!selected.slotId || !!selectedSlotId);
                    return (
                                            <button key={`${ts.time}-${ts.slot_id||'none'}`} type="button"
                                                onClick={async ()=> {
                            setAvailability(null); setHold(null); setError(null); setUiMessage(null);
                                                    if (isReal) {
                                                        setTime(ts.time);
                                                        const sid = String(ts.slot_id);
                                                        setSelectedSlotId(sid);
                                                        // Auto-check availability to reduce extra clicks
                                                        await checkAvailabilityFor(sid);
                                                    } else {
                                                        // Try to resolve/materialize this offer time
                                                        setTime(ts.time);
                                                        const id = await resolveSlotForTime(ts.time);
                                                        if (id) {
                                                            setSelectedSlotId(id);
                                                            setUiMessage(null);
                                                            await checkAvailabilityFor(id);
                                                        } else {
                                                            setSelectedSlotId(null);
                                                        }
                                                    }
                                                }}
                        className={`text-xs border rounded p-2 flex flex-col items-center justify-center transition ${isSelected ? 'bg-primary text-primary-foreground' : isReal ? 'bg-green-50 dark:bg-green-900/20 hover:border-primary' : 'bg-muted/50 hover:bg-muted'}`}
                                                title={ts.source}
                                            >
                                                <span>{ts.time}</span>
                                                {typeof ts.discount_percent === 'number' && <span className="font-medium">-{Math.round(ts.discount_percent)}%</span>}
                        {!isReal && <span className="text-[10px]">Offer time</span>}
                                            </button>
                                        );
                                    })}
                                    {timeslots.length === 0 && (
                                        <div className="col-span-4 text-center text-sm text-muted-foreground py-4">No offer times on this date. Try a different date within the offer period.</div>
                                    )}
                                </div>
                                {uiMessage && (
                                    <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">{uiMessage}</p>
                                )}
                                {!selected.slotId && !uiMessage && (
                                    <p className="mt-2 text-xs text-muted-foreground">Select a time to check live availability. If it’s an offer time, we’ll try to make it bookable.</p>
                                )}
                                {resolving && (
                                    <p className="mt-1 text-[11px] text-muted-foreground">Preparing timeslot…</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={name} onChange={e=> setName(e.target.value)} placeholder="John Doe" />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={email} onChange={e=> setEmail(e.target.value)} placeholder="you@example.com" />
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" type="tel" value={phone} onChange={e=> setPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Button type="button" variant="outline" onClick={onCheck} disabled={!effectiveSlotId}>Check availability</Button>
                                {availability && <span className={`text-xs ${availability.available? 'text-green-600':'text-red-600'}`}>{availability.available? `Available (${availability.remaining} left)` : 'Not available'}</span>}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            {!hold ? (
                                <Button className="w-full" size="lg" onClick={onHold} disabled={!canHold}>Create hold</Button>
                            ) : !confirmState ? (
                                <Button className="w-full" size="lg" onClick={onConfirm} disabled={!canConfirm}>Confirm Booking</Button>
                            ) : (
                                <div className="w-full text-center text-green-600">Confirmed! Code: {confirmState.code} <Link className="underline ml-2" href="/bookings">View my bookings</Link></div>
                            )}
                            {error && <div className="text-red-600 text-sm">{error}</div>}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
