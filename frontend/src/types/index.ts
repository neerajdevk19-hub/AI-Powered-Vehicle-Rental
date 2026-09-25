export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  description?: string;
  type: string;
  transmission: string;
  fuelType: string;
  seatingCapacity: number;
  pricePerDay: number;
  securityDeposit: number;
  status: string;
  latitude: number;
  longitude: number;
  location: string;
  imageUrl?: string;
  rating: number;
  distanceFromUser?: number;
  recommendationScore?: number;
}

export interface Reservation {
  id: string;
  userId: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  vehicle?: Vehicle;
}

export interface PriceBreakdown {
  vehicleId: string;
  days: number;
  pricePerDay: number;
  basePrice: number;
  gstTaxes: number;
  securityDeposit: number;
  totalPrice: number;
  startDate: string;
  endDate: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  vehicles?: Vehicle[];
  reservation?: Reservation;
  policySources?: Array<{ title: string; category: string; content: string }>;
  toolCalled?: string;
  bookingDraft?: BookingDraft;
}

export interface LocationUpdate {
  vehicleId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface BookingDraft {
  token: string;
  expiresAt: string;
  vehicle: Vehicle;
  pricing: PriceBreakdown;
  startDate: string;
  endDate: string;
}
