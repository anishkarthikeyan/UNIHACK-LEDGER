import React, { useEffect, useState } from 'react';
import { Trophy, Star, Target, CheckCircle2, Medal, Upload, X, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Achievement } from '../types';

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function StudentAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [outcome, setOutcome] = useState('Participant');
  const [achievedOn, setAchievedOn] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.achievements.mine()
      .then(setAchievements)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load achievements.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async () => {
    if (!title.trim()) { setError('Hackathon name is required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.achievements.create({ title: title.trim(), outcome, achievedOn: achievedOn || undefined });
      setTitle(''); setOutcome('Participant'); setAchievedOn('');
      setShowUploadModal(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit record.');
    } finally {
      setSubmitting(false);
    }
  };

  const wins = achievements.filter((a) => /winner|1st|2nd|3rd|runner/i.test(a.outcome)).length;
  const finalists = achievements.filter((a) => /finalist/i.test(a.outcome)).length;
  const verified = achievements.filter((a) => a.status === 'approved').length;
  const sortedTimeline = [...achievements].sort((a, b) => new Date(b.achieved_on ?? b.created_at).getTime() - new Date(a.achieved_on ?? a.created_at).getTime());

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Achievements</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Your hackathon portfolio and verified records</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="col-span-2 md:col-span-4 lg:col-span-2 bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg flex items-center gap-6">
          <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center font-black text-xl text-yellow-400">
            {user ? initialsOf(user.full_name) : '—'}
          </div>
          <div>
            <h2 className="font-black uppercase tracking-widest text-lg">{user?.full_name}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">{user?.programme ?? 'Student'}{user?.year_of_study ? ` • Year ${user.year_of_study}` : ''}</p>
          </div>
        </div>

        {[
          { label: 'Total Participations', value: achievements.length, icon: Target },
          { label: 'Wins & Runner-ups', value: wins, icon: Trophy },
          { label: 'Finalist Entries', value: finalists, icon: Star },
          { label: 'Verified Records', value: verified, icon: CheckCircle2 },
        ].map((stat) => (
          <div key={stat.label} className="bg-black p-5 rounded-3xl border-2 border-neutral-800 shadow-lg flex flex-col justify-between h-auto min-h-[120px]">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 rounded-xl bg-neutral-900 text-yellow-400 border border-neutral-800">
                <stat.icon size={16} />
              </div>
            </div>
            <p className="text-3xl font-black text-white font-mono">{stat.value}</p>
            <p className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 bg-black border-4 border-neutral-800 rounded-[32px] p-8">
          <h2 className="text-lg font-black uppercase tracking-widest text-white mb-8 flex items-center gap-2">
            <Medal size={18} className="text-yellow-400" /> Career Timeline
          </h2>

          {sortedTimeline.length === 0 ? (
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No records yet.</p>
          ) : (
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-neutral-800">
              {sortedTimeline.map((item) => {
                const highlight = /winner|1st/i.test(item.outcome);
                return (
                  <div key={item.id} className="relative flex items-center justify-between group">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-neutral-100 z-10 shrink-0 ${highlight ? 'bg-yellow-400 text-white' : 'bg-neutral-900 text-neutral-500'}`}>
                      {highlight ? <Trophy size={14} /> : <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full"></div>}
                    </div>
                    <div className="w-[calc(100%-3.5rem)] p-4 rounded-2xl border-2 border-neutral-800 bg-neutral-900 group-hover:border-neutral-600 transition-colors ml-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{item.achieved_on ? new Date(item.achieved_on).getFullYear() : new Date(item.created_at).getFullYear()}</p>
                      <h3 className={`font-bold text-sm mb-1 ${highlight ? 'text-yellow-400' : 'text-white'}`}>{item.title}</h3>
                      <div className="flex gap-2">
                        <span className="text-[10px] text-neutral-400 font-medium">{item.outcome}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 bg-black border-4 border-neutral-800 rounded-[32px] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="font-bold text-lg text-white uppercase tracking-widest">Verified Records</h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-[10px] px-6 py-3 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center gap-2"
            >
              <Upload size={14} /> Submit Record
            </button>
          </div>

          {achievements.length === 0 ? (
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">No records submitted yet.</p>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 border-b border-neutral-800">Event Name</th>
                    <th className="px-6 py-4 border-b border-neutral-800">Date</th>
                    <th className="px-6 py-4 border-b border-neutral-800">Outcome</th>
                    <th className="px-6 py-4 border-b border-neutral-800">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-white">
                  {achievements.map((record) => (
                    <tr key={record.id} className="hover:bg-neutral-700 transition-colors group">
                      <td className="px-6 py-4 font-bold">{record.title}</td>
                      <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{record.achieved_on ? new Date(record.achieved_on).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          /winner|1st/i.test(record.outcome) ? 'bg-yellow-400 text-white' : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                        }`}>
                          {record.outcome}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {record.status === 'approved' ? (
                          <div className="flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                            <CheckCircle2 size={14} /> Verified
                          </div>
                        ) : record.status === 'rejected' ? (
                          <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">Rejected</span>
                        ) : (
                          <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Submit Record</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Hackathon Name</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="e.g. Code for Good 2025" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors appearance-none"
                >
                  <option value="Participant">Participant</option>
                  <option value="Finalist">Finalist</option>
                  <option value="Winner (1st)">Winner (1st)</option>
                  <option value="Runner-up">Runner-up</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Date Achieved</label>
                <input value={achievedOn} onChange={(e) => setAchievedOn(e.target.value)} type="date" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" />
              </div>

              <button onClick={submit} disabled={submitting} className="w-full py-4 mt-4 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <Loader2 size={14} className="animate-spin" />} Submit for Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
