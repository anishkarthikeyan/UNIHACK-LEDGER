import React, { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, AlertCircle, X, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Registration, Reminder, Team } from '../types';

interface CalendarEvent {
  date: Date;
  type: 'deadline' | 'reminder';
  title: string;
  desc: string;
  time: string;
}

export default function StudentCalendar() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderType, setReminderType] = useState<'Solo' | 'Team'>('Solo');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderTeamId, setReminderTeamId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.registrations.mine(), api.reminders.mine(), api.teams.mine()])
      .then(([r, rem, t]) => { setRegistrations(r); setReminders(rem); setTeams(t); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load calendar.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const events = useMemo<CalendarEvent[]>(() => {
    const deadlineEvents: CalendarEvent[] = registrations.map((r) => ({
      date: new Date(r.registration_closes_at),
      type: 'deadline',
      title: `${r.hackathon_title} registration closes`,
      desc: 'Make sure your team profile is complete.',
      time: new Date(r.registration_closes_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
    const reminderEvents: CalendarEvent[] = reminders.map((r) => ({
      date: new Date(r.starts_at),
      type: 'reminder',
      title: r.title,
      desc: r.team_name ? `Team sync — ${r.team_name}` : 'Personal reminder',
      time: new Date(r.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
    return [...deadlineEvents, ...reminderEvents];
  }, [registrations, reminders]);

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

  const changeMonth = (delta: number) => setCursor(new Date(year, month + delta, 1));

  const submitReminder = async () => {
    if (!reminderTitle.trim() || !reminderDate) { setError('Title and date are required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const isoStart = new Date(`${reminderDate}T${reminderTime || '09:00'}:00`).toISOString();
      await api.reminders.create({ title: reminderTitle.trim(), startsAt: isoStart, teamId: reminderType === 'Team' ? reminderTeamId || undefined : undefined });
      setReminderTitle(''); setReminderDate(''); setReminderTime(''); setReminderTeamId('');
      setShowReminderModal(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  const agenda = eventsByDay.get(selectedDate.toDateString()) ?? [];

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">Calendar</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Deadlines, reminders, and team syncs</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <div className="bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon size={20} className="text-white" />
              <div>
                <h3 className="font-black uppercase tracking-widest text-sm">Agenda</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              {agenda.length === 0 ? (
                <p className="text-sm font-bold opacity-80">Nothing scheduled for this day.</p>
              ) : agenda.map((e, i) => (
                <div key={i} className="bg-black/10 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {e.type === 'deadline' ? <AlertCircle size={14} className="text-red-600" /> : <Clock size={14} className="text-white" />}
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">{e.type === 'deadline' ? 'Deadline' : 'Reminder'}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{e.time}</span>
                  </div>
                  <p className="font-bold text-sm mb-1 leading-tight">{e.title}</p>
                  <p className="text-xs font-medium opacity-80">{e.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowReminderModal(true)}
              className="w-full mt-4 py-3 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-[0.98] transition-transform"
            >
              Add Personal Reminder
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 bg-black border-4 border-neutral-800 rounded-[32px] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-widest text-white">{cursor.toLocaleDateString(undefined, { month: 'long' })} <span className="text-neutral-500">{year}</span></h2>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="w-10 h-10 rounded-full border-2 border-neutral-700 flex items-center justify-center text-white hover:border-yellow-400 hover:text-yellow-400 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => changeMonth(1)} className="w-10 h-10 rounded-full border-2 border-neutral-700 flex items-center justify-center text-white hover:border-yellow-400 hover:text-yellow-400 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 pb-2 border-b-2 border-neutral-800">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1 border-l border-t border-neutral-800">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 md:h-32 border border-neutral-800/50 p-2 opacity-20"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const date = new Date(year, month, day);
              const dayEvents = eventsByDay.get(date.toDateString()) ?? [];
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === today.toDateString();
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`h-24 md:h-32 border border-neutral-800 p-2 flex flex-col transition-all cursor-pointer ${
                    isSelected ? 'bg-yellow-400/10 border-yellow-400' : 'hover:bg-neutral-700 hover:border-neutral-700'
                  }`}
                >
                  <span className={`text-sm font-mono font-bold p-1 rounded-full w-8 h-8 flex items-center justify-center ${isSelected ? 'bg-yellow-400 text-white' : isToday ? 'text-yellow-400' : 'text-neutral-400'}`}>
                    {day}
                  </span>
                  <div className="mt-auto space-y-1">
                    {dayEvents.some((e) => e.type === 'deadline') && <div className="w-full h-1.5 bg-yellow-400 rounded-full" title="Deadline"></div>}
                    {dayEvents.some((e) => e.type === 'reminder') && <div className="w-full h-1.5 bg-white rounded-full" title="Reminder"></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">New Reminder</h2>
              <button onClick={() => setShowReminderModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Reminder Type</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setReminderType('Solo')}
                    className={`flex-1 py-3 border-2 rounded-full font-bold uppercase tracking-widest text-[10px] transition-colors ${reminderType === 'Solo' ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-neutral-900 border-neutral-800 text-white hover:border-white'}`}
                  >
                    Personal
                  </button>
                  <button
                    onClick={() => setReminderType('Team')}
                    disabled={teams.length === 0}
                    className={`flex-1 py-3 border-2 rounded-full font-bold uppercase tracking-widest text-[10px] transition-colors disabled:opacity-40 ${reminderType === 'Team' ? 'bg-black border-white text-white' : 'bg-neutral-900 border-neutral-800 text-white hover:border-white'}`}
                  >
                    Team Sync
                  </button>
                </div>
              </div>

              {reminderType === 'Team' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Select Team</label>
                  <select value={reminderTeamId} onChange={(e) => setReminderTeamId(e.target.value)} className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors appearance-none">
                    <option value="">Choose a team...</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <p className="text-[9px] text-neutral-400 mt-2 font-bold uppercase tracking-widest">This reminder will be visible to all active team members.</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Title</label>
                <input value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} type="text" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder={reminderType === 'Team' ? 'e.g. Brainstorming session' : 'e.g. Finish prototype'} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Date</label>
                  <input value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} type="date" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Time</label>
                  <input value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} type="time" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" />
                </div>
              </div>

              <button onClick={submitReminder} disabled={submitting} className="w-full py-4 mt-4 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <Loader2 size={14} className="animate-spin" />} Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
