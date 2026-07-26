import React, { useEffect, useState } from 'react';
import { ChevronLeft, Calendar, Users, CheckCircle2, AlertCircle, Clock, MapPin, Star, Check, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Hackathon } from '../types';
import type { NavigateFn } from '../App';

interface StudentHackathonDetailProps {
  onNavigate?: NavigateFn;
  hackathonId?: string;
}

export default function StudentHackathonDetail({ onNavigate, hackathonId }: StudentHackathonDetailProps) {
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!hackathonId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    api.hackathons.get(hackathonId)
      .then((h) => { if (!cancelled) setHackathon(h); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load hackathon.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hackathonId]);

  const toggleInterested = async () => {
    if (!hackathon) return;
    setPending(true);
    try {
      if (hackathon.interested) await api.hackathons.removeInterest(hackathon.id);
      else await api.hackathons.markInterested(hackathon.id);
      setHackathon({ ...hackathon, interested: !hackathon.interested });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update interest.');
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  if (!hackathon) {
    return (
      <div className="space-y-4">
        <button onClick={() => onNavigate?.('explore')} className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 flex items-center gap-1 transition-colors">
          <ChevronLeft size={14} /> Back to Explore
        </button>
        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">{error ?? 'Hackathon not found.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-neutral-800 pb-8">
        <div>
          <button
            onClick={() => onNavigate?.('explore')}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Explore
          </button>

          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white">{hackathon.title}</h1>
            <span className="px-3 py-1 bg-yellow-400 text-white font-bold uppercase tracking-widest text-[10px] rounded-full border border-yellow-500 mt-2">
              {hackathon.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest">Organized by {hackathon.organizer}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 min-w-max">
          <button
            onClick={toggleInterested}
            disabled={pending}
            className={`px-6 py-4 border-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${hackathon.interested ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-neutral-900 border-neutral-800 text-white hover:border-yellow-400'}`}
          >
            {hackathon.interested ? <Check size={16} /> : <Star size={16} />} {hackathon.interested ? 'Interested' : 'Mark Interested'}
          </button>
          <button
            onClick={() => onNavigate?.('hackathon-register', hackathon.id)}
            className="px-8 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2"
          >
            Register Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black border-4 border-neutral-800 rounded-[32px] p-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Mode</span>
              <span className="text-sm font-bold text-white flex items-center gap-2 capitalize"><MapPin size={14} className="text-yellow-400" /> {hackathon.mode}</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-neutral-800 pl-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Team Size</span>
              <span className="text-sm font-bold text-white flex items-center gap-2"><Users size={14} className="text-yellow-400" /> {hackathon.min_team_size} - {hackathon.max_team_size} Members</span>
            </div>
            <div className="flex flex-col gap-1 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 pl-0 md:pl-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Registered</span>
              <span className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle2 size={14} className="text-yellow-400" /> {hackathon.registered_count}</span>
            </div>
            <div className="flex flex-col gap-1 border-t md:border-t-0 border-l border-neutral-800 pt-4 md:pt-0 pl-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Reg. Closes</span>
              <span className="text-sm font-bold text-white flex items-center gap-2"><Clock size={14} className="text-yellow-400" /> {new Date(hackathon.registration_closes_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-6 text-white">
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">About the Hackathon</h2>
              <p className="text-sm leading-relaxed text-neutral-300">{hackathon.description}</p>
            </section>

            {hackathon.domains.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Domains & Themes</h2>
                <div className="flex flex-wrap gap-2">
                  {hackathon.domains.map((tech) => (
                    <span key={tech} className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8">
            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-8 flex items-center gap-2">
              <Calendar size={18} className="text-yellow-400" /> Key Dates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hackathon.registration_opens_at && (
                <div className="p-4 rounded-2xl border-2 border-neutral-800 bg-neutral-900">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Registration Opens</p>
                  <p className="text-sm font-bold text-white">{new Date(hackathon.registration_opens_at).toLocaleString()}</p>
                </div>
              )}
              <div className="p-4 rounded-2xl border-2 border-neutral-800 bg-neutral-900">
                <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-1">Registration Closes</p>
                <p className="text-sm font-bold text-white">{new Date(hackathon.registration_closes_at).toLocaleString()}</p>
              </div>
              {hackathon.starts_at && (
                <div className="p-4 rounded-2xl border-2 border-neutral-800 bg-neutral-900">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Event Starts</p>
                  <p className="text-sm font-bold text-white">{new Date(hackathon.starts_at).toLocaleString()}</p>
                </div>
              )}
              {hackathon.ends_at && (
                <div className="p-4 rounded-2xl border-2 border-neutral-800 bg-neutral-900">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Event Ends</p>
                  <p className="text-sm font-bold text-white">{new Date(hackathon.ends_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">Eligibility</h3>
            </div>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0"></div>
                <p>{hackathon.solo_allowed ? 'Solo participation is allowed.' : 'Team participation only.'}</p>
              </li>
              {hackathon.eligible_years.length > 0 && (
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0"></div>
                  <p>Open to year(s): {hackathon.eligible_years.join(', ')}.</p>
                </li>
              )}
            </ul>
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 space-y-6">
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Faculty Coordinator</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-yellow-400 border border-neutral-800 font-black text-sm">
                  {hackathon.coordinator_name?.slice(0, 2).toUpperCase() ?? '—'}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{hackathon.coordinator_name ?? 'Not assigned'}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">{hackathon.department_code ?? ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
