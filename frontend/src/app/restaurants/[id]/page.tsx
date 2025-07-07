import { restaurants } from '@/lib/data';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Star, MapPin, Clock, Phone, Utensils, Tag } from 'lucide-react';
import Link from 'next/link';

export default function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const restaurant = restaurants.find(r => r.id === params.id);

  if (!restaurant) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Carousel className="w-full rounded-lg overflow-hidden shadow-lg mb-8">
            <CarouselContent>
                {Array.from({ length: 3 }).map((_, index) => (
                <CarouselItem key={index}>
                    <Image
                    src={restaurant.imageUrl.replace('.png', `_${index+1}.png`)}
                    alt={`Photo of ${restaurant.name} ${index + 1}`}
                    width={1200}
                    height={600}
                    className="w-full h-[400px] object-cover"
                    data-ai-hint={restaurant.dataAiHint}
                    />
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
        </Carousel>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <Badge variant="secondary" className="mb-2">{restaurant.cuisine}</Badge>
                                <CardTitle className="font-headline text-4xl">{restaurant.name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 text-2xl font-bold text-amber-400">
                                <Star className="h-7 w-7 fill-current" />
                                <span>{restaurant.rating}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground pt-2">
                            <MapPin className="h-5 w-5" />
                            <span>{restaurant.location}</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p>{restaurant.description}</p>
                         <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{restaurant.openingHours}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>+1 234 567 890</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2"><Utensils /> Menu</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ul className="space-y-3">
                            {restaurant.menu.map(item => (
                                <li key={item.name} className="flex justify-between border-b border-dashed pb-2">
                                    <span>{item.name}</span>
                                    <span className="font-semibold">{item.price}</span>
                                </li>
                            ))}
                       </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Reviews</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {restaurant.reviews.map(review => (
                            <div key={review.user} className="border-b pb-4 last:border-b-0">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-semibold">{review.user}</p>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current"/>)}
                                        {[...Array(5-review.rating)].map((_, i) => <Star key={i} className="h-4 w-4"/>)}
                                    </div>
                                </div>
                                <p className="text-muted-foreground">{review.comment}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

            </div>
            <div className="md:col-span-1">
                 <Card className="sticky top-24">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Book a Table</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <p className="font-semibold">Available today:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {restaurant.discounts.map(slot => (
                                <Button asChild key={slot.time} variant="outline" className="flex-col h-auto">
                                   <Link href={`/book/${restaurant.id}?time=${slot.time}`}>
                                    <span className="text-lg font-bold">{slot.time}</span>
                                    <Badge className="mt-1 bg-accent text-accent-foreground">{slot.discount}% Off</Badge>
                                   </Link>
                                </Button>
                            ))}
                             <Button asChild variant="outline" className="flex-col h-auto">
                                <Link href={`/book/${restaurant.id}?time=19:00`}>
                                    <span className="text-lg font-bold">19:00</span>
                                 </Link>
                            </Button>
                             <Button asChild variant="outline" className="flex-col h-auto">
                                <Link href={`/book/${restaurant.id}?time=19:30`}>
                                    <span className="text-lg font-bold">19:30</span>
                                 </Link>
                             </Button>
                        </div>
                         <Button className="w-full mt-4">See all times</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
