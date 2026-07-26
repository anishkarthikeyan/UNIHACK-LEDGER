import React, { useState } from 'react';
import { ChevronLeft, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { NavigateFn } from '../App';

interface StudentTeamFormProps {
  onNavigate?: NavigateFn;
}

export default function StudentTeamForm({ onNavigate }: StudentTeamFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domains, setDomains] = useState('');
  const [techStack, setTechStack] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [joinMode, setJoinMode] = useState<'invite' | 'request' | 'open'>('invite');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) { setError('Team name is required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.teams.create({
        name: name.trim(),
        description: description.trim() || undefined,
        maxMembers,
        visibility,
        joinMode,
        domains: domains.split(',').map((d) => d.trim()).filter(Boolean),
        techStack: techStack.split(',').map((d) => d.trim()).filter(Boolean),
      });
      onNavigate?.('teams');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create team.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-8">
        <div>
          <button
            onClick={() => onNavigate?.('teams')}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-2 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Teams
          </button>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Create New Team</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Form a group for upcoming hackathons</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={submit}
            disabled={submitting}
            className="px-6 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Save Team
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-8 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <Users size={18} className="text-yellow-400" /> Team Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Team Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Quantum Coders"
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is your team's focus and goal?"
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white transition-colors resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Preferred Domains</label>
                  <input
                    type="text"
                    value={domains}
                    onChange={(e) => setDomains(e.target.value)}
                    placeholder="e.g. AI, Web3, FinTech"
                    className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Tech Stack</label>
                  <input
                    type="text"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    placeholder="e.g. React, Node, Python"
                    className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Max Members</label>
                <select
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none"
                >
                  {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-2">
            Once your team is created, invite members from the Teams page or share it as an open team.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6">
            <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Visibility Settings</h3>
            <div className="space-y-3">
              {[
                { id: 'public', label: 'Public', desc: 'Anyone can find this team.' },
                { id: 'private', label: 'Private', desc: 'Hidden from search.' },
              ].map((opt) => (
                <label key={opt.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  visibility === opt.id ? 'border-yellow-400 bg-yellow-400/5' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                }`}>
                  <input
                    type="radio"
                    name="visibility"
                    value={opt.id}
                    checked={visibility === opt.id}
                    onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                    className="mt-1 accent-yellow-400"
                  />
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${visibility === opt.id ? 'text-yellow-400' : 'text-white'}`}>{opt.label}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6">
            <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Join Mode</h3>
            <div className="space-y-3">
              {[
                { id: 'invite', label: 'Invite Only', desc: 'You add members manually later.' },
                { id: 'open', label: 'Open', desc: 'Any student can join directly while there is space.' },
                { id: 'request', label: 'Request to Join', desc: 'Listed as requestable (approval flow coming soon).' },
              ].map((opt) => (
                <label key={opt.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  joinMode === opt.id ? 'border-yellow-400 bg-yellow-400/5' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                }`}>
                  <input
                    type="radio"
                    name="joinMode"
                    value={opt.id}
                    checked={joinMode === opt.id}
                    onChange={(e) => setJoinMode(e.target.value as 'invite' | 'request' | 'open')}
                    className="mt-1 accent-yellow-400"
                  />
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${joinMode === opt.id ? 'text-yellow-400' : 'text-white'}`}>{opt.label}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
