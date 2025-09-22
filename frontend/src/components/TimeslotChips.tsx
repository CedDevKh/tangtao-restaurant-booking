"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getAuthToken } from "@/lib/api";
import { buildApiUrl } from "@/lib/base-url";

type TimeslotEntry = {
  time: string;
  discount_percent: number | null;
  source: "slot" | "offer" | "both";
  slot_id?: number | null;
  offer_id?: number | null;
};

export function TimeslotChips({ restaurantId, limit = 6 }: { restaurantId: number | string; limit?: number }) {
  // Centralized base URL
  const [slots, setSlots] = useState<TimeslotEntry[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    let ignore = false;
    async function fetchSlots() {
      try {
        const token = getAuthToken();
        const res = await fetch(
          buildApiUrl(`/api/offers/timeslots/?restaurant=${restaurantId}&date=${todayIso}&limit=${limit}`),
          { headers: token ? { Authorization: `Token ${token}` } : undefined, cache: "no-store" }
        );
        const data = await res.json().catch(() => null);
        if (!ignore) {
          if (res.ok && data?.timeslots) setSlots(data.timeslots as TimeslotEntry[]);
          setLoaded(true);
        }
      } catch {
        if (!ignore) setLoaded(true);
      }
    }
    fetchSlots();
    return () => {
      ignore = true;
    };
  }, [restaurantId, todayIso, limit]);

  if (!loaded || !slots || slots.length === 0) return null;

  return (
    <div className="flex w-full flex-wrap gap-2">
      {slots.map((s) => (
        <Link key={`${s.time}-${s.offer_id ?? ""}-${s.slot_id ?? ""}`} href={`/restaurants/${restaurantId}?time=${encodeURIComponent(s.time)}`} prefetch={false}>
          <Badge className="rounded-md bg-red-500 px-3 py-1 text-xs font-bold text-white hover:bg-red-600">
            <span>{s.time}</span>
            <span className="ml-2">{s.discount_percent ? `-${Math.round(s.discount_percent)}%` : "OFFER"}</span>
          </Badge>
        </Link>
      ))}
    </div>
  );
}

export default TimeslotChips;
