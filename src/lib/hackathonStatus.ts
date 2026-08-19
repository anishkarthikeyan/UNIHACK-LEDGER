// Single source of truth for the student-facing registration/event status shown on
// ExploreHackathons.tsx, StudentHackathonDetail.tsx, and StudentPipeline.tsx (Stage 3.6/3.7).
// Extracted verbatim out of ExploreHackathons.tsx — same behavior, same output, just usable from
// more than one page so no two screens can ever drift into showing different statuses for the
// same hackathon.
//
// `deriveExploreStatus` takes a minimal structural shape (`HackathonStatusInput`) rather than the
// full `Hackathon` type specifically so StudentPipeline.tsx can call it too: `GET
// /registrations/mine` only returns a subset of hackathon fields (registration_closes_at,
// starts_at, ends_at — not registration_opens_at or the rounds timeline; extending that query is
// explicitly out of scope for Stage 3.7, tracked separately as "Gap 6"). The full `Hackathon` type
// already satisfies this shape structurally, so Explore/Detail's existing calls are unaffected.
// Pipeline passes `registration_opens_at: null` and `timeline: []` for the fields it doesn't have
// — both are always null/empty for every real CSV-imported competition today anyway, so this is a
// documented, currently-invisible limitation (not a behavior change) rather than a workaround:
// once Gap 6 exposes rounds data to Pipeline, passing the real timeline through here is the only
// change needed for full accuracy.
export interface HackathonStatusInput {
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  timeline: { startsAt: string | null }[];
}

