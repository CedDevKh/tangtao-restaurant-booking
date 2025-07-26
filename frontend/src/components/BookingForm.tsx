"use client";
import { useState, useEffect } from "react";
import axios from "axios";
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
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<string>('');

  useEffect(() => {
    async function fetchOffers() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
        const res = await axios.get(`${API_URL}/api/offers/?restaurant=${restaurantId}`);
        const offerList = res.data.results || res.data || [];
        setOffers(offerList);
        if (offerList.length > 0) {
          setSelectedOffer(offerList[0].id.toString());
        }
      } catch (err) {
        setOffers([]);
      }
    }
    fetchOffers();
  }, [restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const booking_time = new Date(`${date}T${time}`).toISOString();
      let payload;
      if (offers.length > 0 && selectedOffer && !isNaN(Number(selectedOffer))) {
        payload = {
          offer: Number(selectedOffer),
          booking_time,
          number_of_people: guests,
        };
      } else {
        payload = {
          restaurant: restaurantId,
          booking_time,
          number_of_people: guests,
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
    <form onSubmit={handleSubmit} className="mt-8 p-6 bg-gray-900 rounded-lg shadow space-y-4 max-w-md">
      <h2 className="text-xl font-bold mb-2">Book a Table</h2>
      <div>
        <label className="block mb-1">Date</label>
            <div>
                <label className="block mb-1">Offer</label>
                <select
                    value={selectedOffer}
                    onChange={e => setSelectedOffer(e.target.value)}
                    className="input"
                    required
                    disabled={offers.length === 0}
                >
                    {offers.length === 0 && <option value="">No offers available</option>}
                    {offers.map((offer) => (
                        <option key={offer.id} value={offer.id}>{offer.title || offer.name || `Offer #${offer.id}`}</option>
                    ))}
                </select>
            </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-2 py-1 rounded bg-gray-800 text-white" />
      </div>
      <div>
        <label className="block mb-1">Time</label>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full px-2 py-1 rounded bg-gray-800 text-white" />
      </div>
      <div>
        <label className="block mb-1">Guests</label>
        <input type="number" min={1} max={20} value={guests} onChange={e => setGuests(Number(e.target.value))} required className="w-full px-2 py-1 rounded bg-gray-800 text-white" />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-yellow-400 text-black font-bold hover:bg-yellow-500">
        {loading ? "Booking..." : "Book Now"}
      </Button>
      {offers.length === 0 && <div className="text-muted-foreground text-sm mt-2">No offers available for this restaurant. You can still book a table.</div>}
      {success && <div className="text-green-400 text-sm mt-2">{success}</div>}
      {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
    </form>
  );
}
