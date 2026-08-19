import React, { useEffect, useState } from 'react';
import { Calendar, Users, FileCheck, Clock, Eye, Loader2, BarChart3, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Hackathon, Registration } from '../types';
import type { NavigateFn } from '../App';

interface DashboardProps {
  onNavigate?: NavigateFn;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  // Same endpoint FacultyReviewVerify already queries for its "Registrations" tab — reused here
  // rather than adding a new one, so the dashboard stat and the review queue can never disagree.
  const [pendingRegistrations, setPendingRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.hackathons.list(), api.registrations.list('pending_verification')])
      .then(([h, r]) => { setHackathons(h); setPendingRegistrations(r); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  const activeCount = hackathons.filter((h) => h.status === 'published' || h.status === 'ongoing').length;
  const totalInterested = hackathons.reduce((sum, h) => sum + h.interested_count, 0);
  const totalRegistered = hackathons.reduce((sum, h) => sum + h.registered_count, 0);
  const deadlinesThisWeek = hackathons.filter((h) => {
    if (!h.registration_closes_at) return false;
    const days = (new Date(h.registration_closes_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  }).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Faculty Hackathon Dashboard</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Welcome back, {user?.full_name ?? 'Faculty'}</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Hackathons', value: activeCount, icon: Calendar, highlight: true },
          { label: 'Students Interested', value: totalInterested, icon: Users },
          { label: 'Students Registered', value: totalRegistered, icon: FileCheck },
          { label: 'Deadlines This Week', value: deadlinesThisWeek, icon: Clock },
          { label: 'Pending Registrations', value: pendingRegistrations.length, icon: AlertCircle, highlight: pendingRegistrations.length > 0 },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.highlight ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-black text-white border-neutral-800'} p-5 rounded-3xl border-2 shadow-lg flex items-center gap-4`}>
            <div className={`p-3 rounded-2xl ${stat.highlight ? 'bg-neutral-900 text-yellow-400' : 'bg-neutral-800 text-white'}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-black leading-none">{stat.value}</p>
              <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${stat.highlight ? 'text-white/70' : 'text-neutral-500'}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onNavigate?.('reports')}
        className="w-full bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-yellow-400 transition-colors"
      >
        <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-yellow-400">
          <BarChart3 size={26} />
        </div>
        <h2 className="font-bold text-lg text-white uppercase tracking-widest">Analytics &amp; Reports</h2>
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest max-w-md">
          Department participation trends, verified winning breakdowns, and exportable summaries — open Reports &rarr;
        </p>
      </button>

      <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="font-bold text-lg text-yellow-400 uppercase tracking-widest">Current Hackathons</h2>
        </div>
        {hackathons.length === 0 ? (
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">No hackathons yet — create one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-b border-neutral-800">Event Name</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Reg. Close Date</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Status</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Interested</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Registered</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-white">
                {hackathons.slice(0, 8).map((h) => (
                  <tr key={h.id} className="hover:bg-neutral-700 transition-colors">
                    <td className="px-6 py-4 font-bold">{h.title}</td>
                    <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{h.registration_closes_at ? new Date(h.registration_closes_at).toLocaleDateString() : 'TBA'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-yellow-400 text-white">
                        {h.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-neutral-400">{h.interested_count}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-yellow-400">{h.registered_count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3 text-neutral-500">
                        <button onClick={() => onNavigate?.('hackathons-detail', h.id)} className="hover:text-yellow-400 transition-colors"><Eye size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
