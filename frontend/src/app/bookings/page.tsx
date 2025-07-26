"use client";
import { useEffect, useState } from 'react';
import { getUserBookings } from '@/lib/booking-api';
import type { BookingResponse } from '@/lib/booking-api';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Inline SVG icons to prevent hydration errors
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const PercentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="6.5" cy="6.5" r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);


function BookingCard({ booking }: { booking: BookingResponse }) {
    return (
        <Card className="overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3">
                <div className="sm:col-span-1 flex items-center justify-center bg-gray-100">
                    {/* Optionally add a restaurant image if available */}
                    <span className="text-2xl font-bold text-gray-400">🍽️</span>
                </div>
                <div className="sm:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-headline text-xl font-bold">{booking.restaurant_name || 'Unknown Restaurant'}</h3>
                                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                    <MapPinIcon className="h-4 w-4" />
                                    {booking.offer_title ? booking.offer_title : 'Standard Booking'}
                                </p>
                            </div>
                            <Badge 
                                variant={booking.status === 'pending' ? 'default' : booking.status === 'completed' ? 'secondary' : booking.status === 'cancelled' ? 'destructive' : 'default'}
                                className="capitalize"
                            >
                                {booking.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" /> {new Date(booking.booking_time).toLocaleDateString()}</div>
                        <div className="flex items-center gap-2"><ClockIcon className="h-4 w-4 text-primary" /> {new Date(booking.booking_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-primary" /> {booking.number_of_people} Guests</div>
                    </CardContent>
                    <CardFooter>
                        {booking.status === 'pending' && (
                            <div className="flex gap-2">
                                <Button variant="outline">Cancel</Button>
                                <Button>Modify</Button>
                            </div>
                        )}
                        {booking.status === 'completed' && (
                            <Button>Book Again</Button>
                        )}
                    </CardFooter>
                </div>
            </div>
        </Card>
    );
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        getUserBookings()
            .then((data) => {
                // If API returns { results: [...] }, use results; else use data directly
                if (Array.isArray(data)) {
                    setBookings(data);
                } else if (data && Array.isArray(data.results)) {
                    setBookings(data.results);
                } else {
                    setBookings([]);
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-8 text-center font-headline text-4xl font-bold">My Bookings</h1>
            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming">
                   <div className="space-y-6 mt-6">
                        {upcomingBookings.length > 0 ? (
                            upcomingBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No upcoming bookings.</p>
                        )}
                   </div>
                </TabsContent>
                <TabsContent value="completed">
                    <div className="space-y-6 mt-6">
                        {completedBookings.length > 0 ? (
                            completedBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No completed bookings.</p>
                        )}
                   </div>
                </TabsContent>
                <TabsContent value="cancelled">
                     <div className="space-y-6 mt-6">
                        {cancelledBookings.length > 0 ? (
                            cancelledBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No cancelled bookings.</p>
                        )}
                   </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
