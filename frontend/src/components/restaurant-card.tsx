import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Restaurant } from "@/lib/types";
import { Star, MapPin } from "lucide-react";

type RestaurantCardProps = {
  restaurant: Restaurant;
};

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const firstDiscount = restaurant.discounts[0];

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-xl">
      <CardHeader className="p-0">
        <Link href={`/restaurants/${restaurant.id}`} className="block">
          <Image
            src={restaurant.imageUrl}
            alt={`Photo of ${restaurant.name}`}
            width={600}
            height={400}
            className="h-48 w-full object-cover"
            data-ai-hint={restaurant.dataAiHint}
          />
        </Link>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="flex items-start justify-between">
            <CardTitle className="mb-2 font-headline text-xl leading-tight">
                <Link href={`/restaurants/${restaurant.id}`} className="hover:text-primary">
                    {restaurant.name}
                </Link>
            </CardTitle>
            <div className="flex items-center gap-1 text-sm font-semibold text-amber-400">
                <Star className="h-4 w-4 fill-current" />
                <span>{restaurant.rating}</span>
            </div>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
            <p>{restaurant.cuisine}</p>
            <p className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.location}</span>
            </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {firstDiscount && (
           <Link href={`/restaurants/${restaurant.id}`} className="w-full">
                <Badge className="w-full justify-center bg-accent py-2 text-lg font-bold text-accent-foreground hover:bg-accent/80">
                    {firstDiscount.discount}% off at {firstDiscount.time}
                </Badge>
            </Link>
        )}
      </CardFooter>
    </Card>
  );
}
