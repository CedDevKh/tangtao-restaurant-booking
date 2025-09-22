"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PromoCarousel from '@/components/PromoCarousel';
import CategoryChips from '@/components/CategoryChips';
import OfferCard from '@/components/OfferCard';
import BookingSheet from '@/components/BookingSheet';
import FiltersDrawer, { Filters } from '@/components/FiltersDrawer';
import { useBanners, useFilters, useOffersFeed, FeedCard, SlotItem, FeedResponse } from '@/lib/feed-api';

// Eatigo-like Home driven by new feed endpoints

// Central API helper

export default function Home() {
  const { isLoggedIn } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [loadingCityChange, setLoadingCityChange] = useState(false);
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [selectedCard, setSelectedCard] = useState<FeedCard | null>(null);

  useEffect(() => {
    setHasMounted(true);
    // Hydrate persisted city
    try {
      const saved = localStorage.getItem('selected_city');
      if (saved) setFilters(f => ({ ...f, city: saved }));
    } catch {}
  }, []);

  // Watch city changes to persist & show transient skeleton
  useEffect(() => {
    if (!hasMounted) return;
    try {
      if (filters.city) localStorage.setItem('selected_city', filters.city); else localStorage.removeItem('selected_city');
    } catch {}
  }, [filters.city, hasMounted]);

  // Data hooks
  const { data: banners } = useBanners();
  const { data: facets } = useFilters();
  const feedQuery = useMemo(() => ({
    city: filters.city,
    cuisine: filters.cuisine,
    brand: filters.brand,
    min_discount: filters.min_discount,
    time_bucket: filters.time_bucket,
    sort: 'recommended' as const,
  }), [filters]);
  const feed = useOffersFeed(feedQuery);
  const baseItems = useMemo<FeedCard[]>(() => (feed.data ?? []).flatMap((d: FeedResponse) => d.results), [feed.data]);
  // Now rely on server-populated card.city for accurate filtering (server already filters collection)
  const items = useMemo<FeedCard[]>(() => {
    let working = baseItems;
    if (filters.city) {
      const cityLc = filters.city.toLowerCase();
      const norm = (s: string) => s.replace(/riep/g, 'reap');
      working = working.filter(card => {
        const c = card.city?.toLowerCase();
        if (!c) return false;
        return norm(c) === norm(cityLc);
      });
    }
    // Deduplicate by restaurant_id keeping the first (prefer one with offer_id if multiple)
    const seen = new Map<string, FeedCard>();
    for (const card of working) {
      const existing = seen.get(card.restaurant_id);
      if (!existing) {
        seen.set(card.restaurant_id, card);
      } else if (!existing.offer_id && card.offer_id) {
        // Replace placeholder with real offer version
        seen.set(card.restaurant_id, card);
      }
    }
    return Array.from(seen.values());
  }, [baseItems, filters.city]);

  const cuisineChips = useMemo(() => (facets?.cuisines ?? []).map((c: string) => ({ key: c, label: c })), [facets]);

  const onSelectSlot = (slot: SlotItem, card: FeedCard) => {
    setSelectedSlot(slot);
    setSelectedCard(card);
    setSheetOpen(true);
  };

  // We're already using hasMounted above, no need for another mounted state

  return (
    <div className="flex flex-col">
      {/* Top promo banners */}
      {banners && banners.length > 0 && <PromoCarousel items={banners} />}

      {/* Search + location + filters row */}
      <section className="sticky top-0 z-20 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center gap-2">
            <select
              aria-label="City"
              className="h-10 min-w-[9rem] rounded-full border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background"
              value={filters.city || ''}
              onChange={e => {
                const val = e.target.value || undefined;
                setLoadingCityChange(true);
                setFilters({ ...filters, city: val });
                // Give SWR a tick; hide skeleton when first page data returns
                setTimeout(() => setLoadingCityChange(false), 400);
              }}
            >
              <option value="">All cities</option>
              {[
                'Phnom Penh',
                'Siem Reap',
                'Sihanoukville',
                'Battambang',
                'Kampot',
                'Kep',
                'Kampong Cham',
                'Kampong Thom',
                'Poipet'
              ].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              aria-label="Search"
              placeholder="Search restaurants or cuisines"
              className="h-10 flex-1 rounded-full border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background"
              onChange={e => setFilters({ ...filters, brand: e.target.value })}
            />
            <button
              aria-label="Filters"
              className="h-10 shrink-0 rounded-full border bg-background px-4 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background"
              onClick={() => setFiltersOpen(true)}
            >
              Filters
            </button>
          </div>
        </div>
      </section>

      {/* Category chips */}
      <div className="container mx-auto py-2">
        <CategoryChips
          chips={cuisineChips}
          selected={selectedChips}
          onToggle={(k) => {
            const next = new Set(selectedChips);
            if (next.has(k)) next.delete(k); else next.add(k);
            setSelectedChips(next);
            setFilters({ ...filters, cuisine: next.size ? Array.from(next).join(',') : undefined });
          }}
          label="Cuisines"
        />
      </div>

      {/* Reserve Now feed */}
      <section className="container mx-auto px-3 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Reserve Now</h2>
          <select className="rounded border px-2 py-1 text-sm" onChange={e => {/* sort placeholder */}}>
            <option>Recommended</option>
            <option>Highest discount</option>
            <option>Most popular</option>
            <option>Nearest time</option>
          </select>
        </div>
        {/* grid on desktop */}
        <div className="hidden gap-4 md:grid md:grid-cols-3 lg:grid-cols-4">
          {(loadingCityChange && baseItems.length === 0 ? Array.from({ length: 8 }) : items).map((c: any, idx: number) => (
            loadingCityChange && baseItems.length === 0 ? (
              <div key={idx} className="h-64 w-full animate-pulse rounded-lg bg-muted" />
            ) : (
              <OfferCard key={(c.offer_id || 'rest') + '_' + c.restaurant_id} data={c} onSelectSlot={onSelectSlot} />
            )
          ))}
        </div>
        {/* carousel on mobile */}
        <div className="md:hidden no-scrollbar flex snap-x gap-3 overflow-x-auto">
          {(loadingCityChange && baseItems.length === 0 ? Array.from({ length: 4 }) : items).map((c: any, idx: number) => (
            loadingCityChange && baseItems.length === 0 ? (
              <div key={idx} className="min-w-[85%] snap-start h-60 rounded-lg bg-muted animate-pulse" />
            ) : (
              <div className="min-w-[85%] snap-start" key={(c.offer_id || 'rest') + '_' + c.restaurant_id}>
                <OfferCard data={c} onSelectSlot={onSelectSlot} />
              </div>
            )
          ))}
        </div>
        {/* Infinite Load */}
        <div className="mt-4 flex justify-center">
          {feed.isValidating ? <div className="text-sm text-muted-foreground">Loading…</div> : (feed.data && feed.data[feed.data.length-1]?.next_cursor ? (
            <button className="rounded border px-4 py-2" onClick={() => feed.setSize((s: number) => s + 1)}>Load more</button>
          ) : <div className="text-sm text-muted-foreground">End of results</div>)}
        </div>
      </section>

      <FiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} filters={filters} setFilters={setFilters} facets={facets} />
      <BookingSheet open={sheetOpen} onOpenChange={setSheetOpen} slot={selectedSlot} card={selectedCard} />
    </div>
  );
}
