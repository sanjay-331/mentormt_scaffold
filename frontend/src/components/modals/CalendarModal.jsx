import React, { useEffect, useState } from "react";
import { X, Calendar, AlertTriangle, GraduationCap, PartyPopper, Clock } from "lucide-react";
import { getCalendarEvents } from "../../services/calendar";

export default function CalendarModal({ isOpen, onClose, darkMode }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      async function load() {
        setLoading(true);
        try {
          const data = await getCalendarEvents();
          setEvents(data);
        } catch (e) {
          console.error("Failed to load calendar events", e);
        } finally {
          setLoading(false);
        }
      }
      load();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'exam': return <GraduationCap className="w-4 h-4 text-red-500" />;
      case 'holiday': return <PartyPopper className="w-4 h-4 text-emerald-500" />;
      case 'deadline': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-lg">Academic Calendar</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-sm opacity-60">Fetching calendar...</p>
            </div>
          ) : events.length === 0 ? (
            <p className="text-center py-8 opacity-60 text-sm">No upcoming events found.</p>
          ) : (
            events.map((event, idx) => (
              <div key={idx} className={`p-3 rounded-xl border flex gap-3 transition hover:scale-[1.01] ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                  {getTypeIcon(event.type)}
                </div>
                <div>
                  <div className="font-bold text-sm">{event.title}</div>
                  <div className="text-[10px] opacity-60 uppercase font-bold tracking-wider mb-1">{event.date}</div>
                  <p className="text-xs opacity-80">{event.description}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={`p-4 border-t text-center ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
          <button 
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
