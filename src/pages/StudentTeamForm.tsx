import React, { useState } from 'react';
import { ChevronLeft, Users, CheckCircle2, Loader2, UserPlus, X, Shield, Send } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { StudentLookup } from '../types';
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
  const { user } = useAuth();
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<StudentLookup[]>([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const addMember = async () => {
    const regNo = memberInput.trim().toUpperCase();
    if (!regNo) return;
    setMemberError(null);
    if (members.some((m) => m.institutional_id.toUpperCase() === regNo)) { setMemberError(`${regNo} is already added.`); return; }
    if (members.length + 1 >= maxMembers) { setMemberError(`A team of ${maxMembers} can have ${maxMembers - 1} members besides you. Increase Max Members to add more.`); return; }
    setLookingUp(true);
    try {
      const student = await api.teams.lookupMember(regNo);
      setMembers((prev) => [...prev, student]);
      setMemberInput('');
    } catch (err) {
      setMemberError(err instanceof ApiError ? err.message : 'Could not find that student.');
    } finally {
      setLookingUp(false);
    }
  };

  const removeMember = (regNo: string) => setMembers((prev) => prev.filter((m) => m.institutional_id !== regNo));

  const review = () => {
    if (!name.trim()) { setError('Team name is required.'); return; }
    if (members.length + 1 > maxMembers) { setError(`You've added more members than a team of ${maxMembers} allows.`); return; }
    setError(null);
    setConfirmOpen(true);
  };

  const submit = async () => {
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
        memberIds: members.map((m) => m.institutional_id),
      });
      onNavigate?.('teams');
    } catch (err) {
      setConfirmOpen(false);
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">Create New Team</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Form a group for upcoming hackathons</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={review}
            disabled={submitting}
            className="px-6 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
          >
            <CheckCircle2 size={16} /> Create Team
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

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-8 space-y-5">
            <div>
              <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
                <UserPlus size={18} className="text-yellow-400" /> Team Members
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-2">
                Add teammates by register number. Each one gets an invitation and joins only after accepting.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={memberInput}
                onChange={(e) => { setMemberInput(e.target.value); setMemberError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }}
                placeholder="Register number, e.g. 24CS0063"
                className="flex-1 min-w-0 px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold uppercase placeholder:normal-case transition-colors"
              />
              <button
                onClick={addMember}
                disabled={lookingUp || !memberInput.trim()}
                className="px-5 py-3 bg-yellow-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center gap-2 disabled:opacity-60 shrink-0"
              >
                {lookingUp ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Add
              </button>
            </div>
            {memberError && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{memberError}</p>}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield size={14} className="text-yellow-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white break-words">{user?.full_name ?? 'You'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{user?.institutional_id}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 shrink-0">Leader (you)</span>
              </div>
              {members.map((m) => (
                <div key={m.institutional_id} className="flex items-center justify-between gap-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white break-words">{m.full_name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      {m.institutional_id}{m.section ? ` · Section ${m.section}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMember(m.institutional_id)}
                    className="w-8 h-8 rounded-full bg-black border border-neutral-700 flex items-center justify-center text-red-400 hover:bg-red-400 hover:text-white transition-colors shrink-0"
                    aria-label={`Remove ${m.institutional_id}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              {members.length + 1}/{maxMembers} slots filled
            </p>
          </div>
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
                { id: 'request', label: 'Request to Join', desc: 'Students can request to join; you approve or decline each request.' },
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

      {confirmOpen && (
        <div
          onClick={() => !submitting && setConfirmOpen(false)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-black uppercase tracking-wider text-white">Confirm team</h2>
            <p className="text-xs text-neutral-400 mt-2">
              <span className="font-bold text-white">{name.trim()}</span> · up to {maxMembers} members
            </p>

            {members.length > 0 ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-5 mb-2">Invitations will be sent to</p>
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.institutional_id} className="flex items-center justify-between gap-3 bg-black border border-neutral-800 rounded-xl px-4 py-2.5">
                      <p className="text-xs font-bold text-white break-words min-w-0">{m.full_name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 shrink-0">{m.institutional_id}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mt-4">
                  They join the team only after accepting. Until then you'll see "Invitation pending".
                </p>
              </>
            ) : (
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-5">
                No members added — you can invite teammates later from My Teams.
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-full bg-neutral-800 text-neutral-200 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-700 transition-colors disabled:opacity-60"
              >
                Back
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 py-3 rounded-full bg-yellow-400 text-white text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {members.length > 0 ? 'Confirm & send invites' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
