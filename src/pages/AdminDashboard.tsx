import React, { useEffect, useState } from 'react';
import { Users, FileCheck, Shield, AlertTriangle, TrendingUp, Award, Activity, UserPlus, FileText, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { AdminDashboardSummary } from '../types';
import type { NavigateFn } from '../App';

interface AdminDashboardProps {
  onNavigate?: NavigateFn;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.dashboard()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  const ranked = [...(summary?.departmentPerformance ?? [])].sort((a, b) => b.wins - a.wins);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Admin Dashboard</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Platform Overview & Metrics</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: summary?.totalUsers ?? 0, icon: Users, highlight: false },
          { label: 'Students', value: summary?.students ?? 0, icon: FileCheck, highlight: false },
          { label: 'Faculty', value: summary?.faculty ?? 0, icon: Shield, highlight: false },
          { label: 'Admins', value: summary?.admins ?? 0, icon: Shield, highlight: true },
          { label: 'Active Hackathons', value: summary?.activeHackathons ?? 0, icon: Activity, highlight: false },
          { label: 'Total Participations', value: summary?.totalParticipations ?? 0, icon: TrendingUp, highlight: false },
          { label: 'Total Wins', value: summary?.totalWins ?? 0, icon: Award, highlight: false },
          { label: 'Flagged Actions', value: summary?.flaggedActions ?? 0, icon: AlertTriangle, highlight: (summary?.flaggedActions ?? 0) > 0 },
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
        <div className="xl:col-span-2 space-y-6 flex flex-col">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl overflow-hidden flex flex-col flex-1">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
              <h2 className="font-bold text-lg text-white uppercase tracking-widest">Department Performance</h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-black/5 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-center">Students</th>
                    <th className="px-6 py-4 text-center">Participations</th>
                    <th className="px-6 py-4 text-center">Wins</th>
                    <th className="px-6 py-4 text-center">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((d, i) => (
                    <tr key={d.dept} className="border-b border-neutral-800 hover:bg-neutral-900 transition-colors">
                      <td className="px-6 py-4 font-black text-white">{d.dept}</td>
                      <td className="px-6 py-4 text-center font-bold text-neutral-400">{d.students}</td>
                      <td className="px-6 py-4 text-center font-bold text-neutral-400">{d.participations}</td>
                      <td className="px-6 py-4 text-center font-black text-white">{d.wins}</td>
                      <td className="px-6 py-4 text-center font-black text-yellow-500">#{i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-white uppercase tracking-widest">Recent Winners</h2>
            </div>
            {(summary?.recentWinners.length ?? 0) === 0 ? (
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No verified wins yet.</p>
            ) : (
              <div className="space-y-3">
                {summary!.recentWinners.map((w, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl">
                    <div>
                      <p className="font-black text-white text-sm">{w.student_name}</p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{w.department_code ?? '—'} • {w.title}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-400/20 text-yellow-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {w.outcome}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6 shadow-xl">
            <h2 className="font-bold text-lg text-white uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onNavigate?.('users')} className="p-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-yellow-400 transition-colors group">
                <UserPlus size={20} className="text-neutral-400 group-hover:text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white text-center">Add User</span>
              </button>
              <button onClick={() => onNavigate?.('users')} className="p-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-yellow-400 transition-colors group">
                <Shield size={20} className="text-neutral-400 group-hover:text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white text-center">Manage Roles</span>
              </button>
              <button onClick={() => onNavigate?.('settings')} className="p-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-yellow-400 transition-colors group">
                <Activity size={20} className="text-neutral-400 group-hover:text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white text-center">System Settings</span>
              </button>
              <button onClick={() => onNavigate?.('audit')} className="p-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-yellow-400 transition-colors group">
                <FileText size={20} className="text-neutral-400 group-hover:text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white text-center">Audit Logs</span>
              </button>
            </div>
          </div>

          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6 shadow-xl flex-1 flex flex-col">
            <h2 className="font-bold text-lg text-white uppercase tracking-widest mb-4">Flagged Registrations</h2>
            {(summary?.flaggedActions ?? 0) === 0 ? (
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Nothing flagged right now.</p>
            ) : (
              <p className="text-sm text-white font-bold">{summary?.flaggedActions} registration(s) were rejected and may need follow-up. See Audit Logs for detail.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
