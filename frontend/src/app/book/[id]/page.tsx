"use client";

import { useSearchParams } from 'next/navigation';
import { restaurants } from '@/lib/data';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, Percent, User, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function BookPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const time = searchParams.get('time') || '19:00';
  const restaurant = restaurants.find(r => r.id === params.id);
  const discount = restaurant?.discounts.find(d => d.time === time)?.discount || 0;

  if (!restaurant) {
    return (
        <div className="container mx-auto flex h-screen flex-col items-center justify-center text-center">
            <h1 className="font-headline text-4xl">Restaurant not found</h1>
            <p className="mt-4 text-muted-foreground">The restaurant you are looking for does not exist.</p>
            <Button asChild className="mt-6">
                <Link href="/restaurants">Back to Restaurants</Link>
            </Button>
        </div>
    );
  }

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
                            <Image src={restaurant.imageUrl} alt={restaurant.name} width={80} height={80} className="rounded-lg object-cover" data-ai-hint={restaurant.dataAiHint} />
                            <div>
                                <h3 className="font-semibold">{restaurant.name}</h3>
                                <p className="text-sm text-muted-foreground">{restaurant.location}</p>
                            </div>
                        </div>
                        <div className="space-y-2 border-t pt-4">
                             <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Date</span>
                                <span>Today, July 26, 2024</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Time</span>
                                <span>{time}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> Guests</span>
                                <span>2 people</span>
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
                            <Label htmlFor="guests">Number of Guests</Label>
                            <Select defaultValue="2">
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
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="John Doe" />
                        </div>
                         <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="you@example.com" />
                        </div>
                         <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg">Confirm Booking</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  );
}
