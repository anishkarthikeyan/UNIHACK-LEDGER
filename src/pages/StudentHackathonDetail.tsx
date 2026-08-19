import React, { useEffect, useState } from 'react';
import { ChevronLeft, Calendar, Users, CheckCircle2, AlertCircle, Clock, MapPin, Star, Check, Loader2, Bookmark, Trophy, Tag, Building2, Link as LinkIcon } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { deriveExploreStatus, registrationSubtext, ctaLabelFor, STATUS_BADGE_CLASS } from '../lib/hackathonStatus';
import type { Hackathon, Registration } from '../types';
import type { NavigateFn } from '../App';

interface StudentHackathonDetailProps {
  onNavigate?: NavigateFn;
  hackathonId?: string;
}

export default function StudentHackathonDetail({ onNavigate, hackathonId }: StudentHackathonDetailProps) {
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [existingRegistration, setExistingRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);

  useEffect(() => {
    if (!hackathonId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    // Same "already registered" check StudentRegistration.tsx uses (api.registrations.mine(),
    // ignoring rejected/withdrawn) — purely presentational here (a heads-up before the student
    // navigates), the backend and StudentRegistration remain the actual source of truth.
    Promise.all([api.hackathons.get(hackathonId), api.registrations.mine()])
      .then(([h, mine]) => {
        if (cancelled) return;
        setHackathon(h);
        setExistingRegistration(mine.find((r) => r.hackathon_id === hackathonId && r.status !== 'rejected' && r.status !== 'withdrawn') ?? null);
      })
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

  const toggleBookmark = async () => {
    if (!hackathon) return;
    setBookmarkPending(true);
    try {
      if (hackathon.bookmarked) await api.hackathons.removeBookmark(hackathon.id);
      else await api.hackathons.bookmark(hackathon.id);
      setHackathon({ ...hackathon, bookmarked: !hackathon.bookmarked });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update bookmark.');
    } finally {
      setBookmarkPending(false);
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

  const organizers = hackathon.organizers.length ? hackathon.organizers : [hackathon.organizer];
  const eligibilityYears = hackathon.eligibility.filter((e) => e.year !== null).map((e) => e.year as number).sort((a, b) => a - b);
  const eligibilityLabels = hackathon.eligibility.filter((e) => e.label !== null).map((e) => e.label as string);

  // Same live status model Explore uses (src/lib/hackathonStatus.ts) — one source of truth, so
  // this page can never show a different state than the card the student tapped in from.
  const es = deriveExploreStatus(hackathon);
  const isRegistrable = es.filterBucket === 'OPEN' || es.filterBucket === 'CLOSING SOON';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-neutral-800 pb-8">
        <div className="min-w-0">
          <button
            onClick={() => onNavigate?.('explore')}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Explore
          </button>

          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter uppercase text-white break-words">{hackathon.title}</h1>
            <span className={`px-3 py-1 font-bold uppercase tracking-widest text-[10px] rounded-full mt-2 ${STATUS_BADGE_CLASS[es.key]}`}>
              {es.label}
            </span>
            <span className="px-3 py-1 bg-neutral-900 text-green-500 font-bold uppercase tracking-widest text-[10px] rounded-full border border-neutral-800 mt-2">
              {registrationSubtext(es, hackathon)}
            </span>
            {hackathon.external_status && (
              <span className="px-3 py-1 bg-neutral-900 text-neutral-300 font-bold uppercase tracking-widest text-[10px] rounded-full border border-neutral-700 mt-2">
                {hackathon.external_status}
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest">Organized by {organizers.join(', ')}</p>
          {hackathon.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {hackathon.categories.map((c) => (
                <span key={c} className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-[9px] font-bold uppercase tracking-widest text-neutral-300 flex items-center gap-1">
                  <Tag size={10} /> {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 min-w-max">
          <button
            onClick={toggleBookmark}
            disabled={bookmarkPending}
            aria-label={hackathon.bookmarked ? 'Remove bookmark' : 'Bookmark competition'}
            className={`px-6 py-4 border-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${hackathon.bookmarked ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-neutral-900 border-neutral-800 text-white hover:border-yellow-400'}`}
          >
            <Bookmark size={16} fill={hackathon.bookmarked ? 'currentColor' : 'none'} /> {hackathon.bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button
            onClick={toggleInterested}
            disabled={pending}
            className={`px-6 py-4 border-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${hackathon.interested ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-neutral-900 border-neutral-800 text-white hover:border-yellow-400'}`}
          >
            {hackathon.interested ? <Check size={16} /> : <Star size={16} />} {hackathon.interested ? 'Interested' : 'Mark Interested'}
          </button>
          {existingRegistration ? (
            <div className="flex flex-col items-stretch sm:items-end gap-2">
              <span className="px-8 py-4 bg-neutral-900 border-2 border-yellow-400 text-yellow-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <CheckCircle2 size={14} /> Already Registered
              </span>
              <button
                onClick={() => onNavigate?.('pipeline')}
                className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 transition-colors"
              >
                View in Pipeline
              </button>
            </div>
          ) : isRegistrable ? (
            <button
              onClick={() => onNavigate?.('hackathon-register', hackathon.id)}
              className="px-8 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2"
            >
              Register Now
            </button>
          ) : (
            <button
              disabled
              title={registrationSubtext(es, hackathon)}
              className="px-8 py-4 bg-neutral-900 border-2 border-neutral-800 text-neutral-500 rounded-full text-[10px] font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
            >
              {ctaLabelFor(es)}
            </button>
          )}
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
              <span className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle2 size={14} className="text-yellow-400" /> {hackathon.external_registered_teams ?? hackathon.registered_count} teams{hackathon.external_registered_students !== null ? ` / ${hackathon.external_registered_students} students` : ''}</span>
            </div>
            <div className="flex flex-col gap-1 border-t md:border-t-0 border-l border-neutral-800 pt-4 md:pt-0 pl-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Reg. Closes</span>
              <span className="text-sm font-bold text-white flex items-center gap-2"><Clock size={14} className="text-yellow-400" /> {hackathon.registration_closes_at ? new Date(hackathon.registration_closes_at).toLocaleDateString() : 'TBA'}</span>
            </div>
          </div>

          <div className="space-y-6 text-white">
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">About the Hackathon</h2>
              {hackathon.short_description && <p className="text-sm leading-relaxed text-neutral-300 mb-2 italic">{hackathon.short_description}</p>}
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

            {hackathon.problem_statements && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Problem Statements</h2>
                <p className="text-sm leading-relaxed text-neutral-300 whitespace-pre-line">{hackathon.problem_statements}</p>
              </section>
            )}

            {hackathon.rules && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Rules</h2>
                <p className="text-sm leading-relaxed text-neutral-300 whitespace-pre-line">{hackathon.rules}</p>
              </section>
            )}

            {hackathon.judging_criteria && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Judging Criteria</h2>
                <p className="text-sm leading-relaxed text-neutral-300 whitespace-pre-line">{hackathon.judging_criteria}</p>
              </section>
            )}

            {hackathon.faq && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">FAQ</h2>
                <p className="text-sm leading-relaxed text-neutral-300 whitespace-pre-line">{hackathon.faq}</p>
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
                <p className="text-sm font-bold text-white">{hackathon.registration_closes_at ? new Date(hackathon.registration_closes_at).toLocaleString() : 'TBA'}</p>
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
              {hackathon.timeline.map((round) => (
                <div key={round.id} className="p-4 rounded-2xl border-2 border-neutral-800 bg-neutral-900">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{round.name}</p>
                  <p className="text-sm font-bold text-white">{new Date(round.startsAt).toLocaleDateString()}</p>
                  {round.instructions && <p className="text-xs text-neutral-400 mt-1">{round.instructions}</p>}
                </div>
              ))}
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
              {eligibilityYears.length > 0 && (
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0"></div>
                  <p>Open to year(s): {eligibilityYears.join(', ')}.</p>
                </li>
              )}
              {eligibilityLabels.map((label) => (
                <li key={label} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0"></div>
                  <p>{label}</p>
                </li>
              ))}
            </ul>
          </div>

          {hackathon.prize_pool && (
            <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy size={18} className="text-yellow-400" />
                <h3 className="font-black uppercase tracking-widest text-sm text-white">Prize Pool</h3>
              </div>
              <p className="text-lg sm:text-2xl font-black font-mono text-white break-words">{hackathon.prize_pool}</p>
            </div>
          )}

          {organizers.length > 0 && (
            <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 size={18} className="text-yellow-400" />
                <h3 className="font-black uppercase tracking-widest text-sm text-white">Organizers</h3>
              </div>
              <ul className="space-y-2 text-sm text-neutral-300 font-medium">
                {organizers.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </div>
          )}

          {(hackathon.official_url || hackathon.registration_url || hackathon.brochure_url) && (
            <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <LinkIcon size={18} className="text-yellow-400" />
                <h3 className="font-black uppercase tracking-widest text-sm text-white">Links</h3>
              </div>
              <ul className="space-y-2 text-xs font-bold uppercase tracking-widest">
                {hackathon.official_url && <li><a href={hackathon.official_url} target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline">Official Website</a></li>}
                {hackathon.registration_url && <li><a href={hackathon.registration_url} target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline">Registration Page</a></li>}
                {hackathon.brochure_url && <li><a href={hackathon.brochure_url} target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline">Brochure</a></li>}
              </ul>
            </div>
          )}

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
