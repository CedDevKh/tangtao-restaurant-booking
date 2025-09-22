"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { buildApiUrl } from "@/lib/base-url";
import { createBooking } from "@/lib/booking-api";
import { Button } from "@/components/ui/button";

interface BookingFormProps {
  restaurantId: number;
  offerId?: number; // Optional, if you want to support offers
}

export default function BookingForm({ restaurantId, offerId }: BookingFormProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]); // raw offers list
  const [selectedOffer, setSelectedOffer] = useState<string>('');
  const [slots, setSlots] = useState<any[]>([]); // BookingSlot availability
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [dateInitialized, setDateInitialized] = useState(false);

  useEffect(() => {
  async function fetchOffers() {
      try {
  const res = await axios.get(buildApiUrl(`/api/offers/?restaurant=${restaurantId}`));
        const offerList = res.data.results || res.data || [];
        setOffers(offerList);
        
        // If offerId prop is provided, preselect that offer
        if (offerId && offerList.some((offer: any) => offer.id === offerId)) {
          setSelectedOffer(offerId.toString());
        } else if (offerList.length > 0) {
          setSelectedOffer(offerList[0].id.toString());
        }
      } catch (err) {
        setOffers([]);
      }
    }
    fetchOffers();
  }, [restaurantId, offerId]);

  // Initialize date to today on mount
  useEffect(() => {
    if (!dateInitialized) {
      const today = new Date();
      setDate(today.toISOString().split('T')[0]);
      setDateInitialized(true);
    }
  }, [dateInitialized]);

  // Fetch booking slots whenever date, restaurant, guests change
  useEffect(() => {
    async function fetchSlots() {
      if (!date) return;
      try {
  const res = await axios.get(buildApiUrl(`/api/slots/availability/?restaurant=${restaurantId}&date=${date}&party_size=${guests}`));
        const list = res.data.slots || [];
        setSlots(list);
      } catch (e) {
        setSlots([]);
      }
    }
    fetchSlots();
  }, [restaurantId, date, guests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!selectedSlotId) {
        setError('Please select a time slot.');
        setLoading(false);
        return;
      }
      const slotObj = slots.find(s => s.id === selectedSlotId);
      const start = slotObj?.start_time || time; // fallback
      const booking_time = new Date(`${date}T${start}`).toISOString();
      let payload;
      if (offers.length > 0 && selectedOffer && !isNaN(Number(selectedOffer))) {
        payload = {
          offer: Number(selectedOffer),
          booking_time,
          number_of_people: guests,
          slot_id: selectedSlotId,
        };
      } else {
        payload = {
          restaurant: restaurantId,
          booking_time,
          number_of_people: guests,
          slot_id: selectedSlotId,
        };
      }
      console.log('Booking payload:', payload);
      await createBooking(payload);
      setSuccess("Booking successful!");
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 p-6 bg-card border border-border rounded-lg shadow-lg space-y-4 max-w-md">
      <h2 className="text-xl font-bold mb-2 text-foreground">Book a Table</h2>
      {selectedSlotId && selectedOffer && (
        <div className="text-xs p-2 rounded bg-muted text-foreground">
          Discount Strategy: Slot % takes priority over Offer % (higher applied). Amount discounts apply only if no percentage. Actual applied shown after booking.
        </div>
      )}
      {offers.length > 0 && (
        <div>
          <label className="block mb-2 text-sm font-medium text-foreground">Select Offer</label>
          <select
            value={selectedOffer}
            onChange={e => setSelectedOffer(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            required
            disabled={offers.length === 0}
          >
            {offers.length === 0 && <option value="">No offers available</option>}
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>{offer.title || offer.name || `Offer #${offer.id}`}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block mb-2 text-sm font-medium text-foreground">Date</label>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          required 
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-foreground">Time Slots</label>
        <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1 border rounded-md">
          {slots.map(slot => {
            const status = slot.effective_status;
            const disabled = status !== 'open';
            const selected = selectedSlotId === slot.id;
            const discount = slot.discount_percentage;
            return (
              <button
                type="button"
                key={slot.id}
                disabled={disabled}
                onClick={() => { if (!disabled) { setSelectedSlotId(slot.id); setTime(slot.start_time); }}}
                className={`text-xs border rounded p-2 flex flex-col items-center justify-center transition ${selected ? 'bg-primary text-primary-foreground' : status === 'open' ? 'bg-green-50 dark:bg-green-900/20 hover:border-primary' : 'bg-muted text-muted-foreground'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                title={status}
              >
                <span>{slot.start_time?.slice(0,5)}</span>
                {discount && <span className="font-medium">{discount}%</span>}
                {slot.remaining_capacity !== null && <span className="text-[10px]">{slot.remaining_capacity} left</span>}
              </button>
            );
          })}
          {slots.length === 0 && (
            <div className="col-span-4 text-center text-sm text-muted-foreground py-4">No slots.</div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Select an available slot (green = open).</p>
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-foreground">Number of Guests</label>
        <input 
          type="number" 
          min={1} 
          max={20} 
          value={guests} 
          onChange={e => setGuests(Number(e.target.value))} 
          required 
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
        {loading ? "Booking..." : "Book Now"}
      </Button>
      {offers.length === 0 && (
        <div className="text-muted-foreground text-sm mt-2 p-3 bg-muted rounded-md">
          No special offers available for this restaurant. You can still book a table at regular prices.
        </div>
      )}
      {success && (
        <div className="text-green-600 dark:text-green-400 text-sm mt-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm mt-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          {error}
        </div>
      )}
    </form>
  );
}
