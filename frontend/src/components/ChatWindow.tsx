import { useSearchLocation } from '../context/SearchLocation';
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Vehicle } from '../types';
import { sendChatMessage, confirmAiBooking } from '../services/api';
import { Send, Bot, User, Sparkles, Loader2, ArrowRight, Shield, Zap } from 'lucide-react';

interface ChatWindowProps {
  initialQuery?: string;
  onTrackVehicle: (id: string) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBookVehicle: (vehicle: Vehicle) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onSelectVehicle, onBookVehicle, initialQuery, onTrackVehicle }) => {
  const { location } = useSearchLocation();
  const [confirming, setConfirming] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try { const saved = JSON.parse(sessionStorage.getItem('driveai-chat') || 'null'); if (Array.isArray(saved) && saved.length) return saved; } catch {}
    return [
    {
      id: 'msg-1',
      role: 'assistant',
      content:
        "👋 Hello! I am your DriveAI Assistant. Tell me what kind of vehicle you need, your budget, dates, or ask any rental policy questions!",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]; });
  const [input, setInput] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { sessionStorage.setItem('driveai-chat', JSON.stringify(messages.slice(-40))); }, [messages]);

  const promptSuggestions = [
    "Find me an automatic SUV near me for tomorrow under ₹3,000",
    "Show available cars for tomorrow",
    "What is the cancellation policy?",
    "Is insurance included?",
    "What are the late return charges?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Send message to NestJS backend /ai/chat
      const historyPayload = messages.filter(m => m.id !== 'msg-1' && !m.id.startsWith('err-')).map((m) => ({
        role: m.role,
        content: m.content + (m.vehicles?.length ? '\nVehicle IDs: ' + m.vehicles.map(v => `${v.name}: ${v.id}`).join(', ') : ''),
      }));

      const res = await sendChatMessage({
        message: text,
        userLat: location.lat, userLng: location.lng,
        selectedVehicleId: sessionStorage.getItem('driveai-selected') || undefined,
        conversationHistory: historyPayload,
      });

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString(),
        vehicles: res.vehicles,
        reservation: res.reservation,
        policySources: res.policySources,
        toolCalled: res.toolCalled,
        bookingDraft: res.bookingDraft,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: typeof err.response?.data?.message === 'string' ? err.response.data.message : 'Could not reach the assistant. Please try again; vehicle browsing is still available.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async (message: ChatMessage) => {
    if (!message.bookingDraft || confirming) return;
    setConfirming(message.id);
    try {
      const result = await confirmAiBooking(message.bookingDraft.token);
      setMessages(previous => previous.map(m => m.id === message.id ? { ...m, bookingDraft: undefined, reservation: result.reservation,
        content: `Booking confirmed. Reservation ID: ${result.reservationId}. Total: ₹${result.pricing.totalPrice}. No payment was taken.` } : m));
    } catch (error: any) {
      setMessages(previous => [...previous, { id: `err-${Date.now()}`, role: 'assistant', timestamp: new Date().toLocaleTimeString(),
        content: error.response?.data?.message || 'Booking failed. Please check availability and request a new review.' }]);
    } finally { setConfirming(''); }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/80 rounded-2xl border border-slate-200 shadow-sm overflow-hidden glass-panel">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200/80 bg-white/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-cyan-500/20">
            <Bot className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">DriveAI Assistant</h3>
              <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Gemini assistant
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Find a ride, compare options, and ask about your rental</p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                {isUser ? (
                  <span className="text-[11px] text-slate-500 font-medium">You</span>
                ) : (
                  <span className="text-[11px] text-cyan-700 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> DriveAI Assistant
                  </span>
                )}
                <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
              </div>

              {/* Message Content Bubble */}
              <div
                className={`p-4 rounded-2xl max-w-[90%] sm:max-w-[80%] text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Render Tool Execution Badge if tool was called */}
                {msg.toolCalled && (
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-indigo-700 flex items-center gap-1 font-mono">
                    <Zap className="w-3 h-3 text-cyan-700" />
                    <span>Checked: <strong className="text-slate-900">{msg.toolCalled}</strong></span>
                  </div>
                )}
              </div>

              {msg.bookingDraft && <div className="mt-3 w-full max-w-md rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm">
                <h4 className="font-bold">Review booking · {msg.bookingDraft.vehicle.name}</h4>
                <p className="my-2">{new Date(msg.bookingDraft.startDate).toLocaleString()} → {new Date(msg.bookingDraft.endDate).toLocaleString()}</p>
                <dl className="space-y-1">
                  <div className="flex justify-between"><dt>{msg.bookingDraft.pricing.days} days × ₹{msg.bookingDraft.pricing.pricePerDay}</dt><dd>₹{msg.bookingDraft.pricing.basePrice}</dd></div>
                  <div className="flex justify-between"><dt>Demo tax (18%)</dt><dd>₹{msg.bookingDraft.pricing.gstTaxes}</dd></div>
                  <div className="flex justify-between"><dt>Refundable deposit</dt><dd>₹{msg.bookingDraft.pricing.securityDeposit}</dd></div>
                  <div className="flex justify-between font-bold"><dt>Total</dt><dd>₹{msg.bookingDraft.pricing.totalPrice}</dd></div>
                </dl>
                <button onClick={() => confirmBooking(msg)} disabled={!!confirming || Date.parse(msg.bookingDraft.expiresAt) < Date.now()} className="mt-3 w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white">{confirming === msg.id ? 'Confirming…' : 'Confirm booking'}</button>
                <p className="mt-2 text-xs text-slate-500">Demo reservation only. No payment taken. Review expires in 10 minutes.</p>
              </div>}
              {msg.reservation && <button onClick={() => onTrackVehicle(msg.reservation!.vehicleId)} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">Track booked vehicle</button>}
              {/* Render Vehicle Result Cards inside chat */}
              {msg.vehicles && msg.vehicles.length > 0 && (
                <div className="mt-3 w-full max-w-[95%] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {msg.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="bg-white/90 border border-slate-200 hover:border-indigo-500/50 rounded-xl p-3 text-xs flex flex-col justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={v.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'}
                          alt={v.name}
                          className="w-16 h-12 rounded-lg object-cover bg-slate-100"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 truncate text-sm">{v.name}</div>
                          <div className="text-slate-500 text-[11px] truncate">{v.location}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-extrabold text-indigo-700 text-xs">₹{v.pricePerDay}/day</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {v.transmission}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 mt-1">
                        <button
                          onClick={() => onSelectVehicle(v)}
                          className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-semibold text-[11px]"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => onBookVehicle(v)}
                          className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold text-[11px] flex items-center justify-center gap-1"
                        >
                          <span>Reserve</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Render Policy Sources if present */}
              {msg.policySources && msg.policySources.length > 0 && (
                <div className="mt-3 w-full max-w-[90%] space-y-2">
                  {msg.policySources.map((policy, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/80 border border-cyan-500/30 text-xs"
                    >
                      <div className="flex items-center gap-2 font-bold text-cyan-700 mb-1">
                        <Shield className="w-3.5 h-3.5 text-cyan-700" />
                        <span>Source: {policy.title} ({policy.category})</span>
                      </div>
                      <p className="text-slate-600 line-clamp-3 leading-relaxed">{policy.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-slate-500 text-xs p-3 rounded-xl bg-white/60 w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-700" />
            <span>Checking your request…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 bg-white/40 border-t border-slate-200/60 overflow-x-auto flex gap-2 no-scrollbar">
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs bg-white border border-slate-200 hover:border-indigo-500/50 hover:text-indigo-700 text-slate-600 transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-cyan-700" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white/80 border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          aria-label="Message the AI assistant"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI e.g. 'Find me an automatic SUV near me for tomorrow under ₹3000'..."
          disabled={loading}
          className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none placeholder:text-slate-500 transition-colors"
        />
        <button
          aria-label="Send message"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white shadow-sm transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
