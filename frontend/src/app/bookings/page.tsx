import { bookings } from '@/lib/data';
import type { Booking } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, Percent } from 'lucide-react';

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
                                    <MapPin className="h-4 w-4" />
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
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {booking.date}</div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {booking.time}</div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {booking.guests} Guests</div>
                        <div className="flex items-center gap-2"><Percent className="h-4 w-4 text-primary" /> {booking.discount}% Off</div>
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
