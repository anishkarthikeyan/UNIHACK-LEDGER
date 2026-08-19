import React, { useEffect, useState } from 'react';
import { ChevronLeft, Users, User, Shield, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Hackathon, Registration, Team } from '../types';
import type { NavigateFn } from '../App';

interface StudentRegistrationProps {
  onNavigate?: NavigateFn;
  hackathonId?: string;
}

export default function StudentRegistration({ onNavigate, hackathonId }: StudentRegistrationProps) {
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [existingRegistration, setExistingRegistration] = useState<Registration | null>(null);
  const [mode, setMode] = useState<'team' | 'solo'>('team');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [externalUrl, setExternalUrl] = useState('');
  const [agreed, setAgreed] = useState({ rules: false, eligibility: false, deadline: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      hackathonId ? api.hackathons.get(hackathonId) : Promise.resolve(null),
      api.teams.mine(),
      api.registrations.mine(),
    ]).then(([h, t, mine]) => {
      if (cancelled) return;
      setHackathon(h);
      setTeams(t);
      // Duplicate-registration prevention is enforced by the API (and a DB constraint
      // underneath), but surfacing it here — before the student fills out the form — is far
      // clearer than letting them hit a 409 after clicking submit.
      setExistingRegistration(mine.find((r) => r.hackathon_id === hackathonId && r.status !== 'rejected' && r.status !== 'withdrawn') ?? null);
      if (h && !h.solo_allowed) setMode('team');
    }).catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load registration data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hackathonId]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const allAgreed = agreed.rules && agreed.eligibility && agreed.deadline;
  const minTeamSize = hackathon?.min_team_size ?? 1;
  const maxTeamSize = hackathon?.max_team_size ?? Infinity;
  const teamSizeOk = mode !== 'team' || !selectedTeam || (selectedTeam.member_count >= minTeamSize && selectedTeam.member_count <= maxTeamSize);
  const isTeamLeader = mode !== 'team' || !selectedTeam || selectedTeam.member_role === 'leader';
  const registrationOpen = !hackathon || (
    hackathon.status === 'published'
    && (!hackathon.registration_opens_at || new Date(hackathon.registration_opens_at) <= new Date())
    && (!hackathon.registration_closes_at || new Date(hackathon.registration_closes_at) >= new Date())
  );
  const canSubmit = hackathonId && allAgreed && (mode === 'solo' || Boolean(selectedTeamId)) && teamSizeOk && isTeamLeader && registrationOpen && !existingRegistration && !submitting;

  const submit = async () => {
    if (!hackathonId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.registrations.create({
        hackathonId,
        participationMode: mode,
        teamId: mode === 'team' ? selectedTeamId : undefined,
        externalRegistrationUrl: externalUrl || undefined,
      });
      onNavigate?.('pipeline');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  const backButton = (
    <button
      onClick={() => onNavigate?.('hackathon-detail', hackathonId)}
      className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-1 transition-colors"
    >
      <ChevronLeft size={14} /> Back to Details
    </button>
  );

  if (existingRegistration) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center space-y-6 bg-black border-4 border-neutral-800 p-12 rounded-[32px] max-w-lg">
          <div className="w-20 h-20 bg-yellow-400 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(250,204,21,0.3)]">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-white">Already Registered</h2>
          <p className="text-neutral-400 text-sm">
            {existingRegistration.participation_mode === 'team' ? 'Your team has' : 'You have'} already registered for {hackathon?.title ?? 'this hackathon'} — status: <span className="text-yellow-400 font-bold uppercase">{existingRegistration.status.replace(/_/g, ' ')}</span>.
          </p>
          <button onClick={() => onNavigate?.('pipeline')} className="w-full py-4 bg-neutral-900 text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-neutral-700 transition-colors">
            View in My Pipeline
          </button>
        </div>
      </div>
    );
  }

  if (!registrationOpen) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 ">
        <div className="border-b border-neutral-800 pb-8">
          {backButton}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">Registration</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">{hackathon?.title}</p>
        </div>
        <div className="bg-black border-4 border-red-500/40 rounded-[32px] p-8 flex items-start gap-4">
          <AlertCircle size={24} className="text-red-400 shrink-0 mt-1" />
          <div>
            <h3 className="font-black uppercase tracking-widest text-sm text-white mb-2">Registration Closed</h3>
            <p className="text-sm text-neutral-400">
              {hackathon?.status !== 'published'
                ? 'This hackathon is not currently accepting new registrations.'
                : 'The registration window for this hackathon is not currently open.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div className="border-b border-neutral-800 pb-8">
        {backButton}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">Registration</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">{hackathon?.title ?? 'Select a hackathon to register'}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-white">Participation Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`cursor-pointer flex items-start gap-4 p-6 rounded-[32px] border-4 transition-all ${
            mode === 'team' ? 'border-yellow-400 bg-yellow-400/5' : 'border-neutral-800 bg-black hover:border-neutral-700'
          }`}>
            <input type="radio" name="mode" value="team" checked={mode === 'team'} onChange={() => setMode('team')} className="mt-1 accent-yellow-400" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className={mode === 'team' ? 'text-yellow-400' : 'text-neutral-500'} />
                <h3 className={`font-black uppercase tracking-widest text-sm ${mode === 'team' ? 'text-yellow-400' : 'text-white'}`}>Team</h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">Participate with one of your existing teams.</p>
            </div>
          </label>

          <label className={`cursor-pointer flex items-start gap-4 p-6 rounded-[32px] border-4 transition-all ${!hackathon?.solo_allowed ? 'opacity-40 cursor-not-allowed' : ''} ${
            mode === 'solo' ? 'border-yellow-400 bg-yellow-400/5' : 'border-neutral-800 bg-black hover:border-neutral-700'
          }`}>
            <input type="radio" name="mode" value="solo" checked={mode === 'solo'} disabled={!hackathon?.solo_allowed} onChange={() => setMode('solo')} className="mt-1 accent-yellow-400" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User size={18} className={mode === 'solo' ? 'text-yellow-400' : 'text-neutral-500'} />
                <h3 className={`font-black uppercase tracking-widest text-sm ${mode === 'solo' ? 'text-yellow-400' : 'text-white'}`}>Solo</h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">{hackathon?.solo_allowed ? 'Participate individually.' : 'Not allowed for this hackathon.'}</p>
            </div>
          </label>
        </div>
      </div>

      {mode === 'team' && (
        <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Select Your Team</h2>

          {teams.length === 0 ? (
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
              You're not on any team yet.{' '}
              <button onClick={() => onNavigate?.('team-form')} className="text-yellow-400 hover:underline">Create one</button>.
            </p>
          ) : (
            <div className="space-y-4">
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-6 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none"
              >
                <option value="">Choose a team...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.member_count}/{t.max_members} members)</option>
                ))}
              </select>
            </div>
          )}

          {selectedTeam && (
            <div className="pt-6 border-t border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Team Roster</h3>
                {teamSizeOk ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-500 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Requirements Met
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} /> Team size doesn't fit this hackathon
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">{selectedTeam.member_count} members — full roster available on the Teams page.</p>
              {!teamSizeOk && (
                <p className="text-xs text-red-400 font-bold mt-2">
                  This hackathon requires teams of {minTeamSize}{Number.isFinite(maxTeamSize) ? `-${maxTeamSize}` : '+'} members. Add or remove members before registering.
                </p>
              )}
              {selectedTeam.member_role !== 'leader' && (
                <p className="text-xs text-red-400 font-bold mt-2 flex items-center gap-2">
                  <Shield size={12} /> Only {selectedTeam.name}'s team leader can submit this registration. Ask them to complete it, or select a team you lead.
                </p>
              )}
            </div>
          )}

          <div className="pt-6 text-center">
            <button onClick={() => onNavigate?.('team-form')} className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
              + Create a New Team Instead
            </button>
          </div>
        </div>
      )}

      <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 space-y-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-white">Registration Details</h2>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Proof of External Registration (Link)</label>
          <p className="text-xs text-neutral-400 mb-2 leading-relaxed">Provide the link to your team's registration on the official hackathon platform (e.g., Unstop, Devpost, or a Google Drive link) so faculty can verify authenticity.</p>
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors"
            placeholder="https://"
          />
        </div>
      </div>

      <div className="bg-yellow-400 rounded-[32px] p-8 text-white border-4 border-yellow-500 shadow-lg">
        <h2 className="text-sm font-black uppercase tracking-widest mb-6">Registration Checklist</h2>

        <div className="space-y-4 mb-8">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" checked={agreed.rules} onChange={(e) => setAgreed({ ...agreed, rules: e.target.checked })} className="mt-1 w-4 h-4 accent-black" />
            <span className="text-sm font-medium">I agree to the hackathon's code of conduct and rules.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" checked={agreed.eligibility} onChange={(e) => setAgreed({ ...agreed, eligibility: e.target.checked })} className="mt-1 w-4 h-4 accent-black" />
            <span className="text-sm font-medium">I confirm that all team members meet the eligibility criteria.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" checked={agreed.deadline} onChange={(e) => setAgreed({ ...agreed, deadline: e.target.checked })} className="mt-1 w-4 h-4 accent-black" />
            <span className="text-sm font-medium">I understand that submissions past the deadline will not be evaluated.</span>
          </label>
        </div>

        {error && <p className="text-red-900 text-xs font-bold uppercase tracking-widest mb-4">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/70">
            <AlertCircle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Double check before submitting</span>
          </div>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-transform shadow-lg flex items-center gap-2 ${
            !canSubmit ? 'bg-black/20 text-white/40 cursor-not-allowed' : 'bg-neutral-900 text-white hover:scale-95'
          }`}>
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Confirm Registration
          </button>
        </div>
      </div>
    </div>
  );
}
