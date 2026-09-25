import { useSearchLocation } from '../context/SearchLocation';
import React, { useState, useEffect, useRef } from 'react';
import { Vehicle } from '../types';
import { searchVehicles } from '../services/api';
import { VehicleCard } from '../components/VehicleCard';
import { Filter, SlidersHorizontal, RefreshCw, ChevronDown, Check, Calendar } from 'lucide-react';

interface VehiclesProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBookVehicle: (vehicle: Vehicle) => void;
}

interface CustomSelectProps {
  label: string;
  value: string | number;
  options: { label: string; value: string | number }[];
  onChange: (val: any) => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, options, onChange }) => {
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

  const selectedOption = options.find((o) => String(o.value) === String(value)) || options[0];

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <label className="block text-slate-500 font-semibold text-xs mb-1.5">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50/80 border ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/10 bg-white' : 'border-slate-200/90'
        } rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-all text-xs font-semibold text-slate-800 shadow-2xs`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-56 overflow-y-auto no-scrollbar">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3.5 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Vehicles: React.FC<VehiclesProps> = ({ onSelectVehicle, onBookVehicle }) => {
  const { location } = useSearchLocation();
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<string>('');
  const [transmission, setTransmission] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [radiusKm, setRadiusKm] = useState<number>(30);

  useEffect(() => {
    fetchVehicles();
  }, [type, transmission, maxPrice, radiusKm, location, startDate, endDate]);

  const fetchVehicles = async () => {
    if (!!startDate !== !!endDate) {
      setError('Select both pickup and return dates.');
      setVehicles([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await searchVehicles({
        lat: location.lat,
        lng: location.lng,
        type: type || undefined,
        transmission: transmission || undefined,
        maxPrice,
        radiusKm,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setVehicles(data);
    } catch (e) {
      setError('Could not load vehicles. Check the API connection and try again.');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypeOptions = [
    { label: 'All Types', value: '' },
    { label: 'SUV', value: 'SUV' },
    { label: 'Sedan', value: 'Sedan' },
    { label: 'Hatchback', value: 'Hatchback' },
    { label: 'Bike / Scooter', value: 'Bike' },
  ];

  const transmissionOptions = [
    { label: 'All Transmissions', value: '' },
    { label: 'Automatic', value: 'Automatic' },
    { label: 'Manual', value: 'Manual' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700 text-xs font-semibold">{error}</p>}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">All Rental Vehicles</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Explore available SUVs, Sedans, Hatchbacks, and Bikes around Indore
          </p>
        </div>

        <button
          onClick={fetchVehicles}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          {/* Custom Type Filter */}
          <CustomSelect
            label="Vehicle Type"
            value={type}
            options={vehicleTypeOptions}
            onChange={(val) => setType(val)}
          />

          {/* Custom Transmission Filter */}
          <CustomSelect
            label="Transmission"
            value={transmission}
            options={transmissionOptions}
            onChange={(val) => setTransmission(val)}
          />

          {/* Max Price Slider */}
          <div className="flex flex-col justify-between">
            <div className="flex justify-between text-slate-500 font-semibold text-xs mb-1.5">
              <span>Max Price</span>
              <span className="text-blue-600 font-bold">₹{maxPrice}/day</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="250"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer my-auto"
            />
          </div>

          {/* Radius Slider */}
          <div className="flex flex-col justify-between">
            <div className="flex justify-between text-slate-500 font-semibold text-xs mb-1.5">
              <span>Search Radius</span>
              <span className="text-cyan-600 font-bold">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer my-auto"
            />
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-500 font-semibold text-xs mb-1.5">Pickup time</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200/90 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold text-xs mb-1.5">Return time</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200/90 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-white/50 animate-pulse border border-slate-200"></div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-xs font-medium">
          No vehicles match the selected filter combination.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onSelect={onSelectVehicle}
              onBookDirectly={onBookVehicle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
