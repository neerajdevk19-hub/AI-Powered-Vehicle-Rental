import { formatDateTimeDisplay } from './utils/date';
import { SearchLocationProvider } from './context/SearchLocation';
import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Vehicles } from './pages/Vehicles';
import { VehicleDetails } from './pages/VehicleDetails';
import { AiAssistant } from './pages/AiAssistant';
import { Reservations } from './pages/Reservations';
import { LiveTracking } from './pages/LiveTracking';
import { FloatingAiWidget } from './components/FloatingAiWidget';
import { Vehicle, Reservation } from './types';
import { CheckCircle2 } from 'lucide-react';

function AppContent() {
  const [initialQuery, setInitialQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [trackedVehicleId, setTrackedVehicleId] = useState<string | undefined>(undefined);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState(false);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    sessionStorage.setItem('driveai-selected', vehicle.id);
    setActiveTab('vehicle-details');
  };

  const handleBookVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    sessionStorage.setItem('driveai-selected', vehicle.id);
    setActiveTab('vehicle-details');
  };

  const handleReservationCreated = (reservation: Reservation) => {
    setConfirmedReservation(reservation);
    setActiveTab('booking-success');
  };

  const handleTrackVehicle = (vehicleId: string) => {
    setTrackedVehicleId(vehicleId);
    setActiveTab('tracking');
  };

  const handleNavigateAiChatWithQuery = (query?: string) => {
    setInitialQuery(query || '');
    setIsAiWidgetOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-800 flex flex-col font-sans relative">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className={`flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 ${
        activeTab === 'ai-chat' ? 'pb-2 overflow-hidden h-[calc(100vh-4rem)]' : 'pb-12'
      }`}>
        {activeTab === 'explore' && (
          <Home
            onSelectVehicle={handleSelectVehicle}
            onBookVehicle={handleBookVehicle}
            onNavigateAiChat={handleNavigateAiChatWithQuery}
          />
        )}

        {activeTab === 'vehicles' && (
          <Vehicles
            onSelectVehicle={handleSelectVehicle}
            onBookVehicle={handleBookVehicle}
          />
        )}

        {activeTab === 'vehicle-details' && selectedVehicle && (
          <VehicleDetails
            vehicle={selectedVehicle}
            onBack={() => setActiveTab('vehicles')}
            onReservationCreated={handleReservationCreated}
          />
        )}

        {activeTab === 'ai-chat' && (
          <AiAssistant
            onTrackVehicle={handleTrackVehicle}
            initialQuery={initialQuery}
            onSelectVehicle={handleSelectVehicle}
            onBookVehicle={handleBookVehicle}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'reservations' && (
          <Reservations onTrackVehicle={handleTrackVehicle} />
        )}

        {activeTab === 'tracking' && (
          <LiveTracking initialVehicleId={trackedVehicleId} />
        )}

        {/* Booking Success Confirmation Screen */}
        {activeTab === 'booking-success' && confirmedReservation && (
          <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900">Booking Confirmed!</h1>
            <p className="text-slate-600 text-sm">
              Your reservation for <strong className="text-slate-900">{confirmedReservation.vehicle?.name}</strong> has been successfully placed.
            </p>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left space-y-3 text-xs max-w-md mx-auto shadow-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Reservation ID</span>
                <span className="font-mono text-blue-600 font-bold">{confirmedReservation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="text-emerald-600 font-bold">{confirmedReservation.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rental Period</span>
                <span className="text-slate-700">{formatDateTimeDisplay(confirmedReservation.startTime)} → {formatDateTimeDisplay(confirmedReservation.endTime)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm text-slate-900">
                <span>Reservation total</span>
                <span className="text-blue-600">₹{confirmedReservation.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => setActiveTab('reservations')}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                View My Bookings
              </button>
              <button
                onClick={() => handleTrackVehicle(confirmedReservation.vehicleId)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                Track Vehicle Live
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Assistant Widget (Fixed to bottom-right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <FloatingAiWidget
          onSelectVehicle={handleSelectVehicle}
          onBookVehicle={handleBookVehicle}
          isOpen={isAiWidgetOpen}
          setIsOpen={setIsAiWidgetOpen}
          externalQuery={initialQuery}
        />
      </div>
    </div>
  );
}

export function App() {
  return (
    <SearchLocationProvider>
      <AppContent />
    </SearchLocationProvider>
  );
}

export default App;
