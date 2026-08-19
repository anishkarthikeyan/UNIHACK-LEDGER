import React, { useEffect, useState } from 'react';
import { ChevronLeft, Loader2, CheckCircle2, Plus, Trash2, Tag, Building2, Calendar } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Hackathon, HackathonCategory, Organizer, HackathonRound } from '../types';
import type { NavigateFn } from '../App';

interface HackathonEditFormProps {
  hackathonId?: string;
  onNavigate?: NavigateFn;
}

const STATUS_OPTIONS: Hackathon['status'][] = ['draft', 'pending_review', 'published', 'registration_closed', 'ongoing', 'completed', 'archived'];

function field(label: string, value: string, onChange: (v: string) => void, opts?: { type?: string; placeholder?: string; textarea?: boolean; rows?: number }) {
  const cls = 'w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-bold outline-none focus:border-yellow-400 transition-colors';
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">{label}</label>
      {opts?.textarea ? (
        <textarea rows={opts.rows ?? 3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={opts?.placeholder} className={`${cls} resize-none font-medium`} />
      ) : (
        <input type={opts?.type ?? 'text'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={opts?.placeholder} className={cls} />
      )}
    </div>
  );
}

export default function HackathonEditForm({ hackathonId, onNavigate }: HackathonEditFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [allCategories, setAllCategories] = useState<HackathonCategory[]>([]);
  const [allOrganizers, setAllOrganizers] = useState<Organizer[]>([]);

  // Core fields
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [mode, setMode] = useState<'online' | 'offline' | 'hybrid'>('offline');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [communityUrl, setCommunityUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [brochureUrl, setBrochureUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [rules, setRules] = useState('');
  const [judgingCriteria, setJudgingCriteria] = useState('');
  const [problemStatements, setProblemStatements] = useState('');
  const [faq, setFaq] = useState('');
  const [domains, setDomains] = useState('');
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [soloAllowed, setSoloAllowed] = useState(true);
  const [registrationOpensAt, setRegistrationOpensAt] = useState('');
  const [registrationClosesAt, setRegistrationClosesAt] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [status, setStatus] = useState<Hackathon['status']>('draft');
  const [eligibleYears, setEligibleYears] = useState<number[]>([]);
  const [eligibilityLabels, setEligibilityLabels] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedOrganizerIds, setSelectedOrganizerIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newOrganizerName, setNewOrganizerName] = useState('');

  // Rounds
  const [rounds, setRounds] = useState<HackathonRound[]>([]);
  const [roundName, setRoundName] = useState('');
  const [roundSequence, setRoundSequence] = useState(1);
  const [roundStartsAt, setRoundStartsAt] = useState('');
  const [roundInstructions, setRoundInstructions] = useState('');
  const [savingRound, setSavingRound] = useState(false);

  const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

  useEffect(() => {
    if (!hackathonId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([api.hackathons.get(hackathonId), api.categories.list(), api.organizers.list()])
      .then(([h, cats, orgs]) => {
        setHackathon(h);
        setAllCategories(cats);
        setAllOrganizers(orgs);
        setTitle(h.title); setOrganizer(h.organizer); setDescription(h.description); setShortDescription(h.short_description ?? '');
        setMode(h.mode); setVenue(h.venue ?? ''); setCity(h.city ?? ''); setState(h.state ?? ''); setCountry(h.country ?? '');
        setPrizePool(h.prize_pool ?? ''); setOfficialUrl(h.official_url ?? ''); setRegistrationUrl(h.registration_url ?? '');
        setCommunityUrl(h.community_url ?? ''); setBannerImageUrl(h.banner_image_url ?? ''); setBrochureUrl(h.brochure_url ?? '');
        setContactName(h.contact_name ?? ''); setContactEmail(h.contact_email ?? ''); setContactPhone(h.contact_phone ?? '');
        setRules(h.rules ?? ''); setJudgingCriteria(h.judging_criteria ?? ''); setProblemStatements(h.problem_statements ?? ''); setFaq(h.faq ?? '');
        setDomains(h.domains.join(', ')); setMinTeamSize(h.min_team_size); setMaxTeamSize(h.max_team_size); setSoloAllowed(h.solo_allowed);
        setRegistrationOpensAt(toLocalInput(h.registration_opens_at)); setRegistrationClosesAt(toLocalInput(h.registration_closes_at));
        setStartsAt(toLocalInput(h.starts_at)); setEndsAt(toLocalInput(h.ends_at)); setStatus(h.status);
        setEligibleYears(h.eligibility.filter((e) => e.year !== null).map((e) => e.year as number));
        setEligibilityLabels(h.eligibility.filter((e) => e.label !== null).map((e) => e.label as string).join(', '));
        setSelectedCategoryIds(cats.filter((c) => h.categories.includes(c.name)).map((c) => c.id));
        setSelectedOrganizerIds(orgs.filter((o) => h.organizers.includes(o.name)).map((o) => o.id));
        setRounds(h.timeline);
        setRoundSequence(h.timeline.length + 1);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load hackathon.'))
      .finally(() => setLoading(false));
  }, [hackathonId]);

  const toggleCategory = (id: string) => setSelectedCategoryIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  const toggleOrganizer = (id: string) => setSelectedOrganizerIds((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);
  const toggleYear = (y: number) => setEligibleYears((prev) => prev.includes(y) ? prev.filter((v) => v !== y) : [...prev, y].sort());

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await api.categories.create(newCategoryName.trim());
      setAllCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedCategoryIds((prev) => [...prev, created.id]);
      setNewCategoryName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add category.');
    }
  };

  const addOrganizer = async () => {
    if (!newOrganizerName.trim()) return;
    try {
      const created = await api.organizers.create(newOrganizerName.trim());
      setAllOrganizers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedOrganizerIds((prev) => [...prev, created.id]);
      setNewOrganizerName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add organizer.');
    }
  };

  const addRound = async () => {
    if (!hackathonId || !roundName.trim() || !roundStartsAt) { setError('Round name and start date are required.'); return; }
    setSavingRound(true);
    setError(null);
    try {
      const created = await api.hackathons.addRound(hackathonId, {
        name: roundName.trim(), sequence: roundSequence, startsAt: new Date(roundStartsAt).toISOString(), instructions: roundInstructions || undefined,
      });
      setRounds((prev) => [...prev.filter((r) => r.sequence !== created.sequence), created].sort((a, b) => a.sequence - b.sequence));
      setRoundName(''); setRoundInstructions(''); setRoundStartsAt(''); setRoundSequence(rounds.length + 2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save round.');
    } finally {
      setSavingRound(false);
    }
  };

  const removeRound = async (roundId: string) => {
    if (!hackathonId) return;
    try {
      await api.hackathons.removeRound(hackathonId, roundId);
      setRounds((prev) => prev.filter((r) => r.id !== roundId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove round.');
    }
  };

  const save = async () => {
    if (!hackathonId) return;
    if (maxTeamSize < minTeamSize) { setError('Maximum team size must be at least the minimum.'); return; }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.hackathons.update(hackathonId, {
        title: title.trim(), organizer: organizer.trim(), description: description.trim(), shortDescription: shortDescription || undefined,
        mode, venue: venue || undefined, city: city || undefined, state: state || undefined, country: country || undefined,
        prizePool: prizePool || undefined, officialUrl: officialUrl || undefined, registrationUrl: registrationUrl || undefined,
        communityUrl: communityUrl || undefined, bannerImageUrl: bannerImageUrl || undefined, brochureUrl: brochureUrl || undefined,
        contactName: contactName || undefined, contactEmail: contactEmail || undefined, contactPhone: contactPhone || undefined,
        rules: rules || undefined, judgingCriteria: judgingCriteria || undefined, problemStatements: problemStatements || undefined, faq: faq || undefined,
        domains: domains.split(',').map((d) => d.trim()).filter(Boolean),
        minTeamSize, maxTeamSize, soloAllowed,
        registrationOpensAt: registrationOpensAt ? new Date(registrationOpensAt).toISOString() : undefined,
        registrationClosesAt: registrationClosesAt ? new Date(registrationClosesAt).toISOString() : undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        status,
      });
      await Promise.all([
        api.hackathons.setCategories(hackathonId, selectedCategoryIds),
        api.hackathons.setOrganizers(hackathonId, selectedOrganizerIds),
        api.hackathons.setEligibility(hackathonId, eligibleYears, eligibilityLabels.split(',').map((l) => l.trim()).filter(Boolean)),
      ]);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  if (!hackathon) {
    return <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">{error ?? 'Select a hackathon to edit.'}</p>;
  }

  const sectionCls = 'bg-black rounded-[32px] border-4 border-neutral-800 p-8 space-y-6';
  const headingCls = 'text-lg font-black uppercase tracking-widest text-white mb-2';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <button onClick={() => onNavigate?.('hackathons-detail', hackathonId)} className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-2 flex items-center gap-1 transition-colors">
            <ChevronLeft size={14} /> Back to Details
          </button>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Edit Hackathon</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">{hackathon.title}</p>
        </div>
        <div className="flex items-center gap-4">
          {saved && <span className="text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={14} /> Saved</span>}
          <button onClick={save} disabled={saving} className="px-8 py-4 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-95 transition-transform flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Save All Changes
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className={sectionCls}>
        <h2 className={headingCls}>Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {field('Title', title, setTitle)}
          {field('Organizer', organizer, setOrganizer)}
        </div>
        {field('Short Description', shortDescription, setShortDescription, { textarea: true, rows: 2 })}
        {field('Full Description', description, setDescription, { textarea: true, rows: 4 })}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-bold outline-none focus:border-yellow-400 appearance-none">
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          {field('Venue', venue, setVenue)}
          {field('City', city, setCity)}
          {field('State', state, setState)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {field('Country', country, setCountry)}
          {field('Prize Pool', prizePool, setPrizePool, { placeholder: 'e.g. ₹50,000' })}
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className={headingCls}>Links & Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {field('Official Website URL', officialUrl, setOfficialUrl, { type: 'url', placeholder: 'https://' })}
          {field('Registration Page URL', registrationUrl, setRegistrationUrl, { type: 'url', placeholder: 'https://' })}
          {field('Community URL', communityUrl, setCommunityUrl, { type: 'url', placeholder: 'https://' })}
          {field('Banner Image URL', bannerImageUrl, setBannerImageUrl, { type: 'url', placeholder: 'https://' })}
          {field('Brochure URL', brochureUrl, setBrochureUrl, { type: 'url', placeholder: 'https://' })}
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className={headingCls}>Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {field('Contact Name', contactName, setContactName)}
          {field('Contact Email', contactEmail, setContactEmail, { type: 'email' })}
          {field('Contact Phone', contactPhone, setContactPhone, { type: 'tel' })}
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className={headingCls}>Rules & Judging</h2>
        {field('Problem Statements', problemStatements, setProblemStatements, { textarea: true, rows: 3 })}
        {field('Rules', rules, setRules, { textarea: true, rows: 3 })}
        {field('Judging Criteria', judgingCriteria, setJudgingCriteria, { textarea: true, rows: 3 })}
        {field('FAQ', faq, setFaq, { textarea: true, rows: 3 })}
      </div>

      <div className={sectionCls}>
        <h2 className={headingCls}>Team Rules & Eligibility</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Min Team Size</label>
            <input type="number" min={1} value={minTeamSize} onChange={(e) => setMinTeamSize(Number(e.target.value))} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-bold outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Max Team Size</label>
            <input type="number" min={1} value={maxTeamSize} onChange={(e) => setMaxTeamSize(Number(e.target.value))} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-bold outline-none focus:border-yellow-400" />
          </div>
          <label className="flex items-center gap-3 mt-7 cursor-pointer">
            <input type="checkbox" checked={soloAllowed} onChange={(e) => setSoloAllowed(e.target.checked)} className="w-4 h-4 accent-yellow-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Allow Solo Participation</span>
          </label>
        </div>
        {field('Domains (comma separated)', domains, setDomains, { placeholder: 'AI, Web3, Sustainability' })}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Eligible Years</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => (
              <button key={y} type="button" onClick={() => toggleYear(y)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border-2 transition-colors ${eligibleYears.includes(y) ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}>
                Year {y}
              </button>
            ))}
          </div>
        </div>
        {field('Other Eligibility Labels (comma separated)', eligibilityLabels, setEligibilityLabels, { placeholder: 'e.g. Open to alumni, Cross-institution teams allowed' })}
      </div>

      <div className={sectionCls}>
        <h2 className={`${headingCls} flex items-center gap-2`}><Tag size={18} className="text-yellow-400" /> Categories</h2>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((c) => (
            <button key={c.id} type="button" onClick={() => toggleCategory(c.id)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border-2 transition-colors ${selectedCategoryIds.includes(c.id) ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" className="flex-1 px-4 py-2 bg-neutral-900 border-2 border-neutral-800 rounded-full text-xs text-white outline-none focus:border-yellow-400" />
          <button onClick={addCategory} className="w-9 h-9 rounded-full bg-yellow-400 text-white flex items-center justify-center hover:scale-95 transition-transform shrink-0"><Plus size={16} /></button>
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className={`${headingCls} flex items-center gap-2`}><Building2 size={18} className="text-yellow-400" /> Organizers</h2>
        <div className="flex flex-wrap gap-2">
          {allOrganizers.map((o) => (
            <button key={o.id} type="button" onClick={() => toggleOrganizer(o.id)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border-2 transition-colors ${selectedOrganizerIds.includes(o.id) ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}>
              {o.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newOrganizerName} onChange={(e) => setNewOrganizerName(e.target.value)} placeholder="New organizer name" className="flex-1 px-4 py-2 bg-neutral-900 border-2 border-neutral-800 rounded-full text-xs text-white outline-none focus:border-yellow-400" />
          <button onClick={addOrganizer} className="w-9 h-9 rounded-full bg-yellow-400 text-white flex items-center justify-center hover:scale-95 transition-transform shrink-0"><Plus size={16} /></button>
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className={headingCls}>Schedule & Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Registration Opens</label>
            <input type="datetime-local" value={registrationOpensAt} onChange={(e) => setRegistrationOpensAt(e.target.value)} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-mono font-bold outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Registration Closes</label>
            <input type="datetime-local" value={registrationClosesAt} onChange={(e) => setRegistrationClosesAt(e.target.value)} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-mono font-bold outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Event Starts</label>
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-mono font-bold outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Event Ends</label>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-mono font-bold outline-none focus:border-yellow-400" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Hackathon['status'])} className="w-full md:w-64 px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-bold outline-none focus:border-yellow-400 appearance-none">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className={`${headingCls} flex items-center gap-2`}><Calendar size={18} className="text-yellow-400" /> Rounds / Timeline</h2>
        <div className="space-y-3">
          {rounds.length === 0 ? (
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No rounds added yet.</p>
          ) : rounds.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4">
              <div>
                <p className="text-sm font-bold text-white">#{r.sequence} — {r.name}</p>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mt-1">{new Date(r.startsAt).toLocaleString()}</p>
                {r.instructions && <p className="text-xs text-neutral-400 mt-1">{r.instructions}</p>}
              </div>
              <button onClick={() => removeRound(r.id)} className="text-red-400 hover:text-red-300 shrink-0"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-800">
          <input value={roundName} onChange={(e) => setRoundName(e.target.value)} placeholder="Round name" className="px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-bold outline-none focus:border-yellow-400" />
          <input type="number" min={1} value={roundSequence} onChange={(e) => setRoundSequence(Number(e.target.value))} placeholder="Sequence" className="px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-bold outline-none focus:border-yellow-400" />
          <input type="datetime-local" value={roundStartsAt} onChange={(e) => setRoundStartsAt(e.target.value)} className="px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white font-mono font-bold outline-none focus:border-yellow-400" />
          <button onClick={addRound} disabled={savingRound} className="px-4 py-3 bg-yellow-400 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2">
            {savingRound ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Round
          </button>
        </div>
        <input value={roundInstructions} onChange={(e) => setRoundInstructions(e.target.value)} placeholder="Round instructions (optional)" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white outline-none focus:border-yellow-400" />
      </div>
    </div>
  );
}
