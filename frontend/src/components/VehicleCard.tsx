import React, { useState } from 'react';
import { Vehicle } from '../types';
import { Star, MapPin, Users, Heart } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
  onBookDirectly?: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onSelect,
  onBookDirectly,
}) => {
  const [isLiked, setIsLiked] = useState(false);

  // Map image URLs if needed for realistic display matching reference images
  const getImage = (v: Vehicle) => {
    if (v.name.toLowerCase().includes('creta')) {
      return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
    }
    if (v.name.toLowerCase().includes('seltos')) {
      return 'https://images.unsplash.com/photo-1609521263047-f8d205293f24?auto=format&fit=crop&w=600&q=80';
    }
    if (v.name.toLowerCase().includes('innova') || v.name.toLowerCase().includes('fortuner')) {
      return 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=80';
    }
    if (v.name.toLowerCase().includes('swift') || v.name.toLowerCase().includes('baleno')) {
      return 'https://images.unsplash.com/photo-1541348263662-e068662d82af?auto=format&fit=crop&w=600&q=80';
    }
    return vehicle.imageUrl || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80';
  };

  return (
    <div 
      onClick={() => onSelect(vehicle)}
      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      
      {/* Card Image Header */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={getImage(vehicle)}
          alt={vehicle.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            Available
          </span>
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 shadow-xs transition-colors"
          aria-label="Add to wishlist"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          {/* Title */}
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
            {vehicle.name}
          </h3>

          {/* Specs Subtitle */}
          <p className="text-xs font-semibold text-slate-500">
            {vehicle.type} · {vehicle.transmission} · {vehicle.fuelType}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 pt-1 text-xs">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-bold text-slate-900">{vehicle.rating || 4.6}</span>
            <span className="text-slate-400 font-medium">(124 reviews)</span>
          </div>

          {/* Seating & Distance */}
          <div className="flex items-center gap-4 pt-2 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{vehicle.seatingCapacity} seats</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{vehicle.distanceFromUser ? `${vehicle.distanceFromUser} km away` : '2.4 km away'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Price & Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-xl font-extrabold text-slate-900">
              ₹{vehicle.pricePerDay.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-400">/day</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(vehicle);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookDirectly ? onBookDirectly(vehicle) : onSelect(vehicle);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              Book Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
