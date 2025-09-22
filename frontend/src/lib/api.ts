import axios from 'axios';
import { API_BASE_SLASH, buildApiUrl } from './base-url';

// Centralized API base (trailing slash variant for historic concatenations)
const API_URL = API_BASE_SLASH;

// Types for registration and user data
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_of_birth?: string;
  user_type: 'diner' | 'restaurant_owner';
  marketing_consent: boolean;
  terms_accepted: boolean;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  user_type: string;
  email_verified: boolean;
  phone_verified: boolean;
  marketing_consent: boolean;
  is_staff: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  const fullUrl = `${API_URL}auth/register/`;
  console.log('Registration URL:', fullUrl);
  
  try {
    const response = await axios.post(fullUrl, userData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const { user, token, message } = response.data;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    console.log('Registration successful:', message);
    
    return response.data;
  } catch (error: any) {
    console.error('Registration failed:', error);
    console.error('Error response:', error.response);
    
    if (error.response?.status === 400) {
      // Handle validation errors
      const errors = error.response.data;
      const errorMessages = [];
      
      for (const [field, messages] of Object.entries(errors)) {
        if (Array.isArray(messages)) {
          errorMessages.push(...messages);
        } else {
          errorMessages.push(messages as string);
        }
      }
      
      throw new Error(errorMessages.join(' '));
    }
    
    throw new Error(error.response?.data?.error || error.message || 'Registration failed');
  }
};

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const fullUrl = `${API_URL}auth/login/`;
  console.log('[auth] Resolved API_BASE_SLASH:', API_URL);
  console.log('[auth] Full login URL:', fullUrl);
  
  try {
    const response = await axios.post(fullUrl, {
      username,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    const { user, token, message } = response.data;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    console.log('Login successful:', message);
    
    return response.data;
  } catch (error: any) {
    console.error('Login failed with error:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Request config:', error.config);
    
    if (error.response?.status === 404) {
      throw new Error(`API endpoint not found. Tried: ${fullUrl}`);
    }
    
    if (error.response?.status === 401) {
      const errorData = error.response.data;
      if (errorData.non_field_errors) {
        throw new Error(errorData.non_field_errors[0]);
      }
      throw new Error(errorData.error || 'Invalid credentials');
    }
    
    throw new Error(error.response?.data?.error || error.message || 'Login failed');
  }
};

export const getAuthToken = (): string | null => {
  return typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
};

export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const logout = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  console.log('Logged out, token and user data removed.');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken() && !!getUser();
};

// You can add more API functions here, e.g., for fetching data with authentication
export const fetchProtectedData = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  try {
  const response = await axios.get(buildApiUrl(`/users/`), {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch protected data:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch protected data');
  }
};
