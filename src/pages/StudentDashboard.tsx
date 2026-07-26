import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Eye, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Hackathon, Notification, Registration } from '../types';
import type { NavigateFn } from '../App';

interface StudentDashboardProps {
  onNavigate?: NavigateFn;
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.hackathons.list(), api.registrations.mine(), api.notifications.list()])
      .then(([h, r, n]) => { setHackathons(h); setRegistrations(r); setNotifications(n); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  const interestedCount = hackathons.filter((h) => h.interested).length;
  const registeredCount = registrations.filter((r) => r.status !== 'rejected' && r.status !== 'withdrawn').length;
  const ongoingCount = registrations.filter((r) => r.hackathon_status === 'ongoing').length;
  const upcomingDeadlines = registrations.filter((r) => {
    const days = (new Date(r.registration_closes_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  });

  const urgentRegistration = upcomingDeadlines.find((r) => r.status === 'draft' || r.status === 'submitted');
  const unreadNotifications = notifications.filter((n) => !n.read_at).slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Student Dashboard</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Welcome back, {user?.full_name ?? 'Student'}</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      {urgentRegistration && (
        <div className="bg-red-500 rounded-[32px] p-6 text-white border-4 border-red-600 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shrink-0">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-black uppercase tracking-widest text-lg">Action Required</h2>
              <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-90">
                Registration for <span className="text-white">{urgentRegistration.hackathon_title}</span> closes {new Date(urgentRegistration.registration_closes_at).toLocaleDateString()}.
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate?.('hackathon-detail', urgentRegistration.hackathon_id)} className="px-6 py-3 bg-black text-red-600 rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-95 transition-transform shrink-0 whitespace-nowrap shadow-lg">
            View Details
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Interested', value: interestedCount, icon: Eye, highlight: false },
          { label: 'Registered', value: registeredCount, icon: CheckCircle2, highlight: true },
          { label: 'Ongoing', value: ongoingCount, icon: Clock, highlight: false },
          { label: 'Upcoming Deadlines', value: upcomingDeadlines.length, icon: AlertCircle, highlight: false },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.highlight ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-black text-white border-neutral-800'} p-5 rounded-3xl border-2 shadow-lg flex items-center gap-4`}>
            <div className={`p-3 rounded-2xl ${stat.highlight ? 'bg-neutral-900 text-yellow-400' : 'bg-neutral-800 text-white'}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-black leading-none font-mono">{stat.value}</p>
              <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${stat.highlight ? 'text-white/70' : 'text-neutral-500'}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="font-bold text-lg text-white uppercase tracking-widest">My Pipeline</h2>
            <button onClick={() => onNavigate?.('pipeline')} className="text-[10px] px-4 py-2 bg-neutral-900 text-white rounded-full font-bold uppercase tracking-widest border border-neutral-800 hover:border-yellow-400 transition-colors">
              View All
            </button>
          </div>

          {registrations.length === 0 ? (
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">No registrations yet — explore hackathons to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 border-b border-neutral-800">Hackathon</th>
                    <th className="px-6 py-4 border-b border-neutral-800">Reg. Close Date</th>
                    <th className="px-6 py-4 border-b border-neutral-800">Status</th>
                    <th className="px-6 py-4 border-b border-neutral-800 text-center">Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-white">
                  {registrations.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-700 transition-colors">
                      <td className="px-6 py-4 font-bold">{r.hackathon_title}</td>
                      <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{new Date(r.registration_closes_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => onNavigate?.('hackathon-detail', r.hackathon_id)} className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors bg-neutral-900 border border-neutral-700 text-white hover:border-yellow-400">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-yellow-400 rounded-[32px] p-6 text-white flex flex-col shadow-lg border-4 border-yellow-500 overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-400 rotate-45"></div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest">Reminders & Alerts</div>
            </div>
            <div className="space-y-4 flex-1">
              {unreadNotifications.length === 0 ? (
                <p className="text-sm font-bold text-white/80">You're all caught up.</p>
              ) : unreadNotifications.map((n) => (
                <div key={n.id} className="flex flex-col gap-2 border-b border-white/10 pb-4 last:border-0">
                  <div>
                    <p className="text-sm font-bold leading-snug">{n.title}</p>
                    {n.body && <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-1">{n.body}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl p-6 text-white">
            <h3 className="font-black text-lg text-white uppercase tracking-widest mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={() => onNavigate?.('explore')} className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 border-2 border-transparent transition-all flex items-center justify-center gap-3"><Eye size={16} className="text-neutral-500"/> Explore Hackathons</button>
              <button onClick={() => onNavigate?.('calendar')} className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 border-2 border-transparent transition-all flex items-center justify-center gap-3"><Calendar size={16} className="text-neutral-500"/> Calendar</button>
              <button onClick={() => onNavigate?.('profile')} className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 border-2 border-transparent transition-all flex items-center justify-center gap-3"><FileText size={16} className="text-neutral-500"/> Update Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
