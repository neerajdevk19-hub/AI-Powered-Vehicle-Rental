import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Location = { lat: number; lng: number; label: string };
const demo = { lat: 22.7196, lng: 75.8577, label: 'Indore demo center' };
const Context = createContext<{ location: Location; setLocation: (location: Location) => void }>({ location: demo, setLocation: () => {} });
export const useSearchLocation = () => useContext(Context);
export function SearchLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>(demo);
  return <Context.Provider value={{ location, setLocation }}>{children}</Context.Provider>;
}
export function LocationSelector() {
  const { location, setLocation } = useSearchLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) { setError('Location is not supported. Select a demo pickup area.'); return; }
    setBusy(true); setError('');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocation({ lat: coords.latitude, lng: coords.longitude, label: 'Your GPS location' }); setBusy(false);
    }, () => { setError('Location permission unavailable. You can use a demo pickup area.'); setBusy(false); }, { timeout: 10000 });
  };
  return <section aria-label="Search location" className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
    <span className="font-semibold">Search around</span>
    <select aria-label="Pickup area" className="rounded-lg border border-slate-200 p-2" value={location.label} onChange={e => {
      const places = [demo, { lat: 22.7533, lng: 75.8937, label: 'Vijay Nagar, Indore' }, { lat: 22.7244, lng: 75.8839, label: 'Palasia, Indore' }];
      setLocation(places.find(p => p.label === e.target.value) || demo); setError('');
    }}>
      <option>Indore demo center</option><option>Vijay Nagar, Indore</option><option>Palasia, Indore</option>
      {location.label === 'Your GPS location' && <option>Your GPS location</option>}
    </select>
    <button disabled={busy} onClick={locate} className="rounded-lg bg-indigo-50 px-3 py-2 font-semibold text-indigo-700">{busy ? 'Locating…' : 'Use my location'}</button>
    <span className="text-xs text-slate-500">{location.lat.toFixed(4)}, {location.lng.toFixed(4)} · Sample fleet: Indore</span>
    {error && <span role="alert" className="w-full text-xs text-rose-700">{error}</span>}
  </section>;
}
