import React, { useEffect, useMemo, useState } from 'react';
import { Search, Star, Check, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Hackathon } from '../types';
import type { NavigateFn } from '../App';

interface ExploreHackathonsProps {
  onNavigate?: NavigateFn;
}

function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function statusLabel(h: Hackathon) {
  if (h.status === 'completed' || h.status === 'archived') return 'Ended';
  if (h.status === 'ongoing') return 'Ongoing';
  if (h.status === 'registration_closed') return 'Registration Closed';
  return 'Open';
}

export default function ExploreHackathons({ onNavigate }: ExploreHackathonsProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeDomain, setActiveDomain] = useState('All Domains');
  const [activeMode, setActiveMode] = useState('All Modes');
  const [lessThan10Days, setLessThan10Days] = useState(false);
  const [pendingInterest, setPendingInterest] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.hackathons.list(search)
      .then((rows) => { if (!cancelled) { setHackathons(rows); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load hackathons.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search]);

  const allDomains = useMemo(() => Array.from(new Set(hackathons.flatMap((h) => h.domains))), [hackathons]);

  const filteredHackathons = hackathons.filter((h) => {
    if (activeDomain !== 'All Domains' && !h.domains.includes(activeDomain)) return false;
    if (activeMode !== 'All Modes' && h.mode !== activeMode.toLowerCase()) return false;
    if (lessThan10Days && daysLeft(h.registration_closes_at) > 10) return false;
    return true;
  });

  const toggleInterested = async (h: Hackathon) => {
    setPendingInterest(h.id);
    try {
      if (h.interested) await api.hackathons.removeInterest(h.id);
      else await api.hackathons.markInterested(h.id);
      setHackathons((prev) => prev.map((x) => x.id === h.id ? { ...x, interested: !x.interested, interested_count: x.interested_count + (x.interested ? -1 : 1) } : x));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update interest.');
    } finally {
      setPendingInterest(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Explore Hackathons</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Discover and participate in exciting events</p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <div className="relative w-full">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hackathons by title or organizer..."
            className="w-full pl-14 pr-6 py-4 bg-black border-4 border-neutral-800 rounded-full focus:border-yellow-400 focus:bg-neutral-900 text-sm outline-none text-white placeholder-neutral-500 font-bold transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pb-4">
        <select
          value={activeDomain}
          onChange={(e) => setActiveDomain(e.target.value)}
          className="px-6 py-3 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none hover:border-yellow-400 transition-colors shrink-0"
        >
          <option value="All Domains">All Domains</option>
          {allDomains.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={activeMode}
          onChange={(e) => setActiveMode(e.target.value)}
          className="px-6 py-3 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none hover:border-yellow-400 transition-colors shrink-0"
        >
          <option value="All Modes">All Modes</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Hybrid">Hybrid</option>
        </select>

        <label className={`flex items-center gap-2 px-6 py-3 border-2 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:border-yellow-400 transition-colors shrink-0 ${lessThan10Days ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-black border-neutral-800 text-white'}`}>
          <input type="checkbox" className="hidden" checked={lessThan10Days} onChange={(e) => setLessThan10Days(e.target.checked)} />
          Less than 10 days
        </label>
      </div>

      <div className="flex justify-between items-end mb-6">
        <h2 className="text-xl font-black uppercase tracking-widest text-white">All Hackathons <span className="text-neutral-500 text-sm">({filteredHackathons.length})</span></h2>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>
      ) : filteredHackathons.length === 0 ? (
        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest text-center py-20">No hackathons match these filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredHackathons.map((h) => {
            const dl = daysLeft(h.registration_closes_at);
            const status = statusLabel(h);
            return (
              <div key={h.id} className="bg-black rounded-[32px] border-4 border-neutral-800 flex flex-col hover:border-yellow-400 transition-colors group overflow-hidden">
                <div className="w-full h-40 bg-neutral-900 relative flex items-center justify-center border-b-2 border-neutral-800">
                  <div className="w-16 h-16 border-4 border-neutral-800 rounded-full flex items-center justify-center text-neutral-400 font-bold uppercase text-[10px]">Image</div>
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <span className="px-3 py-1 bg-neutral-900 text-white text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                      {h.organizer}
                    </span>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded ${
                        status === 'Ongoing' ? 'bg-green-500 text-white' :
                        status === 'Ended' ? 'bg-neutral-700 text-neutral-400' : 'bg-orange-500 text-white'
                      }`}>
                        {status}
                      </span>
                      {status !== 'Ended' && (
                        <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-green-500 bg-neutral-900 rounded border border-neutral-800">
                          {dl > 0 ? `${dl} days left` : 'Closing today'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-black leading-tight mb-4 group-hover:text-yellow-400 transition-colors">{h.title}</h3>

                  <div className="flex flex-wrap gap-1.5 mb-6 mt-1">
                    {h.domains.map((d) => (
                      <span key={d} className="px-2 py-1 bg-yellow-400/10 text-yellow-400 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-yellow-400/20">
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-neutral-800 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Mode</span>
                      <span className="font-mono font-bold text-sm text-white capitalize">{h.mode}</span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Registered</span>
                      <span className="font-mono font-bold text-sm text-white">{h.registered_count}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => toggleInterested(h)}
                      disabled={pendingInterest === h.id}
                      className={`flex-1 py-3 border-2 rounded-full flex justify-center items-center gap-2 transition-colors text-[10px] font-bold uppercase tracking-widest disabled:opacity-60 ${
                        h.interested
                         ? 'bg-yellow-400 border-yellow-400 text-white'
                         : 'bg-neutral-900 border-neutral-800 hover:border-white text-white'
                      }`}
                    >
                      {h.interested ? <Check size={14} /> : <Star size={14} className="text-neutral-500" />}
                      Interested
                    </button>
                    <button
                      onClick={() => onNavigate?.('hackathon-detail', h.id)}
                      className="flex-1 py-3 bg-neutral-900 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-700 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
