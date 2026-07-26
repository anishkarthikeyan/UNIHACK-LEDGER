import React, { useEffect, useState } from 'react';
import { Check, X, Clock, AlertCircle, Loader2, Trophy } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Achievement, Registration, Suggestion } from '../types';

export default function FacultyReviewVerify() {
  const [activeTab, setActiveTab] = useState('Suggestions');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.suggestions.list(), api.registrations.list('pending_verification'), api.achievements.list('pending')])
      .then(([s, r, a]) => { setSuggestions(s); setRegistrations(r); setAchievements(a); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load review queue.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const reviewSuggestion = async (s: Suggestion, status: 'approved' | 'rejected') => {
    setBusyId(s.id);
    try { await api.suggestions.review(s.id, status); load(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to review suggestion.'); }
    finally { setBusyId(null); }
  };

  const reviewRegistration = async (r: Registration, status: 'approved' | 'rejected') => {
    setBusyId(r.id);
    try { await api.registrations.review(r.id, status); load(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to review registration.'); }
    finally { setBusyId(null); }
  };

  const verifyAchievement = async (a: Achievement, status: 'approved' | 'rejected') => {
    setBusyId(a.id);
    try { await api.achievements.verify(a.id, status); load(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to verify achievement.'); }
    finally { setBusyId(null); }
  };

  const pendingSuggestions = suggestions.filter((s) => s.status === 'submitted' || s.status === 'under_review');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Review & Verify</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Manage Student Suggestions and Requests</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="flex gap-4 border-b border-neutral-800 pb-2">
        {[
          { key: 'Suggestions', count: pendingSuggestions.length },
          { key: 'Registrations', count: registrations.length },
          { key: 'Achievements', count: achievements.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors ${activeTab === tab.key ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
          >
            {tab.key} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 p-8">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500"><Loader2 className="animate-spin" /></div>
        ) : (
          <>
            {activeTab === 'Suggestions' && (
              <div className="space-y-6">
                <h2 className="font-black text-white uppercase tracking-widest mb-4">Suggested Hackathons</h2>
                {pendingSuggestions.length === 0 ? (
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No pending suggestions.</p>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {pendingSuggestions.map((s) => (
                      <div key={s.id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-black text-white leading-tight">{s.title}</h3>
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-1">{s.organizer}</p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-400/20 text-yellow-500 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <Clock size={12} /> {s.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Suggested By</p>
                            <p className="text-sm font-bold text-white">{s.submitted_by_name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Dates</p>
                            <p className="text-sm font-bold text-white">{s.event_date_text ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Domain</p>
                            <p className="text-sm font-bold text-white">{s.domain ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Tags</p>
                            <p className="text-sm font-bold text-white">{s.tags.join(', ') || '—'}</p>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-neutral-800">
                          <button disabled={busyId === s.id} onClick={() => reviewSuggestion(s, 'approved')} className="flex-1 py-3 bg-yellow-400 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60">
                            <Check size={14} /> Approve
                          </button>
                          <button disabled={busyId === s.id} onClick={() => reviewSuggestion(s, 'rejected')} className="flex-1 py-3 bg-neutral-800 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Registrations' && (
              <div className="space-y-6">
                <h2 className="font-black text-white uppercase tracking-widest mb-4">Pending Registration Verifications</h2>
                {registrations.length === 0 ? (
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Nothing pending review.</p>
                ) : (
                  <div className="space-y-4">
                    {registrations.map((r) => (
                      <div key={r.id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center shrink-0">
                            <AlertCircle size={24} className="text-neutral-500" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">{r.participation_mode === 'team' ? 'Team Registration' : 'Solo Registration'}</span>
                            <h3 className="text-lg font-black text-white">{r.hackathon_title}</h3>
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{r.team_name ?? r.student_name}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button disabled={busyId === r.id} onClick={() => reviewRegistration(r, 'approved')} className="flex-1 md:flex-none px-6 py-3 bg-yellow-400 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform disabled:opacity-60">
                            Approve
                          </button>
                          <button disabled={busyId === r.id} onClick={() => reviewRegistration(r, 'rejected')} className="flex-1 md:flex-none px-6 py-3 bg-neutral-800 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-700 transition-colors disabled:opacity-60">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Achievements' && (
              <div className="space-y-6">
                <h2 className="font-black text-white uppercase tracking-widest mb-4">Pending Achievement Verifications</h2>
                {achievements.length === 0 ? (
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Nothing pending review.</p>
                ) : (
                  <div className="space-y-4">
                    {achievements.map((a) => (
                      <div key={a.id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center shrink-0">
                            <Trophy size={22} className="text-neutral-500" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">{a.outcome}</span>
                            <h3 className="text-lg font-black text-white">{a.title}</h3>
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{a.student_name}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button disabled={busyId === a.id} onClick={() => verifyAchievement(a, 'approved')} className="flex-1 md:flex-none px-6 py-3 bg-yellow-400 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform disabled:opacity-60">
                            Verify
                          </button>
                          <button disabled={busyId === a.id} onClick={() => verifyAchievement(a, 'rejected')} className="flex-1 md:flex-none px-6 py-3 bg-neutral-800 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-700 transition-colors disabled:opacity-60">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
