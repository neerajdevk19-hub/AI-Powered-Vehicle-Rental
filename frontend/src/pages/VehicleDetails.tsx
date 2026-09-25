import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, PriceBreakdown, Reservation } from '../types';
import { checkAvailability, calculateRentalPrice, createReservation } from '../services/api';
import { Calendar, MapPin, Gauge, Fuel, Users, Star, ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowLeft, CreditCard, Check } from 'lucide-react';

interface VehicleDetailsProps {
  vehicle: Vehicle;
  onBack: () => void;
  onReservationCreated: (reservation: Reservation) => void;
}

interface CustomDateTimePickerProps {
  label: string;
  valueISO: string;
  onChange: (isoStr: string) => void;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ label, valueISO, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateDisplay = (rawStr: string) => {
    try {
      const d = new Date(rawStr);
      if (isNaN(d.getTime())) return rawStr;
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    } catch {
      return rawStr;
    }
  };

  const setPreset = (daysFromNow: number, hour = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    onChange(`${year}-${month}-${day}T${hours}:${mins}`);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 border ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'
        } rounded-xl p-2.5 px-3 flex items-center gap-2.5 cursor-pointer hover:bg-slate-100/70 transition-all`}
      >
        <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          <span className="block text-xs font-bold text-slate-900 truncate">
            {formatDateDisplay(valueISO)}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-4 z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">{label}</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Select Date</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setPreset(0, 10)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              Today 10:00 AM
            </button>
            <button
              onClick={() => setPreset(1, 10)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              Tomorrow 10:00 AM
            </button>
            <button
              onClick={() => setPreset(2, 10)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              In 2 Days
            </button>
            <button
              onClick={() => setPreset(7, 10)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              Next Week
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Custom Date & Time</label>
            <input
              type="datetime-local"
              value={valueISO}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsOpen(false);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply & Close</span>
          </button>
        </div>
      )}
    </div>
  );
};

interface VehicleDetailsProps {
  vehicle: Vehicle;
  onBack: () => void;
  onReservationCreated: (reservation: Reservation) => void;
}

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  onBack,
  onReservationCreated,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const [startDate, setStartDate] = useState<string>(tomorrow.toISOString().split('T')[0] + 'T10:00');
  const [endDate, setEndDate] = useState<string>(dayAfter.toISOString().split('T')[0] + 'T10:00');

  const [availabilityResult, setAvailabilityResult] = useState<{ isAvailable: boolean; message: string } | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [priceRevision, setPriceRevision] = useState(0);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPriceBreakdown(null);
    setAvailabilityResult(null);
    setBookingError(null);
    const load = async () => {
      try {
        const breakdown = await calculateRentalPrice({ vehicleId: vehicle.id,
          startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString() });
        if (!cancelled) setPriceBreakdown(breakdown);
      } catch {
        if (!cancelled) setBookingError('Select a valid pickup and return date to calculate your price.');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [startDate, endDate, vehicle.id, priceRevision]);

  const handleCheckAvailability = async () => {
    setLoadingCheck(true);
    setBookingError(null);
    try {
      const res = await checkAvailability({
        vehicleId: vehicle.id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      setAvailabilityResult(res);
    } catch (e: any) {
      setBookingError(e.response?.data?.message || 'Failed to check availability');
    } finally {
      setLoadingCheck(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!priceBreakdown) return;
    setLoadingBook(true);
    setBookingError(null);
    try {
      const res = await createReservation({
        vehicleId: vehicle.id,
        userId: 'usr-demo-001',
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      onReservationCreated(res.reservation);
    } catch (e: any) {
      setBookingError(e.response?.data?.message || 'Failed to create reservation');
    } finally {
      setLoadingBook(false);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-12 font-sans">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Vehicles</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Vehicle Image & Specs (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl overflow-hidden glass-panel border border-slate-200 shadow-sm relative">
            <img
              src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'}
              alt={vehicle.name}
              className="w-full h-80 sm:h-96 object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-50/80 text-slate-900 backdrop-blur-md">
                {vehicle.type}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-600/90 text-white backdrop-blur-md">
                {vehicle.transmission}
              </span>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950 shadow-sm">
              <Star className="w-4 h-4 fill-slate-950" />
              <span>{vehicle.rating} / 5.0</span>
            </div>
          </div>

          {/* Details & Specs Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{vehicle.name}</h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-700" />
                <span>{vehicle.location}</span>
                {vehicle.distanceFromUser !== undefined && (
                  <span className="text-indigo-700 font-semibold">• {vehicle.distanceFromUser} km from you</span>
                )}
              </p>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {vehicle.description || 'Premium rental vehicle maintained in top condition with full insurance coverage.'}
            </p>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
                <Gauge className="w-5 h-5 text-indigo-700 mx-auto mb-1" />
                <div className="text-[10px] text-slate-500">Transmission</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{vehicle.transmission}</div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
                <Fuel className="w-5 h-5 text-cyan-700 mx-auto mb-1" />
                <div className="text-[10px] text-slate-500">Fuel Type</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{vehicle.fuelType}</div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
                <Users className="w-5 h-5 text-amber-700 mx-auto mb-1" />
                <div className="text-[10px] text-slate-500">Seating</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{vehicle.seatingCapacity} Passengers</div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
                <ShieldCheck className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
                <div className="text-[10px] text-slate-500">Security Deposit</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">₹{vehicle.securityDeposit}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Booking Widget (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-5 sticky top-24">
            <div className="flex items-baseline justify-between border-b border-slate-200/80 pb-4">
              <div>
                <span className="text-2xl font-extrabold text-slate-900">₹{vehicle.pricePerDay.toLocaleString()}</span>
                <span className="text-xs text-slate-500"> / day</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                Available
              </span>
            </div>

            {/* Date Pickers */}
            <div className="space-y-3">
              <CustomDateTimePicker
                label="Pickup Date & Time"
                valueISO={startDate}
                onChange={(val) => setStartDate(val)}
              />

              <CustomDateTimePicker
                label="Return Date & Time"
                valueISO={endDate}
                onChange={(val) => setEndDate(val)}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleCheckAvailability}
                disabled={loadingCheck}
                className="py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                {loadingCheck ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Check Dates'}
              </button>

              <button
                onClick={() => setPriceRevision(value => value + 1)}
                className="py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              >
                Recalculate
              </button>
            </div>

            {/* Availability Alert Result */}
            {availabilityResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  availabilityResult.isAvailable
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
                }`}
              >
                {availabilityResult.isAvailable ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                )}
                <span>{availabilityResult.message}</span>
              </div>
            )}

            {/* Itemized Price Breakdown */}
            {priceBreakdown && (
              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-700 border-b border-slate-200 pb-2 flex justify-between">
                  <span>Billing Breakdown</span>
                  <span className="text-indigo-700">{priceBreakdown.days} Billable Day(s)</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Base Price ({priceBreakdown.days} days x ₹{priceBreakdown.pricePerDay})</span>
                  <span className="text-slate-700 font-semibold">₹{priceBreakdown.basePrice}</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>GST & Platform Taxes (18%)</span>
                  <span className="text-slate-700 font-semibold">₹{priceBreakdown.gstTaxes}</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Refundable Security Deposit</span>
                  <span className="text-slate-700 font-semibold">₹{priceBreakdown.securityDeposit}</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payable</span>
                  <span className="text-emerald-700 text-base">₹{priceBreakdown.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            )}

            {bookingError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Final Reserve Button */}
            <button
              onClick={handleConfirmReservation}
              disabled={loadingBook || !priceBreakdown || availabilityResult?.isAvailable === false}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-sm shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loadingBook ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Confirm Reservation (₹{priceBreakdown?.totalPrice || vehicle.pricePerDay})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
