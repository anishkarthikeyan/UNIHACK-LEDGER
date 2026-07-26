import React, { useEffect, useState } from 'react';
import { Calendar, Users, FileCheck, Clock, Eye, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Hackathon } from '../types';
import type { NavigateFn } from '../App';

interface DashboardProps {
  onNavigate?: NavigateFn;
}

const CHART_DATA = [
  { name: 'Jan', CSE: 120, IT: 80, ECE: 40 },
  { name: 'Feb', CSE: 150, IT: 100, ECE: 60 },
  { name: 'Mar', CSE: 180, IT: 120, ECE: 90 },
  { name: 'Apr', CSE: 250, IT: 160, ECE: 110 },
  { name: 'May', CSE: 320, IT: 210, ECE: 150 },
  { name: 'Jun', CSE: 400, IT: 280, ECE: 190 },
];

const WINNING_DATA = [
  { department: 'CSE', first: 12, second: 18, third: 10 },
  { department: 'IT', first: 8, second: 12, third: 15 },
  { department: 'ECE', first: 5, second: 8, third: 12 },
  { department: 'MECH', first: 2, second: 4, third: 5 },
];

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.hackathons.list()
      .then(setHackathons)
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl p-6">
          <h2 className="font-bold text-lg text-yellow-400 uppercase tracking-widest mb-6">Participation Growth</h2>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Sample analytics — full reporting coming soon</p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCSE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorECE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }} tickMargin={10} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontWeight: 'bold', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#888' }} />
                <Area type="monotone" dataKey="CSE" stroke="#facc15" strokeWidth={3} fillOpacity={1} fill="url(#colorCSE)" />
                <Area type="monotone" dataKey="IT" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorIT)" />
                <Area type="monotone" dataKey="ECE" stroke="#a78bfa" strokeWidth={3} fillOpacity={1} fill="url(#colorECE)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl p-6">
          <h2 className="font-bold text-lg text-yellow-400 uppercase tracking-widest mb-6">Winning Analytics</h2>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Sample analytics — full reporting coming soon</p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WINNING_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="department" stroke="#666" tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }} tickMargin={10} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontWeight: 'bold', color: '#fff' }}
                  cursor={{ fill: '#222' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#888' }} />
                <Bar dataKey="first" name="1st Place" fill="#facc15" radius={[4, 4, 0, 0]} />
                <Bar dataKey="second" name="2nd Place" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="third" name="3rd Place" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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
                    <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{new Date(h.registration_closes_at).toLocaleDateString()}</td>
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
