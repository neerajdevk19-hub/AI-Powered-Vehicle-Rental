import React, { useState, useRef, useEffect } from 'react';
import { Vehicle, ChatMessage } from '../types';
import { sendChatMessage, confirmAiBooking } from '../services/api';
import { useSearchLocation } from '../context/SearchLocation';
import {
  Bot,
  User,
  Sparkles,
  Send,
  Mic,
  Search,
  Calendar,
  MapPin,
  FileText,
  ShieldCheck,
  Clock,
  ChevronRight,
  ChevronLeft,
  Star,
  Home as HomeIcon,
  Compass,
  Car,
  Loader2,
  Zap,
  ArrowRight,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface AiAssistantProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBookVehicle: (vehicle: Vehicle) => void;
  initialQuery?: string;
  onTrackVehicle: (id: string) => void;
  setActiveTab?: (tab: string) => void;
}

const STORAGE_KEY = 'driveai_chat_history_v2';

const WELCOME_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome-1',
    role: 'assistant',
    content: "👋 Hello! Welcome to DriveAI Rental Assistant. I'm your smart vehicle rental companion. Tell me what kind of vehicle you need, your budget, rental dates, or ask any rental policy questions!",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export const AiAssistant: React.FC<AiAssistantProps> = ({
  onSelectVehicle,
  onBookVehicle,
  initialQuery,
  onTrackVehicle,
  setActiveTab,
}) => {
  const { location } = useSearchLocation();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Lazy initialize messages from localStorage or fallback to welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved chat history:', e);
    }
    return WELCOME_MESSAGES;
  });

  // Automatically save messages to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to persist chat history:', e);
    }
  }, [messages]);

  const handleClearChat = () => {
    setMessages(WELCOME_MESSAGES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear chat history:', e);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
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

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        vehicles: res.vehicles,
        policySources: res.policySources,
        toolCalled: res.toolCalled,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I had trouble finding vehicles for that query. Please try asking again!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scrollCarouselRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  const suggestedPrompts = [
    { label: 'Find an automatic SUV near me', icon: Car, query: 'Find an automatic SUV near me' },
    { label: 'Show cars for tomorrow', icon: Calendar, query: 'Show cars for tomorrow' },
    { label: 'Which vehicle is closest to me?', icon: MapPin, query: 'Which vehicle is closest to me?' },
    { label: 'Book the selected vehicle for two days', icon: Calendar, query: 'Book the selected vehicle for two days' },
    { label: 'What is the cancellation policy?', icon: FileText, query: 'What is the cancellation policy?' },
    { label: 'Is insurance included?', icon: ShieldCheck, query: 'Is insurance included?' },
  ];

  const recentConversations = [
    { title: 'Find me an automatic SUV under ₹3,000', time: 'Today, 10:24 AM' },
    { title: 'What is the cancellation policy?', time: 'Today, 09:15 AM' },
    { title: 'Show me vehicles for tomorrow', time: 'Yesterday, 06:42 PM' },
  ];

  const renderFormattedMessage = (content: string, isUser: boolean) => {
    if (isUser) {
      return <span className="whitespace-pre-wrap">{content}</span>;
    }

    // Split and format bullet lists and long policies or vehicle lists nicely
    const cleanContent = (content || '')
      .replace(/\s+-\s+/g, '\n• ')
      .replace(/\n-\s+/g, '\n• ');

    const lines = cleanContent.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length <= 1 && !content.includes(':')) {
      return <span className="whitespace-pre-wrap leading-relaxed">{content}</span>;
    }

    return (
      <div className="space-y-2 py-0.5">
        {lines.map((line, idx) => {
          if (line.startsWith('•') || line.startsWith('-')) {
            const itemText = line.replace(/^[•-]\s*/, '');
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-slate-700 bg-white/70 p-2.5 rounded-xl border border-slate-200/50 shadow-2xs text-xs sm:text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span className="leading-relaxed font-medium text-slate-800">{itemText}</span>
              </div>
            );
          }

          if (
            line.endsWith(':') ||
            line.toLowerCase().includes('policy:') ||
            line.toLowerCase().includes('available for tomorrow')
          ) {
            return (
              <div key={idx} className="font-bold text-slate-900 text-xs sm:text-sm pt-1 pb-1 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{line}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="leading-relaxed text-slate-700 font-medium text-xs sm:text-sm">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-[calc(100vh-4.25rem)] bg-[#F4F6FB] font-sans flex flex-col overflow-hidden">
      <div className="max-w-[1440px] w-full mx-auto px-2 sm:px-4 lg:px-6 pt-1 pb-2 flex-1 h-full overflow-hidden">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full items-stretch">

          {/* 1. CENTER MAIN CHAT WINDOW (lg:col-span-8) */}
          <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-full">

              {/* Header */}
              <div className="px-6 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Bot className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-base">AI Rental Assistant</h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span>Your smart vehicle rental companion</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span>GPS: {location.label || 'Indore, MP'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearChat}
                    title="Clear chat history"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Chat</span>
                  </button>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Online</span>
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/40 no-scrollbar">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div key={m.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                      {/* Avatar */}
                      {!isUser ? (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-2xs">
                          <Bot className="w-4.5 h-4.5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4.5 h-4.5" />
                        </div>
                      )}

                      {/* Message Bubble & Content */}
                      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[84%]`}>
                        <div
                          className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${isUser
                              ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-2xs'
                              : 'bg-slate-100/90 border border-slate-200/60 text-slate-800 rounded-tl-none shadow-2xs'
                            }`}
                        >
                          {renderFormattedMessage(m.content, isUser)}
                        </div>

                        <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">{m.timestamp}</span>

                        {/* Vehicle Carousel inside Chat */}
                        {m.vehicles && m.vehicles.length > 0 && (
                          <div className="mt-3 w-full relative">
                            <div
                              ref={carouselRef}
                              className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth"
                            >
                              {m.vehicles.map((v) => (
                                <div
                                  key={v.id}
                                  className="w-64 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all shrink-0 flex flex-col justify-between space-y-2.5"
                                >
                                  <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100">
                                    <img
                                      src={v.imageUrl}
                                      alt={v.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                                      Available
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <h4 className="font-bold text-slate-900 text-sm truncate">{v.name}</h4>
                                    <p className="text-[11px] font-semibold text-slate-400">
                                      {v.type} · {v.transmission} · {v.fuelType}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs pt-0.5">
                                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                      <span className="font-bold text-slate-900">{v.rating || 4.6}</span>
                                      <span className="text-slate-400 text-[11px]">(124 reviews)</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span>{v.distanceFromUser ? `${v.distanceFromUser} km away` : '2.4 km away'}</span>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                    <div>
                                      <span className="font-extrabold text-blue-600 text-sm">
                                        ₹{v.pricePerDay.toLocaleString()}
                                      </span>
                                      <span className="text-[10px] text-slate-400">/day</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => onSelectVehicle(v)}
                                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold"
                                      >
                                        View Details
                                      </button>
                                      <button
                                        onClick={() => onBookVehicle(v)}
                                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold shadow-2xs"
                                      >
                                        Book Now
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Carousel Right Scroll Button */}
                            <button
                              onClick={scrollCarouselRight}
                              className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-blue-600 hover:bg-slate-50 flex items-center justify-center z-10 transition-colors"
                              aria-label="Scroll Carousel Right"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs p-3 rounded-xl bg-white/80 w-fit border border-slate-200/60">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Finding vehicles & policies…</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Pills */}
              <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => handleSend('Show cars for tomorrow')}
                  className="px-3 py-1.5 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-semibold whitespace-nowrap transition-colors border border-blue-100/80 shrink-0"
                >
                  Show cars for tomorrow
                </button>
                <button
                  onClick={() => handleSend("What's the cancellation policy?")}
                  className="px-3 py-1.5 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-semibold whitespace-nowrap transition-colors border border-blue-100/80 shrink-0"
                >
                  What's the cancellation policy?
                </button>
                <button
                  onClick={() => handleSend('Is insurance included?')}
                  className="px-3 py-1.5 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-semibold whitespace-nowrap transition-colors border border-blue-100/80 shrink-0"
                >
                  Is insurance included?
                </button>
                <button
                  onClick={() => handleSend('Book the Creta')}
                  className="px-3 py-1.5 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-semibold whitespace-nowrap transition-colors border border-blue-100/80 shrink-0"
                >
                  Book the Creta
                </button>
              </div>

              {/* Bottom Input Form */}
              <div className="p-4 bg-white border-t border-slate-200/80 flex items-center gap-3">
                <button
                  className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors shrink-0"
                  aria-label="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-50 border border-slate-200/90 focus:border-blue-500 text-slate-800 text-xs sm:text-sm rounded-full px-4 py-3 outline-none transition-colors placeholder:text-slate-400"
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
          </div>

          {/* 2. RIGHT SIDEBAR PANEL (lg:col-span-4) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col h-full overflow-y-auto no-scrollbar space-y-4 pr-1">

            {/* Suggested Prompts Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">Suggested Prompts</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Quick questions to get started</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                {suggestedPrompts.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.query)}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/80 hover:text-blue-600 text-slate-700 border border-slate-200/60 text-xs font-semibold flex items-center gap-2.5 transition-all"
                    >
                      <IconComp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Powered by AI Banner */}
            <div className="relative rounded-2xl p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md overflow-hidden space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-extrabold text-xs">Powered by AI</h4>
              </div>
              <p className="text-[11px] text-blue-100 font-medium leading-relaxed">
                Real vehicle data · Smart recommendations
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