// The institution's deadlines are meant as Indian calendar dates (the CSV's Reg. Deadline etc.
// are DD-MM-YY with no time/timezone attached — see the import audit). Railway's Postgres session
// timezone is UTC while local dev's is IST, so the exact same date-only CSV value can land on a
// stored instant anywhere from IST-midnight to UTC-midnight depending on which database wrote
// it — up to 5.5 hours apart — even though both are meant to mean "this calendar date" to a
// student. Comparing full timestamps here would make registration look like it closes hours
// before the date on the card promises (or the reverse). So every timestamp coming out of the
// API is truncated to its calendar-date portion (`YYYY-MM-DD`) and compared as a *date*, never as
// an instant — "today" is likewise computed as today's IST calendar date, not the raw local clock.
export function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
export function dateOnly(iso: string | null): string | null {
  return iso ? iso.slice(0, 10) : null;
}
export function daysBetweenDates(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split('-').map(Number);
  const [ty, tm, td] = toDate.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

// A competition is "closing soon" once its registration deadline is this many days out or less.
// This is the same 10-day threshold as Explore's "Less Than 10 Days" filter — both describe the
// identical real-time condition, just exposed as two different controls.
export const CLOSING_SOON_THRESHOLD_DAYS = 10;

export type ExploreStatusKey = 'open' | 'closing_soon' | 'upcoming' | 'ongoing' | 'ended';
export type StatusFilterKey = 'ALL' | 'OPEN' | 'CLOSING SOON' | 'UPCOMING' | 'ONGOING' | 'ENDED';

export interface ExploreStatus {
  key: ExploreStatusKey;
  label: string;
  /** Days until registration_closes_at — only set for 'open'/'closing_soon'. */
  daysLeft: number | null;
  filterBucket: Exclude<StatusFilterKey, 'ALL'>;
  /** Default sort-order tier: lower shows first (Open → Closing Soon → Upcoming → Ongoing → Ended). */
  priority: number;
}

/** Computes the student-facing registration/event status live, from real dates vs. today — never
 * from the CSV's static "Remaining Days" figures (never even imported, see the import audit) and
 * never from a status label computed once at import time, so it stays correct as days pass
 * without needing a re-import.
 *
 *  OPEN          registration available, deadline more than 10 days away
 *  CLOSING SOON  registration available, deadline within the next 10 days
 *  UPCOMING      registration not currently available and the event hasn't started yet
 *  ONGOING       registration not currently available and the event is currently happening
 *  ENDED         registration/event has finished (or nothing about it is knowable) — the
 *                student can no longer participate
 */
export function deriveExploreStatus(h: HackathonStatusInput): ExploreStatus {
  const today = todayIST();
  const regOpen = dateOnly(h.registration_opens_at);
  const regClose = dateOnly(h.registration_closes_at);
  const knownDates = [...h.timeline.map((t) => dateOnly(t.startsAt)), dateOnly(h.starts_at), dateOnly(h.ends_at)]
    .filter((d): d is string => Boolean(d))
    .sort();
  const earliestKnownDate = knownDates[0] ?? null;
  const latestKnownDate = knownDates[knownDates.length - 1] ?? null;

  const registrationAvailable = (!regOpen || regOpen <= today) && regClose !== null && regClose >= today;
  if (registrationAvailable) {
    const daysLeft = daysBetweenDates(today, regClose as string);
    return daysLeft <= CLOSING_SOON_THRESHOLD_DAYS
      ? { key: 'closing_soon', label: 'Closing Soon', daysLeft, filterBucket: 'CLOSING SOON', priority: 1 }
      : { key: 'open', label: 'Registration Open', daysLeft, filterBucket: 'OPEN', priority: 0 };
  }

  // Registration isn't currently available (not yet open, already closed, or no deadline known
  // at all) — fall back to whatever real event dates exist to say whether it hasn't started yet,
  // is happening right now, or has fully concluded. With no event-date signal at all, the safest
  // conclusion (matching "the student can no longer participate") is ended.
  if (earliestKnownDate === null && latestKnownDate === null) {
    return { key: 'ended', label: 'Ended', daysLeft: null, filterBucket: 'ENDED', priority: 4 };
  }
  if (earliestKnownDate && earliestKnownDate > today) {
    return { key: 'upcoming', label: 'Upcoming', daysLeft: null, filterBucket: 'UPCOMING', priority: 2 };
  }
  if (latestKnownDate && latestKnownDate >= today) {
    return { key: 'ongoing', label: 'Ongoing', daysLeft: null, filterBucket: 'ONGOING', priority: 3 };
  }
  return { key: 'ended', label: 'Ended', daysLeft: null, filterBucket: 'ENDED', priority: 4 };
}

export const STATUS_BADGE_CLASS: Record<ExploreStatusKey, string> = {
  open: 'bg-yellow-400 text-white',
  closing_soon: 'bg-orange-500 text-white',
  upcoming: 'bg-neutral-800 text-yellow-400 border border-yellow-400/40',
  ongoing: 'bg-green-500 text-white',
  ended: 'bg-neutral-700 text-neutral-400',
};

export const STATUS_FILTER_ACTIVE_CLASS: Record<StatusFilterKey, string> = {
  ALL: 'bg-neutral-100 border-neutral-100 text-black',
  OPEN: 'bg-yellow-400 border-yellow-400 text-white',
  'CLOSING SOON': 'bg-orange-500 border-orange-500 text-white',
  UPCOMING: 'bg-neutral-800 border-yellow-400 text-yellow-400',
  ONGOING: 'bg-green-500 border-green-500 text-white',
  ENDED: 'bg-neutral-700 border-neutral-700 text-white',
};

export const STATUS_FILTERS: { value: StatusFilterKey; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSING SOON', label: 'Closing Soon' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'ENDED', label: 'Ended' },
];

// The short human-readable line shown alongside a status badge (StudentHackathonDetail.tsx,
// StudentPipeline.tsx) — never a bare countdown for a status where that would be misleading (an
// ended/ongoing competition never shows a positive "days left").
export function registrationSubtext(es: ExploreStatus, h: HackathonStatusInput): string {
  if (es.key === 'open' || es.key === 'closing_soon') {
    return es.daysLeft !== null && es.daysLeft > 0 ? `${es.daysLeft} day${es.daysLeft === 1 ? '' : 's'} left` : 'Closing today';
  }
  if (es.key === 'upcoming') {
    const regOpen = dateOnly(h.registration_opens_at);
    if (regOpen) {
      const days = daysBetweenDates(todayIST(), regOpen);
      if (days > 0) return `Registration opens in ${days} day${days === 1 ? '' : 's'}`;
    }
    return 'Registration not currently open';
  }
  if (es.key === 'ongoing') return 'Registration closed';
  return 'Registration ended';
}

// The registration call-to-action label for a given live status (StudentHackathonDetail.tsx).
export function ctaLabelFor(es: ExploreStatus): string {
  if (es.key === 'open' || es.key === 'closing_soon') return 'Register Now';
  if (es.key === 'upcoming') return 'Registration Not Open';
  if (es.key === 'ongoing') return 'Registration Closed';
  return 'Event Ended';
}
