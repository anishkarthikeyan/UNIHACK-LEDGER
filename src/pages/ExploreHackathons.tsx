import React, { useEffect, useMemo, useState } from 'react';
import { Search, Star, Check, Loader2, Bookmark, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { deriveExploreStatus, STATUS_BADGE_CLASS, STATUS_FILTER_ACTIVE_CLASS, STATUS_FILTERS, type StatusFilterKey } from '../lib/hackathonStatus';
import type { Hackathon } from '../types';
import type { NavigateFn } from '../App';

interface ExploreHackathonsProps {
  onNavigate?: NavigateFn;
}

const PAGE_SIZE = 12;

function competitionDate(h: Hackathon): string | null {
  const final = h.timeline.find((t) => t.sequence === 3) ?? h.timeline[h.timeline.length - 1];
  return final?.startsAt ?? h.starts_at ?? h.ends_at ?? null;
}

function prizeAmount(prizePool: string | null): number {
  if (!prizePool) return 0;
  const digits = prizePool.replace(/[^0-9]/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}

type SortKey = 'relevance' | 'deadline' | 'name' | 'prize' | 'registered';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Relevance: Actionable First' },
  { value: 'deadline', label: 'Deadline: Soonest' },
  { value: 'name', label: 'Name: A-Z' },
  { value: 'prize', label: 'Prize: Highest' },
  { value: 'registered', label: 'Registered: Most' },
];

export default function ExploreHackathons({ onNavigate }: ExploreHackathonsProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeDomain, setActiveDomain] = useState('All Domains');
  const [activeCategory, setActiveCategory] = useState<string | null>(null); // null = All
  const [activeYear, setActiveYear] = useState<number | null>(null); // null = All
  const [activeMode, setActiveMode] = useState('All Modes');
  const [lessThan10Days, setLessThan10Days] = useState(false);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterKey>('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);
  // 'relevance' — actionable-first (Open → Closing Soon → Upcoming → Ongoing → Ended), nearest
  // deadline first within Open/Closing Soon — is the default so ended competitions never lead the
  // list just because their (long-past) deadline sorts first chronologically. Plain chronological
  // "Deadline: Soonest" is still available in the dropdown for anyone who wants it.
  const [sortBy, setSortBy] = useState<SortKey>('relevance');
  const [page, setPage] = useState(1);
  const [pendingInterest, setPendingInterest] = useState<string | null>(null);
  const [pendingBookmark, setPendingBookmark] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.hackathons.list(search)
      .then((rows) => { if (!cancelled) { setHackathons(rows); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load hackathons.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, reloadToken]);

  useEffect(() => { setPage(1); }, [search, activeDomain, activeCategory, activeYear, activeMode, activeStatusFilter, lessThan10Days, bookmarkedOnly, sortBy]);

  const allDomains = useMemo(() => Array.from(new Set(hackathons.flatMap((h) => h.domains))).sort(), [hackathons]);
  // Categories/years come only from what's actually present in the loaded data — never a fixed
  // hardcoded list — so a filter chip never appears (or gets left out) independent of reality.
  const allCategories = useMemo(() => Array.from(new Set(hackathons.flatMap((h) => h.categories))).sort(), [hackathons]);
  const allYears = useMemo(() => {
    const years = new Set<number>();
    for (const h of hackathons) for (const e of h.eligibility) if (e.year !== null) years.add(e.year);
    return Array.from(years).sort((a, b) => a - b);
  }, [hackathons]);

  // Everything tucked inside the Filters drawer — shown as a count badge on its trigger button so
  // it's obvious something is applied even while the drawer itself is closed.
  const activeSecondaryFilterCount = [
    activeYear !== null, activeDomain !== 'All Domains', activeMode !== 'All Modes', lessThan10Days, bookmarkedOnly,
  ].filter(Boolean).length;

  const filteredHackathons = hackathons.filter((h) => {
    if (activeDomain !== 'All Domains' && !h.domains.includes(activeDomain)) return false;
    if (activeCategory && !h.categories.includes(activeCategory)) return false;
    if (activeYear !== null && !h.eligibility.some((e) => e.year === activeYear)) return false;
    if (activeMode !== 'All Modes' && h.mode !== activeMode.toLowerCase()) return false;
    if (bookmarkedOnly && !h.bookmarked) return false;
    if (activeStatusFilter !== 'ALL' && deriveExploreStatus(h).filterBucket !== activeStatusFilter) return false;
    if (lessThan10Days) {
      const dl = deriveExploreStatus(h).daysLeft;
      if (dl === null || dl > 10) return false;
    }
    return true;
  });

  const sortedHackathons = useMemo(() => {
    const sorted = [...filteredHackathons];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'prize':
        sorted.sort((a, b) => prizeAmount(b.prize_pool) - prizeAmount(a.prize_pool));
        break;
      case 'registered':
        sorted.sort((a, b) => (b.external_registered_teams ?? b.registered_count) - (a.external_registered_teams ?? a.registered_count));
        break;
      case 'relevance':
        sorted.sort((a, b) => {
          const sa = deriveExploreStatus(a);
          const sb = deriveExploreStatus(b);
          if (sa.priority !== sb.priority) return sa.priority - sb.priority;
          if (a.registration_closes_at && b.registration_closes_at) {
            return new Date(a.registration_closes_at).getTime() - new Date(b.registration_closes_at).getTime();
          }
          if (a.registration_closes_at) return -1;
          if (b.registration_closes_at) return 1;
          return a.title.localeCompare(b.title);
        });
        break;
      case 'deadline':
      default:
        sorted.sort((a, b) => {
          if (!a.registration_closes_at) return 1;
          if (!b.registration_closes_at) return -1;
          return new Date(a.registration_closes_at).getTime() - new Date(b.registration_closes_at).getTime();
        });
        break;
    }
    return sorted;
  }, [filteredHackathons, sortBy]);

  const pageCount = Math.max(1, Math.ceil(sortedHackathons.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedHackathons = sortedHackathons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

  const toggleBookmark = async (h: Hackathon) => {
    setPendingBookmark(h.id);
    try {
      if (h.bookmarked) await api.hackathons.removeBookmark(h.id);
      else await api.hackathons.bookmark(h.id);
      setHackathons((prev) => prev.map((x) => x.id === h.id ? { ...x, bookmarked: !x.bookmarked } : x));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update bookmark.');
    } finally {
      setPendingBookmark(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">Explore Hackathons</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Discover and participate in exciting events</p>
      </div>

      <div className="relative w-full">
        <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search hackathons by title or organizer..."
          className="w-full pl-12 pr-5 py-3 bg-black border-2 border-neutral-800 rounded-full focus:border-yellow-400 focus:bg-neutral-900 text-xs outline-none text-white placeholder-neutral-500 font-bold transition-all"
        />
      </div>

      {/* Status chips — computed live from real dates on every render (see deriveExploreStatus
          above), never from a stored/stale status label. Horizontal-scrolling, single row, so the
          filter area stays short on mobile instead of wrapping across several tall rows. */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Status</p>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setActiveStatusFilter(s.value)}
              className={`px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 transition-colors shrink-0 whitespace-nowrap ${
                activeStatusFilter === s.value ? STATUS_FILTER_ACTIVE_CLASS[s.value] : 'bg-black border-neutral-800 text-white hover:border-yellow-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips — sourced entirely from categories actually present on the loaded
          hackathons (see `allCategories` above), never a fixed hardcoded list. Same compact,
          horizontal-scrolling treatment as Status. */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Category</p>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 transition-colors shrink-0 whitespace-nowrap ${
              activeCategory === null ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-black border-neutral-800 text-white hover:border-yellow-400'
            }`}
          >
            All
          </button>
          {allCategories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 transition-colors shrink-0 whitespace-nowrap ${
                activeCategory === c ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-black border-neutral-800 text-white hover:border-yellow-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Everything else (Year, Domain, Mode, Less Than 10 Days, Bookmarked Only) lives in the
          Filters drawer below — Sort stays visible here since it's used often enough to warrant
          not being hidden a tap away. */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setFiltersOpen(true)}
          className="relative flex items-center gap-1.5 px-4 py-2 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:border-yellow-400 transition-colors shrink-0"
        >
          <SlidersHorizontal size={13} /> Filters
          {activeSecondaryFilterCount > 0 && (
            <span className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-yellow-400 text-white text-[9px] font-black">{activeSecondaryFilterCount}</span>
          )}
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="flex-1 min-w-0 px-4 py-2 bg-black border-2 border-neutral-800 rounded-full text-[9px] font-bold uppercase tracking-widest text-white outline-none hover:border-yellow-400 transition-colors"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
        </select>
      </div>

      {/* Filters drawer — Year, Domain, Mode, Less Than 10 Days, Bookmarked Only. A bottom sheet
          on mobile (where reachability matters most), a centered panel on larger screens; same
          black/border-4/rounded-[32px] modal language already used elsewhere in the app. */}
      {filtersOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="bg-black border-4 border-neutral-800 rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-6 sm:p-8 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Filters</h3>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="p-2 text-neutral-400 hover:text-white bg-neutral-900 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              {allYears.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Year</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveYear(null)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-colors ${
                        activeYear === null ? 'bg-neutral-100 border-neutral-100 text-black' : 'bg-neutral-900 border-neutral-800 text-white hover:border-neutral-400'
                      }`}
                    >
                      All Years
                    </button>
                    {allYears.map((y) => (
                      <button
                        key={y}
                        onClick={() => setActiveYear(y)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-colors ${
                          activeYear === y ? 'bg-neutral-100 border-neutral-100 text-black' : 'bg-neutral-900 border-neutral-800 text-white hover:border-neutral-400'
                        }`}
                      >
                        Year {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Domain</p>
                  <select
                    value={activeDomain}
                    onChange={(e) => setActiveDomain(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white outline-none hover:border-yellow-400 transition-colors"
                  >
                    <option value="All Domains">All Domains</option>
                    {allDomains.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Mode</p>
                  <select
                    value={activeMode}
                    onChange={(e) => setActiveMode(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white outline-none hover:border-yellow-400 transition-colors"
                  >
                    <option value="All Modes">All Modes</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl cursor-pointer">
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Less Than 10 Days</span>
                  <input type="checkbox" checked={lessThan10Days} onChange={(e) => setLessThan10Days(e.target.checked)} className="w-5 h-5 accent-yellow-400" />
                </label>
                <label className="flex items-center justify-between p-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl cursor-pointer">
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Bookmarked Only</span>
                  <input type="checkbox" checked={bookmarkedOnly} onChange={(e) => setBookmarkedOnly(e.target.checked)} className="w-5 h-5 accent-yellow-400" />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-800">
              <button
                onClick={() => { setActiveYear(null); setActiveDomain('All Domains'); setActiveMode('All Modes'); setLessThan10Days(false); setBookmarkedOnly(false); }}
                className="flex-1 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:border-yellow-400 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setFiltersOpen(false)}
                className="flex-1 py-3 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <h2 className="text-xl font-black uppercase tracking-widest text-white">All Hackathons <span className="text-neutral-500 text-sm">({sortedHackathons.length})</span></h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-neutral-500">
          <Loader2 className="animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest">Loading competitions...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-red-400 text-sm font-bold uppercase tracking-widest">Unable to load competitions</p>
          <p className="text-neutral-500 text-xs">{error}</p>
          <button
            onClick={() => setReloadToken((t) => t + 1)}
            className="px-6 py-3 bg-neutral-900 border-2 border-neutral-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : sortedHackathons.length === 0 ? (
        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest text-center py-20">
          {hackathons.length === 0 ? 'No competitions found.' : 'No competitions match these filters.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {pagedHackathons.map((h) => {
              const es = deriveExploreStatus(h);
              const compDate = competitionDate(h);
              const registeredTeams = h.external_registered_teams ?? h.registered_count;
              return (
                <div key={h.id} className="bg-black rounded-[32px] border-4 border-neutral-800 flex flex-col hover:border-yellow-400 transition-colors group overflow-hidden">
                  <div className="w-full h-40 bg-neutral-900 relative flex items-center justify-center border-b-2 border-neutral-800">
                    <div className="w-16 h-16 border-4 border-neutral-800 rounded-full flex items-center justify-center text-neutral-400 font-bold uppercase text-[10px]">Image</div>
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <span className="px-3 py-1 bg-neutral-900 text-white text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                        {h.organizer}
                      </span>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded ${STATUS_BADGE_CLASS[es.key]}`}>
                          {es.label}
                        </span>
                        {es.daysLeft !== null && (
                          <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-green-500 bg-neutral-900 rounded border border-neutral-800">
                            {es.daysLeft > 0 ? `${es.daysLeft} day${es.daysLeft === 1 ? '' : 's'} left` : 'Closing today'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleBookmark(h)}
                      disabled={pendingBookmark === h.id}
                      aria-label={h.bookmarked ? 'Remove bookmark' : 'Bookmark competition'}
                      className={`absolute bottom-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors disabled:opacity-60 ${h.bookmarked ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-black/70 border-neutral-700 text-neutral-300 hover:border-yellow-400'}`}
                    >
                      <Bookmark size={14} fill={h.bookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-black leading-tight mb-3 group-hover:text-yellow-400 transition-colors">{h.title}</h3>

                    {h.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {h.categories.map((c) => (
                          <span key={c} className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-4 mt-1">
                      {h.domains.map((d) => (
                        <span key={d} className="px-2 py-1 bg-yellow-400/10 text-yellow-400 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-yellow-400/20">
                          {d}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs mb-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Prize Pool</span>
                        <span className="font-mono font-bold text-white">{h.prize_pool ?? '—'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Eligible Years</span>
                        <span className="font-mono font-bold text-white">{h.eligible_years.length ? h.eligible_years.join(', ') : 'All'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Reg. Deadline</span>
                        <span className="font-mono font-bold text-white">{h.registration_closes_at ? new Date(h.registration_closes_at).toLocaleDateString() : 'TBA'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Competition Date</span>
                        <span className="font-mono font-bold text-white">{compDate ? new Date(compDate).toLocaleDateString() : 'TBA'}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-neutral-800 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Mode</span>
                        <span className="font-mono font-bold text-sm text-white capitalize">{h.mode}</span>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Registered</span>
                        <span className="font-mono font-bold text-sm text-white">{registeredTeams}</span>
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

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-800 text-white disabled:opacity-40 hover:border-yellow-400 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Page {currentPage} of {pageCount}</span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-800 text-white disabled:opacity-40 hover:border-yellow-400 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
