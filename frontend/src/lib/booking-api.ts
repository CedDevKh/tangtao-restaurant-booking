import axios from 'axios';
import { getAuthToken } from './api';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

export interface BookingPayload {
  offer: number; // Offer ID
  booking_time: string; // ISO string
  number_of_people: number;
}

export interface BookingResponse {
  id: number;
  offer: number;
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
  const response = await axios.post(`${API_URL}/api/bookings/`, payload, {
    headers: { 'Authorization': `Token ${token}` }
  });
  return response.data;
};

export const getUserBookings = async (): Promise<BookingResponse[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const response = await axios.get(`${API_URL}/api/bookings/`, {
    headers: { 'Authorization': `Token ${token}` }
  });
  return response.data;
};

export const getAllBookings = async (): Promise<BookingResponse[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  
  console.log('getAllBookings: Making request with token:', token ? 'present' : 'missing');
  
  try {
    const response = await axios.get(`${API_URL}/api/bookings/`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    console.log('getAllBookings: Response received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getAllBookings: Error occurred:', error);
    console.error('getAllBookings: Error response:', error.response?.data);
    console.error('getAllBookings: Error status:', error.response?.status);
    throw error;
  }
};

export const updateBookingStatus = async (id: number, status: string): Promise<BookingResponse> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const response = await axios.patch(`${API_URL}/api/bookings/${id}/`, { status }, {
    headers: { 'Authorization': `Token ${token}` }
  });
  return response.data;
};
