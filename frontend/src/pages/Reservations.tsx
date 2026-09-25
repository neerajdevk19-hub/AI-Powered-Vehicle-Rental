import React, { useState, useEffect } from 'react';
import { Reservation } from '../types';
import { getMyReservations } from '../services/api';
import { Calendar, MapPin, CheckCircle2, Clock, Navigation, ArrowRight } from 'lucide-react';
import { formatDateTimeDisplay } from '../utils/date';

interface ReservationsProps {
  onTrackVehicle: (vehicleId: string) => void;
}

export const Reservations: React.FC<ReservationsProps> = ({ onTrackVehicle }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await getMyReservations();
      setReservations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">My Reservations</h1>
        <p className="text-xs text-slate-500 mt-1">View your active bookings and track vehicle live location</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-36 rounded-2xl bg-white/50 animate-pulse border border-slate-200"></div>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No active reservations yet</h3>
          <p className="text-slate-500 text-xs">Search and reserve a vehicle using the AI Assistant or Explore tab!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <img
                  src={res.vehicle?.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80'}
                  alt={res.vehicle?.name || 'Vehicle'}
                  className="w-24 h-20 rounded-xl object-cover bg-white shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">{res.vehicle?.name || 'DriveAI Vehicle'}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                      {res.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-700" />
                    <span>{res.vehicle?.location || 'Indore, MP'}</span>
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-700" />
                      <span>{formatDateTimeDisplay(res.startTime)} → {formatDateTimeDisplay(res.endTime)}</span>
                    </span>
                    <span className="font-mono text-slate-500">ID: {res.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Total Price</div>
                  <div className="text-lg font-extrabold text-emerald-700">₹{res.totalPrice.toLocaleString()}</div>
                </div>

                <button
                  onClick={() => onTrackVehicle(res.vehicleId)}
                  className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Track Live GPS</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
