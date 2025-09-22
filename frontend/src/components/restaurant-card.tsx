"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Restaurant } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { Star, MapPin } from "lucide-react";
import { getAuthToken } from "@/lib/api";
import { buildApiUrl } from "@/lib/base-url";

type RestaurantCardProps = {
  restaurant: Restaurant;
};

// Centralized base URL helper ensures consistent CORS + no trailing slash issues

type TimeslotEntry = { time: string; discount_percent: number | null; source: 'slot'|'offer'|'both'; slot_id?: number|null; offer_id?: number|null };

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [slots, setSlots] = useState<TimeslotEntry[] | null>(null);
  const todayIso = useMemo(()=> new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    let ignore = false;
    const fetchSlots = async () => {
      try {
        const token = getAuthToken();
  const res = await fetch(buildApiUrl(`/api/offers/timeslots/?restaurant=${restaurant.id}&date=${todayIso}&limit=6`), {
          headers: token ? { 'Authorization': `Token ${token}` } : undefined,
          cache: 'no-store',
        });
        const data = await res.json().catch(()=>null);
        if (!ignore && res.ok && data?.timeslots) {
          setSlots(data.timeslots as TimeslotEntry[]);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchSlots();
    return () => { ignore = true; };
  }, [restaurant.id, todayIso]);

  // Determine image source: prefer cover_image_url if exposed by API, else imageUrl field
  const rawImg: any = (restaurant as any).cover_image_url || (restaurant as any).image_url || (restaurant as any).imageUrl;
  const img = mediaUrl(rawImg);
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-xl border border-neutral-800">
      <CardHeader className="p-0 relative h-48 w-full bg-neutral-900">
        <Link href={`/restaurants/${restaurant.id}`} className="block h-full w-full relative">
          {img ? (
            <img
              src={img}
              alt={`Photo of ${restaurant.name}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                console.warn('[restaurant-card] image load error', restaurant.id, img);
                const el = e.currentTarget;
                el.style.opacity = '0.25';
                const badge = document.createElement('div');
                badge.textContent = 'Image failed';
                badge.className = 'absolute inset-0 flex items-center justify-center text-xs font-semibold text-red-400 bg-neutral-950/70';
                el.parentElement?.appendChild(badge);
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-red-400 bg-neutral-950/70">
              No image
            </div>
          )}
        </Link>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="flex items-start justify-between">
            <CardTitle className="mb-2 font-headline text-xl leading-tight">
                <Link href={`/restaurants/${restaurant.id}`} className="hover:text-primary">
                    {restaurant.name}
                </Link>
            </CardTitle>
            <div className="flex items-center gap-1 text-sm font-semibold text-yellow-500">
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
        {slots && slots.length > 0 ? (
          <div className="flex w-full flex-wrap gap-2">
            {slots.map((s) => (
              <Link key={`${s.time}-${s.offer_id ?? ''}-${s.slot_id ?? ''}`} href={`/restaurants/${restaurant.id}?time=${encodeURIComponent(s.time)}`} prefetch={false}>
                <Badge className="rounded-md bg-red-500 px-3 py-1 text-xs font-bold text-white hover:bg-red-600">
                  <span>{s.time}</span>
                  <span className="ml-2">{s.discount_percent ? `-${Math.round(s.discount_percent)}%` : 'OFFER'}</span>
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <div className="w-full text-center text-xs text-muted-foreground">No timeslot deals today</div>
        )}
      </CardFooter>
    </Card>
  );
}
