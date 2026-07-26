import React, { useEffect, useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Hackathon, Registration } from '../types';
import type { NavigateFn } from '../App';

interface HackathonDetailProps {
  hackathonId?: string;
  onNavigate?: NavigateFn;
}

export default function HackathonDetail({ hackathonId, onNavigate }: HackathonDetailProps) {
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const load = () => {
    if (!hackathonId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([api.hackathons.get(hackathonId), api.hackathons.registrations(hackathonId)])
      .then(([h, r]) => { setHackathon(h); setRegistrations(r); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load hackathon.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [hackathonId]);

  const closeRegistration = async () => {
    if (!hackathon) return;
    setClosing(true);
    try {
      await api.hackathons.update(hackathon.id, { status: 'registration_closed' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to close registration.');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  if (!hackathon) {
    return <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">{error ?? 'Select a hackathon from Manage Hackathons.'}</p>;
  }

  const teamRegs = registrations.filter((r) => r.participation_mode === 'team');
  const soloRegs = registrations.filter((r) => r.participation_mode === 'solo');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Hackathon Detail View</h1>
          <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mt-2">Hackathons &gt; {hackathon.title}</p>
        </div>
        <div className="flex gap-3">
          {hackathon.status === 'published' && (
            <button onClick={closeRegistration} disabled={closing} className="px-6 py-3 bg-black border-2 border-neutral-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:border-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-60">
              <Lock size={14} /> Close Reg
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-[48px] border-4 border-neutral-800 shadow-xl overflow-hidden p-8 text-white">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                  {hackathon.title}
                  <span className="bg-yellow-400 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full not-italic">{hackathon.status.replace(/_/g, ' ')}</span>
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm">
              <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Organizer</span> <span className="font-bold">{hackathon.organizer}</span></div>
              <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Domain</span> <span className="font-bold">{hackathon.domains.join(', ') || '—'}</span></div>
              <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Eligibility</span> <span className="font-bold">{hackathon.eligible_years.length ? `Year(s): ${hackathon.eligible_years.join(', ')}` : 'All Years'}</span></div>
              <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Team Size</span> <span className="font-bold">{hackathon.min_team_size} - {hackathon.max_team_size} Members (Solo Allowed: {hackathon.solo_allowed ? 'Yes' : 'No'})</span></div>
              <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Registration Closes</span> <span className="font-bold font-mono">{new Date(hackathon.registration_closes_at).toLocaleString()}</span></div>
              <div className="md:col-span-2 flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Description</span> <span className="font-medium text-neutral-300">{hackathon.description}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl overflow-hidden flex flex-col text-white">
              <div className="p-6 border-b border-neutral-800">
                <h3 className="font-black text-lg text-yellow-400 uppercase tracking-widest">Registered Teams</h3>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                    <tr><th className="px-6 py-3 border-b border-neutral-800">Team</th><th className="px-6 py-3 border-b border-neutral-800">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {teamRegs.length === 0 ? (
                      <tr><td colSpan={2} className="px-6 py-6 text-neutral-500 text-xs font-bold uppercase tracking-widest text-center">No team registrations yet.</td></tr>
                    ) : teamRegs.map((r) => (
                      <tr key={r.id} className="hover:bg-neutral-700"><td className="px-6 py-4 font-bold">{r.team_name}</td><td className="px-6 py-4 text-neutral-400 text-xs uppercase tracking-widest">{r.status.replace(/_/g, ' ')}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl overflow-hidden flex flex-col text-white">
              <div className="p-6 border-b border-neutral-800">
                <h3 className="font-black text-lg text-yellow-400 uppercase tracking-widest">Solo Participants</h3>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                    <tr><th className="px-6 py-3 border-b border-neutral-800">Name</th><th className="px-6 py-3 border-b border-neutral-800">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {soloRegs.length === 0 ? (
                      <tr><td colSpan={2} className="px-6 py-6 text-neutral-500 text-xs font-bold uppercase tracking-widest text-center">No solo registrations yet.</td></tr>
                    ) : soloRegs.map((r) => (
                      <tr key={r.id} className="hover:bg-neutral-700"><td className="px-6 py-4 font-bold">{r.student_name}</td><td className="px-6 py-4 text-neutral-400 text-xs uppercase tracking-widest">{r.status.replace(/_/g, ' ')}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl p-6 text-white">
            <h3 className="font-black text-lg uppercase tracking-widest mb-6">Stats</h3>
            <div className="space-y-4">
              {[
                { label: 'Interested', value: hackathon.interested_count },
                { label: 'Registered', value: hackathon.registered_count },
                { label: 'Solo', value: soloRegs.length },
                { label: 'Teams', value: teamRegs.length },
                { label: 'Pending Verification', value: registrations.filter((r) => r.status === 'pending_verification').length },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center p-3 bg-black rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{item.label}</span>
                  <span className="font-black text-lg font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
