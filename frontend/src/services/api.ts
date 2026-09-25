import axios from 'axios';
import { Vehicle, Reservation, PriceBreakdown } from '../types';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  let url = envUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  if (!url.includes('.')) {
    url = `${url}.onrender.com`;
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 105000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchVehicles = async (params: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  type?: string;
  transmission?: string;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
}): Promise<Vehicle[]> => {
  const response = await api.get<Vehicle[]>('/vehicles/search', { params });
  return response.data;
};

export const getAllVehicles = async (): Promise<Vehicle[]> => {
  const response = await api.get<Vehicle[]>('/vehicles');
  return response.data;
};

export const getVehicleDetails = async (id: string): Promise<Vehicle> => {
  const response = await api.get<Vehicle>(`/vehicles/${id}`);
  return response.data;
};

export const checkAvailability = async (payload: {
  vehicleId: string;
  startDate: string;
  endDate: string;
}) => {
  const response = await api.post('/vehicles/check-availability', payload);
  return response.data;
};

export const calculateRentalPrice = async (payload: {
  vehicleId: string;
  startDate: string;
  endDate: string;
}): Promise<PriceBreakdown> => {
  const response = await api.post<PriceBreakdown>('/vehicles/calculate-price', payload);
  return response.data;
};

export const createReservation = async (payload: {
  vehicleId: string;
  userId?: string;
  startDate: string;
  endDate: string;
}) => {
  const response = await api.post('/reservations', payload);
  return response.data;
};

export const getMyReservations = async (userId = 'usr-demo-001'): Promise<Reservation[]> => {
  const response = await api.get<Reservation[]>('/reservations', { params: { userId } });
  return response.data;
};

export const sendChatMessage = async (payload: {
  message: string;
  selectedVehicleId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userId?: string;
  userLat?: number;
  userLng?: number;
}) => {
  const response = await api.post('/ai/chat', payload);
  return response.data;
};

export const confirmAiBooking = async (token: string) => {
  const response = await api.post('/ai/confirm-reservation', { token });
  return response.data;
};
