import { bookings } from '@/lib/data';
import type { Booking } from '@/lib/types';
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


function BookingCard({ booking }: { booking: Booking }) {
    return (
        <Card className="overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3">
                <div className="sm:col-span-1">
                    <Image 
                        src={booking.restaurant.imageUrl}
                        alt={booking.restaurant.name}
                        width={300}
                        height={300}
                        className="h-full w-full object-cover"
                        data-ai-hint={booking.restaurant.dataAiHint}
                    />
                </div>
                <div className="sm:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="font-headline text-xl font-bold">{booking.restaurant.name}</h3>
                                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                    <MapPinIcon className="h-4 w-4" />
                                    {booking.restaurant.location}
                                </p>
                            </div>
                            <Badge 
                                variant={booking.status === 'Upcoming' ? 'default' : booking.status === 'Completed' ? 'secondary' : 'destructive'}
                                className="capitalize"
                            >
                                {booking.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" /> {booking.date}</div>
                        <div className="flex items-center gap-2"><ClockIcon className="h-4 w-4 text-primary" /> {booking.time}</div>
                        <div className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-primary" /> {booking.guests} Guests</div>
                        <div className="flex items-center gap-2"><PercentIcon className="h-4 w-4 text-primary" /> {booking.discount}% Off</div>
                    </CardContent>
                     <CardFooter>
                        {booking.status === 'Upcoming' && (
                            <div className="flex gap-2">
                                <Button variant="outline">Cancel</Button>
                                <Button>Modify</Button>
                            </div>
                        )}
                         {booking.status === 'Completed' && (
                            <Button>Book Again</Button>
                        )}
                    </CardFooter>
                </div>
            </div>
        </Card>
    );
}

export default function BookingsPage() {
    const upcomingBookings = bookings.filter(b => b.status === 'Upcoming');
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled');

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
