import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { getAllVehicles } from '../services/api';
import { MapView } from '../components/MapView';
import { Navigation, Car, Signal, MapPin } from 'lucide-react';

interface LiveTrackingProps {
  initialVehicleId?: string;
}

const DEFAULT_TRACKING_VEHICLES: Vehicle[] = [
  {
    id: 'veh-001',
    name: 'Mahindra Thar',
    brand: 'Mahindra',
    description: 'Rugged 4x4 automatic SUV',
    type: 'SUV',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seatingCapacity: 4,
    pricePerDay: 2900,
    securityDeposit: 3000,
    status: 'available',
    latitude: 22.7533,
    longitude: 75.8937,
    location: 'Vijay Nagar, Indore',
    distanceFromUser: 4.2,
    rating: 4.4,
  },
  {
    id: 'veh-002',
    name: 'Hyundai Creta',
    brand: 'Hyundai',
    description: 'Feature-loaded automatic SUV',
    type: 'SUV',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seatingCapacity: 5,
    pricePerDay: 2500,
    securityDeposit: 2500,
    status: 'available',
    latitude: 22.7244,
    longitude: 75.8839,
    location: 'Palasia, Indore',
    distanceFromUser: 2.4,
    rating: 4.6,
  },
  {
    id: 'veh-005',
    name: 'Toyota Innova',
    brand: 'Toyota',
    description: 'Spacious 7-seater MPV',
    type: 'MPV',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seatingCapacity: 7,
    pricePerDay: 2800,
    securityDeposit: 3000,
    status: 'available',
    latitude: 22.7667,
    longitude: 75.8333,
    location: 'Super Corridor, Indore',
    distanceFromUser: 3.8,
    rating: 4.3,
  },
];

export const LiveTracking: React.FC<LiveTrackingProps> = ({ initialVehicleId }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_TRACKING_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(
    initialVehicleId || DEFAULT_TRACKING_VEHICLES[0].id
  );

  useEffect(() => {
    getAllVehicles()
      .then((data) => {
        if (data && data.length > 0) {
          setVehicles(data);
          if (!selectedVehicleId) {
            setSelectedVehicleId(data[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <div className="h-[calc(100vh-5.5rem)] min-h-[550px] flex flex-col space-y-4 font-sans pb-4">
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Navigation className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-900">Live Vehicle GPS Tracking</h1>
            <p className="text-xs text-slate-500 font-medium">Real-time WebSocket telemetry · Updates every 3 seconds</p>
          </div>
        </div>

        {/* Select Active Vehicle dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-600 font-bold hidden sm:block">Select Tracked Vehicle:</label>
          <select
            value={selectedVehicleId || ''}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="bg-slate-50 border border-slate-200/90 text-slate-800 font-bold rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 shadow-2xs"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.type}) - {v.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm relative min-h-[480px]">
        <MapView
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={(v) => setSelectedVehicleId(v.id)}
        />
      </div>
    </div>
  );
};
