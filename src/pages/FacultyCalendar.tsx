import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Users, ChevronLeft, ChevronRight, Plus, Loader2, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Hackathon, Reminder } from '../types';

interface CalendarEvent {
  date: Date;
  title: string;
  time: string;
  type: 'Deadline' | 'Event' | 'Reminder';
}

export default function FacultyCalendar() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.hackathons.list(), api.reminders.mine()])
      .then(([h, r]) => { setHackathons(h); setReminders(r); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load calendar.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const events = useMemo<CalendarEvent[]>(() => {
    const deadlineEvents: CalendarEvent[] = hackathons.map((h) => ({
      date: new Date(h.registration_closes_at),
      title: `${h.title} — Registration Closes`,
      time: new Date(h.registration_closes_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Deadline',
    }));
    const startEvents: CalendarEvent[] = hackathons.filter((h) => h.starts_at).map((h) => ({
      date: new Date(h.starts_at as string),
      title: `${h.title} — Kickoff`,
      time: new Date(h.starts_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Event',
    }));
    const reminderEvents: CalendarEvent[] = reminders.map((r) => ({
      date: new Date(r.starts_at),
      title: r.title,
      time: new Date(r.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Reminder',
    }));
    return [...deadlineEvents, ...startEvents, ...reminderEvents];
  }, [hackathons, reminders]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = e.date.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const today = new Date();

  const upcoming = events
    .filter((e) => e.date.getTime() >= Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  const submit = async () => {
    if (!title.trim() || !date) { setError('Title and date are required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const isoStart = new Date(`${date}T${time || '09:00'}:00`).toISOString();
      await api.reminders.create({ title: title.trim(), startsAt: isoStart });
      setTitle(''); setDate(''); setTime('');
      setShowModal(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add event.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Calendar</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Hackathon schedules and deadlines</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-neutral-900 text-white rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-95 transition-transform flex items-center gap-2">
          <Plus size={14} /> Add Event
        </button>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-black border-4 border-neutral-800 rounded-[32px] p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-widest">{cursor.toLocaleDateString(undefined, { month: 'long' })} {year}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-2 border-2 border-neutral-800 rounded-full text-neutral-400 hover:text-white hover:border-white transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-2 border-2 border-neutral-800 rounded-full text-neutral-400 hover:text-white hover:border-white transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 flex-1">
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const date = new Date(year, month, day);
              const dayEvents = eventsByDay.get(date.toDateString()) ?? [];
              const isToday = date.toDateString() === today.toDateString();
              return (
                <div
                  key={day}
                  className={`relative p-2 rounded-xl border-2 transition-all cursor-pointer min-h-[80px] ${
                    isToday ? 'bg-yellow-400 border-yellow-400 text-white shadow-lg scale-105 z-10' :
                    dayEvents.length > 0 ? 'bg-neutral-900 border-white text-white hover:bg-neutral-800' :
                    'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                  title={dayEvents.map((e) => e.title).join('\n')}
                >
                  <span className="font-bold">{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                      <div className={`h-1.5 flex-1 rounded-full ${isToday ? 'bg-neutral-900/50' : 'bg-black'}`}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-6">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Upcoming Events</h2>

          {upcoming.length === 0 ? (
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Nothing scheduled.</p>
          ) : upcoming.map((event, i) => (
            <div key={i} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 flex items-start gap-4 hover:border-yellow-400 transition-colors group">
              <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center shrink-0 group-hover:bg-yellow-400 group-hover:text-white transition-colors">
                {event.type === 'Deadline' ? <Clock size={20} /> : <Users size={20} />}
              </div>
              <div>
                <h3 className="font-black text-white">{event.title}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-1">{event.date.toLocaleDateString()}, {event.time}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-neutral-800 rounded text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                  {event.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Add Event</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="e.g. Mentoring session" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Date</label>
                  <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Time</label>
                  <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" />
                </div>
              </div>
              <button onClick={submit} disabled={submitting} className="w-full py-4 mt-2 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <Loader2 size={14} className="animate-spin" />} Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
