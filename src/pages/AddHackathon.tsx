import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { NavigateFn } from '../App';

interface AddHackathonProps {
  onNavigate?: NavigateFn;
}

export default function AddHackathon({ onNavigate }: AddHackathonProps) {
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'online' | 'offline' | 'hybrid'>('offline');
  const [domains, setDomains] = useState('');
  const [eligibleYears, setEligibleYears] = useState('');
  const [minTeamSize, setMinTeamSize] = useState(2);
  const [maxTeamSize, setMaxTeamSize] = useState(5);
  const [soloAllowed, setSoloAllowed] = useState(false);
  const [registrationClosesAt, setRegistrationClosesAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (status: 'draft' | 'published') => {
    if (!title.trim() || !organizer.trim() || description.trim().length < 10 || !registrationClosesAt) {
      setError('Title, organizer, a description of at least 10 characters, and a registration close date are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.hackathons.create({
        title: title.trim(),
        organizer: organizer.trim(),
        description: description.trim(),
        mode,
        registrationClosesAt: new Date(registrationClosesAt).toISOString(),
        minTeamSize,
        maxTeamSize,
        soloAllowed,
        domains: domains.split(',').map((d) => d.trim()).filter(Boolean),
        eligibleYears: eligibleYears.split(',').map((y) => Number(y.trim())).filter((y) => !Number.isNaN(y)),
        status,
      });
      onNavigate?.('hackathons');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save hackathon.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500  bg-black p-8 rounded-[48px] border-4 border-neutral-800 shadow-2xl text-white">
      <div className="pb-6 border-b border-neutral-800">
        <h1 className="text-3xl font-black tracking-tighter uppercase text-yellow-400">Add New Hackathon</h1>
        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-2">Hackathons &gt; Add New</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Hackathon Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter hackathon title" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-white placeholder-neutral-600" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Organizer / Department *</label>
          <input type="text" value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="e.g. Computer Science Dept." className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-white placeholder-neutral-600" />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Short Description *</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the hackathon, theme, problem focus, and goals..."
            className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm font-medium outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all resize-none text-white placeholder-neutral-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Mode *</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as 'online' | 'offline' | 'hybrid')} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-white appearance-none">
            <option value="offline">Offline</option>
            <option value="online">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Eligible Years (comma separated)</label>
          <input type="text" value={eligibleYears} onChange={(e) => setEligibleYears(e.target.value)} placeholder="e.g. 1, 2, 3, 4" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-white placeholder-neutral-600" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Domains (comma separated)</label>
          <input type="text" value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="e.g. AI, Web3, Sustainability" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-white placeholder-neutral-600" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Team Size Rules *</label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-2xl px-4 py-2 focus-within:border-yellow-400 transition-all">
              <span className="text-[10px] font-bold uppercase text-neutral-500">Min</span>
              <input type="number" min={1} value={minTeamSize} onChange={(e) => setMinTeamSize(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold outline-none text-white" />
            </div>
            <div className="flex items-center gap-3 flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-2xl px-4 py-2 focus-within:border-yellow-400 transition-all">
              <span className="text-[10px] font-bold uppercase text-neutral-500">Max</span>
              <input type="number" min={1} value={maxTeamSize} onChange={(e) => setMaxTeamSize(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold outline-none text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-2 flex items-end">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={soloAllowed} onChange={(e) => setSoloAllowed(e.target.checked)} className="w-4 h-4 accent-yellow-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Allow Solo Participation</span>
          </label>
        </div>

        <div className="md:col-span-2 bg-neutral-900 p-6 rounded-3xl border-2 border-neutral-800 mt-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Registration Closes *</label>
          <input type="datetime-local" value={registrationClosesAt} onChange={(e) => setRegistrationClosesAt(e.target.value)} className="w-full mt-2 px-3 py-2 bg-black border border-neutral-800 rounded-xl text-sm font-mono font-bold outline-none focus:border-yellow-400 text-white" />
        </div>

        <div className="md:col-span-2 pt-8 flex justify-end gap-4">
          <button onClick={() => onNavigate?.('hackathons')} className="px-8 py-4 bg-transparent border-2 border-neutral-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-full hover:border-white transition-colors">
            Cancel
          </button>
          <button onClick={() => submit('draft')} disabled={submitting} className="px-8 py-4 bg-neutral-800 border-2 border-neutral-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-full hover:bg-neutral-700 transition-colors disabled:opacity-60 flex items-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />} Save Draft
          </button>
          <button onClick={() => submit('published')} disabled={submitting} className="px-10 py-4 bg-yellow-400 text-white text-[10px] uppercase tracking-widest font-bold rounded-full hover:scale-95 transition-transform shadow-lg shadow-yellow-400/20 disabled:opacity-60 flex items-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />} Publish
          </button>
        </div>
      </div>
    </div>
  );
}
