import React, { useState, useRef, useEffect } from 'react';
import { Vehicle } from '../types';
import { sendChatMessage } from '../services/api';
import { useSearchLocation } from '../context/SearchLocation';
import { Sparkles, Minus, X, Send, Bot, User, Star, MapPin, Loader2 } from 'lucide-react';

interface FloatingAiWidgetProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBookVehicle: (vehicle: Vehicle) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  externalQuery?: string;
}

interface MessageItem {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  vehicles?: Vehicle[];
}

export const FloatingAiWidget: React.FC<FloatingAiWidgetProps> = ({
  onSelectVehicle,
  onBookVehicle,
  isOpen,
  setIsOpen,
  externalQuery,
}) => {
  const { location } = useSearchLocation();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Initial demo messages matching reference screenshot
  const defaultHyundai: Vehicle = {
    id: 'veh-002',
    name: 'Hyundai Creta',
    brand: 'Hyundai',
    description: 'Feature-loaded automatic SUV with panoramic sunroof',
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
  };

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'm1',
      role: 'assistant',
      content: "Hello! I'm your DriveAI Assistant. Tell me what kind of vehicle you need, your budget, dates, or ask any rental policy questions!",
      timestamp: '10:24 AM',
    },
    {
      id: 'm2',
      role: 'user',
      content: 'Find me an automatic SUV near me for tomorrow under ₹3,000',
      timestamp: '10:25 AM',
    },
    {
      id: 'm3',
      role: 'assistant',
      content: 'Great! I found some automatic SUVs near you within your budget for tomorrow. Here are the best options:',
      timestamp: '10:25 AM',
      vehicles: [defaultHyundai],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalQuery) {
      handleSend(externalQuery);
      setIsOpen(true);
    }
  }, [externalQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: MessageItem = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage({
        message: text,
        userLat: location.lat,
        userLng: location.lng,
      });

      const assistantMsg: MessageItem = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        vehicles: res.vehicles,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I had trouble processing that request. Please try again!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPills = [
    'Show cars for tomorrow',
    "What's the cancellation policy?",
    'Which is the closest vehicle?',
  ];

  return (
    <>
      {/* Floating Toggle Button (FAB) at bottom-right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center group"
          aria-label="Open DriveAI Assistant"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Floating AI Widget Container with increased size & hidden scrollbar */}
      {isOpen && (
        <div className="w-[440px] sm:w-[480px] max-w-[94vw] h-[670px] max-h-[86vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col z-50 overflow-hidden font-sans transition-all">
          
          {/* Widget Header */}
          <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">DriveAI Assistant</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Minimize Assistant"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body with hidden scrollbar */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40 no-scrollbar">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  {!isUser ? (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4.5 h-4.5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4.5 h-4.5" />
                    </div>
                  )}

                  {/* Message bubble & details */}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[84%]`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-2xs'
                          : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-2xs'
                      }`}
                    >
                      {m.content}
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 px-1.5 font-medium">{m.timestamp}</span>

                    {/* Embedded Mini Vehicle Card */}
                    {m.vehicles && m.vehicles.length > 0 && (
                      <div className="mt-3 w-full space-y-2.5">
                        {m.vehicles.slice(0, 2).map((v) => (
                          <div
                            key={v.id}
                            className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs text-xs space-y-3"
                          >
                            <div className="flex gap-3.5 items-center">
                              <img
                                src={v.imageUrl}
                                alt={v.name}
                                className="w-24 h-18 rounded-xl object-cover bg-slate-100 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate">{v.name}</h4>
                                <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                  {v.transmission} · {v.fuelType} · {v.type}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-1">
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                  <span className="font-bold">{v.rating || 4.6}</span>
                                  <span className="text-slate-400">(124 reviews)</span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{v.distanceFromUser ? `${v.distanceFromUser} km away` : '2.4 km away'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                              <div>
                                <span className="font-extrabold text-blue-600 text-base">
                                  ₹{v.pricePerDay.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">/day</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onSelectVehicle(v)}
                                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => onBookVehicle(v)}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                                >
                                  Book Now
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs p-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Finding best vehicles…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips with hidden scrollbar */}
          <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
            {suggestedPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pill)}
                className="px-3 py-1.5 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-semibold whitespace-nowrap transition-colors border border-blue-100/80 shrink-0"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3.5 bg-white border-t border-slate-200/80 flex items-center gap-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-slate-50/90 border border-slate-200 focus:border-blue-500 text-slate-800 text-xs sm:text-sm rounded-full px-4 py-2.5 outline-none transition-colors placeholder:text-slate-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-xs transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
