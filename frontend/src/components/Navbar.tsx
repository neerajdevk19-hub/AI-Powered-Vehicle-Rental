import React, { useState } from 'react';
import { Car, MapPin, Calendar, Compass, Bell, ChevronDown, Sparkles, Bot } from 'lucide-react';
import { useSearchLocation } from '../context/SearchLocation';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { location, setLocation } = useSearchLocation();
  const [showLocationMenu, setShowLocationMenu] = useState(false);

  const demoLocations = [
    { label: 'Indore, Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
    { label: 'Vijay Nagar, Indore', lat: 22.7533, lng: 75.8937 },
    { label: 'Palasia, Indore', lat: 22.7244, lng: 75.8839 },
    { label: 'Bhanwarkuan, Indore', lat: 22.6950, lng: 75.8670 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left: Brand Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setActiveTab('explore')}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Drive<span className="text-blue-600">AI</span>
            </span>
          </div>

          {/* Navigation Links (Center) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 h-full">
            <button
              onClick={() => setActiveTab('explore')}
              className={`relative flex items-center gap-2 px-4 h-full text-sm font-semibold transition-colors ${
                activeTab === 'explore'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Explore</span>
              {activeTab === 'explore' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ai-chat')}
              className={`relative flex items-center gap-2 px-4 h-full text-sm font-semibold transition-colors ${
                activeTab === 'ai-chat'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Assistant</span>
              {activeTab === 'ai-chat' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('vehicles')}
              className={`relative flex items-center gap-2 px-4 h-full text-sm font-semibold transition-colors ${
                activeTab === 'vehicles'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Vehicles</span>
              {activeTab === 'vehicles' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reservations')}
              className={`relative flex items-center gap-2 px-4 h-full text-sm font-semibold transition-colors ${
                activeTab === 'reservations'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>My Bookings</span>
              {activeTab === 'reservations' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`relative flex items-center gap-2 px-4 h-full text-sm font-semibold transition-colors ${
                activeTab === 'tracking'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Live Map</span>
              {activeTab === 'tracking' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></span>
              )}
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Location Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setShowLocationMenu(!showLocationMenu)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-800">{location.label || 'Indore, Madhya Pradesh'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showLocationMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Select Location</div>
                  {demoLocations.map((loc) => (
                    <button
                      key={loc.label}
                      onClick={() => {
                        setLocation(loc);
                        setShowLocationMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-600 flex items-center justify-between"
                    >
                      <span>{loc.label}</span>
                      {location.label === loc.label && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              aria-label="Notifications"
              className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-1 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                A
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">Alex Sharma</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

