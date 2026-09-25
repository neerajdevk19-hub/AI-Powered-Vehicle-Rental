import { API_BASE_URL } from '../services/api';
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';
import { Vehicle } from '../types';
import { MapPin, Navigation, Signal } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  centerLat?: number;
  centerLng?: number;
}

// Custom Leaflet DivIcon generator
const createCustomIcon = (isSelected: boolean, type: string) => {
  const isBike = type.toLowerCase() === 'bike';
  const colorClass = isSelected
    ? 'bg-blue-600 border-white ring-4 ring-blue-500/40'
    : isBike
    ? 'bg-amber-500 border-white'
    : 'bg-indigo-600 border-white';

  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div class="w-9 h-9 rounded-full ${colorClass} border-2 text-white flex items-center justify-center font-bold text-sm shadow-md transition-transform hover:scale-125">
      ${isBike ? '🏍️' : '🚗'}
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
}

// Offset loop route for smooth frontend simulated GPS updates
const SIMULATION_OFFSETS = [
  [0, 0],
  [0.0004, 0.0002],
  [0.0007, 0.0005],
  [0.0004, 0.0008],
  [0, 0.0006],
  [-0.0003, 0.0003],
];

export const MapView: React.FC<MapViewProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  centerLat = 22.7196,
  centerLng = 75.8577,
}) => {
  const [vehicleLocations, setVehicleLocations] = useState<Record<string, { lat: number; lng: number }>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [simStep, setSimStep] = useState(0);

  useEffect(() => {
    // Initialize initial locations from vehicles prop
    const locs: Record<string, { lat: number; lng: number }> = {};
    vehicles.forEach((v) => {
      locs[v.id] = { lat: v.latitude, lng: v.longitude };
    });
    setVehicleLocations(locs);
  }, [vehicles]);

  // Socket.io real-time connection
  useEffect(() => {
    const socket: Socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('vehicleLocationUpdate', (data: { vehicleId: string; lat: number; lng: number; timestamp: string }) => {
      setVehicleLocations((prev) => ({
        ...prev,
        [data.vehicleId]: { lat: data.lat, lng: data.lng },
      }));
      setLastUpdated(new Date(data.timestamp).toLocaleTimeString());
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Frontend simulation timer fallback for instant visual GPS updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSimStep((step) => {
        const nextStep = step + 1;
        setVehicleLocations((prevLocs) => {
          const updated = { ...prevLocs };
          vehicles.forEach((v, idx) => {
            const originLat = v.latitude;
            const originLng = v.longitude;
            const offset = SIMULATION_OFFSETS[(nextStep + idx) % SIMULATION_OFFSETS.length];
            updated[v.id] = {
              lat: Number((originLat + offset[0]).toFixed(6)),
              lng: Number((originLng + offset[1]).toFixed(6)),
            };
          });
          return updated;
        });
        setLastUpdated(new Date().toLocaleTimeString());
        return nextStep;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [vehicles]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const currentCenter: [number, number] = selectedVehicle && vehicleLocations[selectedVehicle.id]
    ? [vehicleLocations[selectedVehicle.id].lat, vehicleLocations[selectedVehicle.id].lng]
    : [centerLat, centerLng];

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 flex flex-col font-sans">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-700 pointer-events-auto border border-slate-200/80 shadow-md">
          <Signal className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-blue-600 animate-pulse'}`} />
          <span>GPS Tracking: {isConnected ? 'LIVE WEBSOCKET' : 'SIMULATED LIVE'}</span>
          {lastUpdated && <span className="text-slate-400 text-[10px] ml-1">({lastUpdated})</span>}
        </div>

        <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-600 pointer-events-auto border border-slate-200/80 shadow-md">
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span>{vehicles.length || 6} Active GPS Trackers</span>
        </div>
      </div>

      {selectedVehicle && (
        <div className="absolute bottom-5 left-4 z-20 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-3.5 text-xs shadow-lg space-y-1 max-w-xs">
          <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{selectedVehicle.name}</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Lat: <span className="font-mono text-slate-800">{(vehicleLocations[selectedVehicle.id]?.lat ?? selectedVehicle.latitude).toFixed(6)}</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Lng: <span className="font-mono text-slate-800">{(vehicleLocations[selectedVehicle.id]?.lng ?? selectedVehicle.longitude).toFixed(6)}</span>
          </p>
          <p className="text-[10px] text-slate-400 pt-1 font-medium border-t border-slate-100">
            Last GPS ping: {lastUpdated || 'Updating...'}
          </p>
        </div>
      )}

      <MapContainer
        center={currentCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <ChangeView center={currentCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render markers for each vehicle */}
        {vehicles.map((v) => {
          const loc = vehicleLocations[v.id] || { lat: v.latitude, lng: v.longitude };
          const isSelected = v.id === selectedVehicleId;

          return (
            <Marker
              key={v.id}
              position={[loc.lat, loc.lng]}
              icon={createCustomIcon(isSelected, v.type)}
              eventHandlers={{
                click: () => onSelectVehicle && onSelectVehicle(v),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px] space-y-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{v.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{v.location}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-extrabold text-blue-600 text-sm">₹{v.pricePerDay}/day</span>
                    <button
                      onClick={() => onSelectVehicle && onSelectVehicle(v)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
                    >
                      Track
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
