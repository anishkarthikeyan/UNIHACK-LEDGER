import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, User, Plus, Shield, UsersRound, Loader2, Mail, Check, X, UserPlus } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Team, TeamInvite } from '../types';
import type { NavigateFn } from '../App';

interface StudentTeamsProps {
  onNavigate?: NavigateFn;
}

export default function StudentTeams({ onNavigate }: StudentTeamsProps) {
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [joinableTeams, setJoinableTeams] = useState<Team[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [inviteTargets, setInviteTargets] = useState<Record<string, string>>({});
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.teams.mine(), api.teams.joinable(), api.teams.invitesMine()])
      .then(([mine, joinable, mineInvites]) => { setMyTeams(mine); setJoinableTeams(joinable); setInvites(mineInvites); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load teams.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const join = async (team: Team) => {
    setJoiningId(team.id);
    try {
      await api.teams.join(team.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to join team.');
    } finally {
      setJoiningId(null);
    }
  };

  const respond = async (invite: TeamInvite, accept: boolean) => {
    setRespondingId(invite.team_id);
    try {
      await api.teams.respond(invite.team_id, accept);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to respond to invite.');
    } finally {
      setRespondingId(null);
    }
  };

  const sendInvite = async (team: Team) => {
    const institutionalId = (inviteTargets[team.id] ?? '').trim();
    if (!institutionalId) return;
    setInvitingId(team.id);
    setInviteMessage(null);
    try {
      await api.teams.invite(team.id, institutionalId);
      setInviteMessage(`Invitation sent to ${institutionalId}.`);
      setInviteTargets((prev) => ({ ...prev, [team.id]: '' }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send invite.');
    } finally {
      setInvitingId(null);
    }
  };

  const leaderCount = myTeams.filter((t) => t.member_role === 'leader').length;

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">My Teams</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Manage your collaborations</p>
        </div>
        <button onClick={() => onNavigate?.('team-form')} className="px-6 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg">
          <Plus size={16} /> Create New Team
        </button>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}
      {inviteMessage && <p className="text-green-500 text-xs font-bold uppercase tracking-widest">{inviteMessage}</p>}

      {invites.length > 0 && (
        <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-yellow-400 border border-neutral-800">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">You have {invites.length} pending team invitation{invites.length > 1 ? 's' : ''}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">Review them to join a team</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invites.map((invite) => (
              <div key={invite.team_id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-white">{invite.name}</h4>
                  {invite.description && <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">{invite.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button disabled={respondingId === invite.team_id} onClick={() => respond(invite, false)} className="w-8 h-8 rounded-full bg-black border border-neutral-700 flex items-center justify-center text-red-400 hover:bg-red-400 hover:text-white transition-colors disabled:opacity-60">
                    <X size={14} />
                  </button>
                  <button disabled={respondingId === invite.team_id} onClick={() => respond(invite, true)} className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-400 hover:text-white transition-colors disabled:opacity-60">
                    <Check size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'My Teams', value: myTeams.length, icon: Users, highlight: true },
          { label: 'Teams I Lead', value: leaderCount, icon: Shield, highlight: false },
          { label: 'Joinable Teams', value: joinableTeams.length, icon: User, highlight: false },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.highlight ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-black text-white border-neutral-800'} p-5 rounded-3xl border-2 shadow-lg flex flex-col justify-between h-32`}>
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl ${stat.highlight ? 'bg-neutral-900 text-yellow-400' : 'bg-neutral-800 text-white'}`}>
                <stat.icon size={20} />
              </div>
              <p className="text-3xl font-black leading-none font-mono">{stat.value}</p>
            </div>
            <p className={`text-[10px] uppercase font-bold tracking-widest leading-tight ${stat.highlight ? 'text-white/70' : 'text-neutral-500'}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {joinableTeams.length > 0 && (
        <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6 space-y-4">
          <h3 className="font-bold text-sm text-white uppercase tracking-widest">Open teams you can join</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinableTeams.map((t) => (
              <div key={t.id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-white">{t.name}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">{t.member_count}/{t.max_members} members</p>
                </div>
                <button
                  onClick={() => join(t)}
                  disabled={joiningId === t.id}
                  className="px-4 py-2 rounded-full bg-yellow-400 text-white text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform disabled:opacity-60"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="font-bold text-lg text-white uppercase tracking-widest">Team Directory</h2>
        </div>

        {myTeams.length === 0 ? (
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">You haven't joined or created any teams yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-b border-neutral-800">Team Details</th>
                  <th className="px-6 py-4 border-b border-neutral-800">My Role</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Members</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Visibility</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Invite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-white">
                {myTeams.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-700 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-black text-sm group-hover:text-yellow-400 transition-colors">{t.name}</p>
                      {t.description && <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">{t.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {t.member_role === 'leader' ? <Shield size={14} className="text-yellow-400" /> : <User size={14} className="text-neutral-500" />}
                        <span className={`text-xs font-bold uppercase tracking-widest ${t.member_role === 'leader' ? 'text-yellow-400' : 'text-neutral-300'}`}>{t.member_role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <UsersRound size={16} className="text-neutral-500" />
                        <span className="font-mono text-sm">{t.member_count}/{t.max_members}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-neutral-900 text-neutral-300 border border-neutral-800">
                        <CheckCircle2 size={12} className="mr-1.5" /> {t.visibility}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {t.member_role === 'leader' ? (
                        <div className="flex gap-2">
                          <input
                            value={inviteTargets[t.id] ?? ''}
                            onChange={(e) => setInviteTargets((prev) => ({ ...prev, [t.id]: e.target.value }))}
                            placeholder="Institutional ID"
                            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-xs text-white outline-none focus:border-yellow-400 w-32"
                          />
                          <button
                            onClick={() => sendInvite(t)}
                            disabled={invitingId === t.id}
                            className="w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center hover:scale-95 transition-transform disabled:opacity-60 shrink-0"
                          >
                            <UserPlus size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-600 text-[10px] uppercase tracking-widest">Leader only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
