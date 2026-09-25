import React, { useState, useEffect, useRef } from 'react';
import { Vehicle } from '../types';
import { searchVehicles } from '../services/api';
import { VehicleCard } from '../components/VehicleCard';
import { useSearchLocation } from '../context/SearchLocation';
import { 
  Sparkles, 
  Search, 
  Calendar, 
  MapPin, 
  Target, 
  SlidersHorizontal, 
  ShieldCheck, 
  Tag, 
  Headphones, 
  Zap, 
  ArrowRight,
  ChevronDown,
  Check
} from 'lucide-react';

interface HomeProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBookVehicle: (vehicle: Vehicle) => void;
  onNavigateAiChat: (query?: string) => void;
}

// Custom Dropdown Component replacing raw browser <select>
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

  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0];

  return (
    <div ref={containerRef} className="relative w-full h-14 select-none">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full bg-slate-50/90 border ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200/90'
        } rounded-xl px-3.5 py-2 flex flex-col justify-center cursor-pointer hover:bg-slate-100/70 transition-all`}
      >
        <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
          {label}
        </span>
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-slate-900 truncate">
            {selectedOption?.label}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-56 overflow-y-auto no-scrollbar">
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
                  isSelected ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
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

// Custom Interactive Date & Time Picker Modal Popover
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
    // Format to datetime-local format: YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    onChange(`${year}-${month}-${day}T${hours}:${mins}`);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full h-14 select-none">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full bg-slate-50/90 border ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200/80'
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

          {/* Quick Presets */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => { setPreset(0, 10); }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              Today 10:00 AM
            </button>
            <button
              onClick={() => { setPreset(1, 10); }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              Tomorrow 10:00 AM
            </button>
            <button
              onClick={() => { setPreset(2, 10); }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              In 2 Days
            </button>
            <button
              onClick={() => { setPreset(7, 10); }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              Next Week
            </button>
          </div>

          {/* Datetime Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Custom Date & Time</label>
            <input
              type="datetime-local"
              value={valueISO}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsOpen(false);
                }
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

export const Home: React.FC<HomeProps> = ({ onSelectVehicle, onBookVehicle, onNavigateAiChat }) => {
  const { location, setLocation } = useSearchLocation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [pickupDateRaw, setPickupDateRaw] = useState('2025-04-25T10:00');
  const [dropoffDateRaw, setDropoffDateRaw] = useState('2025-04-26T10:00');
  const [vehicleType, setVehicleType] = useState('ALL');
  const [transmission, setTransmission] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [radiusKm, setRadiusKm] = useState<number>(10);

  const demoLocations = [
    { label: 'Indore demo center', lat: 22.7196, lng: 75.8577 },
    { label: 'Vijay Nagar, Indore', lat: 22.7533, lng: 75.8937 },
    { label: 'Palasia, Indore', lat: 22.7244, lng: 75.8839 },
    { label: 'Bhanwarkuan, Indore', lat: 22.6950, lng: 75.8670 },
  ];

  const vehicleTypeOptions = [
    { label: 'All Types', value: 'ALL' },
    { label: 'SUV', value: 'SUV' },
    { label: 'Sedan', value: 'Sedan' },
    { label: 'Hatchback', value: 'Hatchback' },
    { label: 'MPV', value: 'MPV' },
    { label: 'Bike', value: 'Bike' },
  ];

  const transmissionOptions = [
    { label: 'All Transmissions', value: 'ALL' },
    { label: 'Automatic', value: 'Automatic' },
    { label: 'Manual', value: 'Manual' },
  ];

  const maxPriceOptions = [
    { label: 'Any Price', value: 5000 },
    { label: 'Under ₹2,000', value: 2000 },
    { label: 'Under ₹3,000', value: 3000 },
    { label: 'Under ₹4,000', value: 4000 },
  ];

  const radiusOptions = [
    { label: '10 km', value: 10 },
    { label: '20 km', value: 20 },
    { label: '30 km', value: 30 },
  ];

  const popularDemoVehicles: Vehicle[] = [
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
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      rating: 4.6,
    },
    {
      id: 'veh-009',
      name: 'Kia Seltos',
      brand: 'Kia',
      description: 'Stylish automatic SUV',
      type: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 2800,
      securityDeposit: 2500,
      status: 'available',
      latitude: 22.7011,
      longitude: 75.8395,
      location: 'Annapurna, Indore',
      distanceFromUser: 3.8,
      imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8d205293f24?auto=format&fit=crop&w=600&q=80',
      rating: 4.5,
    },
    {
      id: 'veh-005',
      name: 'Toyota Innova',
      brand: 'Toyota',
      description: 'Spacious 7-seater MPV',
      type: 'MPV',
      transmission: 'Manual',
      fuelType: 'Diesel',
      seatingCapacity: 7,
      pricePerDay: 3200,
      securityDeposit: 3000,
      status: 'available',
      latitude: 22.7667,
      longitude: 75.8333,
      location: 'Super Corridor, Indore',
      distanceFromUser: 5.1,
      imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=80',
      rating: 4.3,
    },
    {
      id: 'veh-006',
      name: 'Maruti Swift',
      brand: 'Maruti Suzuki',
      description: 'Agile hatchback',
      type: 'Hatchback',
      transmission: 'Manual',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 1499,
      securityDeposit: 1500,
      status: 'available',
      latitude: 22.7400,
      longitude: 75.8900,
      location: 'AB Road, Indore',
      distanceFromUser: 1.9,
      imageUrl: 'https://images.unsplash.com/photo-1541348263662-e068662d82af?auto=format&fit=crop&w=600&q=80',
      rating: 4.4,
    },
    {
      id: 'veh-004',
      name: 'Honda City ZX',
      brand: 'Honda',
      description: 'Executive sedan',
      type: 'Sedan',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 2600,
      securityDeposit: 2000,
      status: 'available',
      latitude: 22.7196,
      longitude: 75.8577,
      location: 'Rajwada Palace, Indore',
      distanceFromUser: 2.1,
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
      rating: 4.85,
    },
    {
      id: 'veh-007',
      name: 'Royal Enfield Classic 350',
      brand: 'Royal Enfield',
      description: 'Iconic cruiser bike',
      type: 'Bike',
      transmission: 'Manual',
      fuelType: 'Petrol',
      seatingCapacity: 2,
      pricePerDay: 900,
      securityDeposit: 1000,
      status: 'available',
      latitude: 22.6950,
      longitude: 75.8670,
      location: 'Bhanwarkuan, Indore',
      distanceFromUser: 2.9,
      imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
      rating: 4.75,
    },
    {
      id: 'veh-008',
      name: 'Honda Activa 6G',
      brand: 'Honda',
      description: 'Reliable automatic scooter',
      type: 'Bike',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 2,
      pricePerDay: 500,
      securityDeposit: 500,
      status: 'available',
      latitude: 22.7100,
      longitude: 75.8950,
      location: 'Piplyahana, Indore',
      distanceFromUser: 4.0,
      imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
      rating: 4.6,
    },
    {
      id: 'veh-019',
      name: 'Bajaj Chetak Premium EV',
      brand: 'Bajaj',
      description: 'Retro electric scooter',
      type: 'Bike',
      transmission: 'Automatic',
      fuelType: 'Electric',
      seatingCapacity: 2,
      pricePerDay: 750,
      securityDeposit: 1000,
      status: 'available',
      latitude: 22.6800,
      longitude: 75.8400,
      location: 'Regional Park, Indore',
      distanceFromUser: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=600&q=80',
      rating: 4.75,
    },
  ];

  useEffect(() => {
    loadVehicles();
  }, [vehicleType, transmission, maxPrice, radiusKm, location]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      let rawData: Vehicle[] = [];
      try {
        const resData = await searchVehicles({
          lat: location.lat,
          lng: location.lng,
          type: vehicleType === 'ALL' ? undefined : vehicleType,
          maxPrice: maxPrice,
          radiusKm: radiusKm,
        });
        rawData = resData && resData.length > 0 ? resData : popularDemoVehicles;
      } catch {
        rawData = popularDemoVehicles;
      }

      let filtered = [...rawData];

      if (vehicleType !== 'ALL') {
        filtered = filtered.filter(v => v.type.toLowerCase() === vehicleType.toLowerCase());
      }
      if (transmission !== 'ALL') {
        filtered = filtered.filter(v => v.transmission.toLowerCase() === transmission.toLowerCase());
      }
      if (maxPrice && maxPrice < 5000) {
        filtered = filtered.filter(v => v.pricePerDay <= maxPrice);
      }
      if (radiusKm) {
        filtered = filtered.filter(v => (v.distanceFromUser ?? 2) <= radiusKm);
      }

      setVehicles(filtered);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* 1. HERO SECTION WITH SOFT SCENIC BACKGROUND */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-blue-50/60 border border-blue-100/50 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-blue-600 stroke-[2.5]" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Your AI rental <span className="text-blue-600">copilot</span>
              </h1>
            </div>

            <p className="text-slate-500 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
              Find the perfect vehicle with natural language. Compare, book, and hit the road with AI by your side.
            </p>

            {/* Quick Prompt Pill Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => onNavigateAiChat('Find an automatic SUV under ₹3,000')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 shadow-2xs transition-all"
              >
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>Find an automatic SUV under ₹3,000</span>
              </button>

              <button
                onClick={() => onNavigateAiChat('Show cars for tomorrow')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 shadow-2xs transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Show cars for tomorrow</span>
              </button>

              <button
                onClick={() => onNavigateAiChat('Explain cancellation policy')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 shadow-2xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Explain cancellation policy</span>
              </button>
            </div>
          </div>

          {/* Right Hero Image Banner */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200/60 bg-slate-100 aspect-[16/9]">
              <img
                src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"
                alt="DriveAI SUV Hero"
                className="w-full h-full object-cover"
              />
              {/* Cursive overlay text top right */}
              <div className="absolute top-4 right-6 text-slate-800 font-serif italic text-base sm:text-lg font-bold drop-shadow-md select-none rotate-[-4deg]">
                Better Rides <br />
                <span className="pl-4">Smarter Choices</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTAINER CARD */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        
        {/* Top Search Inputs Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Location Picker (Custom Select) */}
          <div className="md:col-span-4">
            <CustomSelect
              label="Location"
              value={location.label}
              options={demoLocations.map(l => ({ label: l.label, value: l.label }))}
              onChange={(val) => {
                const found = demoLocations.find(l => l.label === val);
                if (found) setLocation(found);
              }}
            />
          </div>

          {/* Pick-up Date & Time (Custom Date Picker Modal) */}
          <div className="md:col-span-3">
            <CustomDateTimePicker
              label="Pick-up Date & Time"
              valueISO={pickupDateRaw}
              onChange={(val) => setPickupDateRaw(val)}
            />
          </div>

          {/* Drop-off Date & Time (Custom Date Picker Modal) */}
          <div className="md:col-span-3">
            <CustomDateTimePicker
              label="Drop-off Date & Time"
              valueISO={dropoffDateRaw}
              onChange={(val) => setDropoffDateRaw(val)}
            />
          </div>

          {/* Primary Search Button */}
          <div className="md:col-span-2 h-14">
            <button
              onClick={loadVehicles}
              className="w-full h-full py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Vehicles</span>
            </button>
          </div>

        </div>

        {/* Bottom Filter Dropdowns Row: 4 EQUAL WIDTH CUSTOM DROPDOWNS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          
          <CustomSelect
            label="Vehicle Type"
            value={vehicleType}
            options={vehicleTypeOptions}
            onChange={(val) => setVehicleType(val)}
          />

          <CustomSelect
            label="Transmission"
            value={transmission}
            options={transmissionOptions}
            onChange={(val) => setTransmission(val)}
          />

          <CustomSelect
            label="Max Price"
            value={maxPrice}
            options={maxPriceOptions}
            onChange={(val) => setMaxPrice(Number(val))}
          />

          <CustomSelect
            label="Radius *"
            value={radiusKm}
            options={radiusOptions}
            onChange={(val) => setRadiusKm(Number(val))}
          />

        </div>

      </div>

      {/* 3. POPULAR VEHICLES SECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Popular Vehicles
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Top picks for your next journey ({vehicles.length} available)
            </p>
          </div>

          <button
            onClick={() => {}}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-white animate-pulse border border-slate-200"></div>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 space-y-3">
            <h3 className="text-base font-bold text-slate-900">No vehicles match your criteria</h3>
            <p className="text-xs text-slate-500">Try adjusting your vehicle type, transmission, or price filter.</p>
            <button
              onClick={() => {
                setVehicleType('ALL');
                setTransmission('ALL');
                setMaxPrice(5000);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {vehicles.slice(0, 4).map((v) => (
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

      {/* 4. WHY CHOOSE DRIVEAI SECTION */}
      <div className="pt-4 space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Why Choose DriveAI?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">Verified Vehicles</h3>
              <p className="text-[11px] text-slate-500">Quality & trusted partners</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">Best Prices</h3>
              <p className="text-[11px] text-slate-500">Competitive rates, no hidden fees</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">24/7 Support</h3>
              <p className="text-[11px] text-slate-500">We're always here to help</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">Easy Booking</h3>
              <p className="text-[11px] text-slate-500">Quick & hassle-free process</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
