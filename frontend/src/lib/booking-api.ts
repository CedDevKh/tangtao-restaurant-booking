import axios from 'axios';
import { getAuthToken } from './api';
import { buildApiUrl } from './base-url';

export interface BookingPayload {
  offer?: number; // Offer ID (optional)
  restaurant?: number; // Restaurant ID (optional, used when no offer)
  booking_time: string; // ISO string
  number_of_people: number;
  slot_id?: number; // BookingSlot ID
}

export interface BookingResponse {
  id: number;
  offer?: number | null;
  restaurant?: number | null;
  booking_time: string;
  number_of_people: number;
  status: string;
  created_at: string;
  updated_at: string;
  diner: any;
  offer_title: string;
  restaurant_name: string;
}

export const createBooking = async (payload: BookingPayload): Promise<BookingResponse> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const response = await axios.post(buildApiUrl(`/api/bookings/`), payload, {
    headers: { 'Authorization': `Token ${token}` }
  });
  return response.data;
};

export const getUserBookings = async (): Promise<BookingResponse[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const response = await axios.get(buildApiUrl(`/api/bookings/`), {
    headers: { 'Authorization': `Token ${token}` }
  });
  return response.data;
};

export const getAllBookings = async (): Promise<BookingResponse[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  
  console.log('getAllBookings: Making request with token:', token ? 'present' : 'missing');
  
  try {
  const response = await axios.get(buildApiUrl(`/api/bookings/`), {
      headers: { 'Authorization': `Token ${token}` }
    });
    console.log('getAllBookings: Response received:', response.data);
    return response.data;
  } catch (error: any) {
    // Provide clearer diagnostics for common local dev issues
    if (error.code === 'ERR_NETWORK') {
      console.error('getAllBookings: Network error (likely backend not running or CORS issue).');
  console.error(`Attempted URL: ${buildApiUrl('/api/bookings/')}`);
    }
    console.error('getAllBookings: Error occurred:', error.message || error);
    if (error.response) {
      console.error('getAllBookings: Error status:', error.response.status);
      console.error('getAllBookings: Error data:', error.response.data);
    }
    throw error;
  }
};

export const updateBookingStatus = async (id: number, status: string): Promise<BookingResponse> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const response = await axios.patch(buildApiUrl(`/api/bookings/${id}/`), { status }, {
    headers: { 'Authorization': `Token ${token}` }
  });
  return response.data;
};
