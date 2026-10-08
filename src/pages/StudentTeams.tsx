import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, User, Plus, Shield, UsersRound, Loader2, Mail, Check, X, UserPlus, ChevronDown, ChevronUp, LogOut, Trash2, Clock } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Team, TeamInvite, TeamJoinRequest, TeamMember } from '../types';
import type { NavigateFn } from '../App';

interface StudentTeamsProps {
  onNavigate?: NavigateFn;
}

export default function StudentTeams({ onNavigate }: StudentTeamsProps) {
  const { user } = useAuth();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [joinableTeams, setJoinableTeams] = useState<Team[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [joinRequests, setJoinRequests] = useState<Record<string, TeamJoinRequest[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [inviteTargets, setInviteTargets] = useState<Record<string, string>>({});
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [rosters, setRosters] = useState<Record<string, TeamMember[]>>({});
  const [rosterLoading, setRosterLoading] = useState<string | null>(null);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);
  const [disbandingId, setDisbandingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.teams.mine(), api.teams.joinable(), api.teams.invitesMine()])
      .then(async ([mine, joinable, mineInvites]) => {
        setMyTeams(mine); setJoinableTeams(joinable); setInvites(mineInvites); setError(null);
        const led = mine.filter((t) => t.member_role === 'leader');
        const entries = await Promise.all(led.map(async (t): Promise<[string, TeamJoinRequest[]]> => [t.id, await api.teams.joinRequests(t.id).catch(() => [])]));
        setJoinRequests(Object.fromEntries(entries));
      })
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

  const requestJoin = async (team: Team) => {
    setRequestingId(team.id);
    try {
      await api.teams.requestJoin(team.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to request to join.');
    } finally {
      setRequestingId(null);
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

  const respondToJoinRequest = async (teamId: string, userId: string, accept: boolean) => {
    setRespondingId(userId);
    try {
      await api.teams.respondJoinRequest(teamId, userId, accept);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to respond to join request.');
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
      setInviteMessage(`Invitation sent to ${institutionalId.toUpperCase()}.`);
      setInviteTargets((prev) => ({ ...prev, [team.id]: '' }));
      setRosters((prev) => { const next = { ...prev }; delete next[team.id]; return next; });
      if (expandedTeamId === team.id) setExpandedTeamId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send invite.');
    } finally {
      setInvitingId(null);
    }
  };

  const toggleRoster = async (teamId: string) => {
    if (expandedTeamId === teamId) { setExpandedTeamId(null); return; }
    setExpandedTeamId(teamId);
    if (!rosters[teamId]) {
      setRosterLoading(teamId);
      try {
        const detail = await api.teams.get(teamId);
        setRosters((prev) => ({ ...prev, [teamId]: detail.members }));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load team roster.');
      } finally {
        setRosterLoading(null);
      }
    }
  };

  const leaveTeam = async (team: Team) => {
    if (!user) return;
    if (!window.confirm(`Leave ${team.name}?`)) return;
    setMemberBusyId(user.id);
    try {
      await api.teams.removeMember(team.id, user.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to leave team.');
    } finally {
      setMemberBusyId(null);
    }
  };

  const removeMember = async (team: Team, memberUserId: string) => {
    if (!window.confirm('Remove this member from the team?')) return;
    setMemberBusyId(memberUserId);
    try {
      await api.teams.removeMember(team.id, memberUserId);
      const detail = await api.teams.get(team.id);
      setRosters((prev) => ({ ...prev, [team.id]: detail.members }));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove member.');
    } finally {
      setMemberBusyId(null);
    }
  };

  const disbandTeam = async (team: Team) => {
    if (!window.confirm(`Disband ${team.name}? This cannot be undone.`)) return;
    setDisbandingId(team.id);
    try {
      await api.teams.disband(team.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to disband team.');
    } finally {
      setDisbandingId(null);
    }
  };

  const leaderCount = myTeams.filter((t) => t.member_role === 'leader').length;
  const pendingJoinRequestTeams = myTeams.filter((t) => t.member_role === 'leader' && (joinRequests[t.id]?.length ?? 0) > 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">My Teams</h1>
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
              <div key={invite.team_id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-black text-sm text-white break-words">{invite.name}</h4>
                  {invite.invited_by_name && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mt-1 break-words">
                      Invited by {invite.invited_by_name}{invite.invited_by_institutional_id ? ` (${invite.invited_by_institutional_id})` : ''}
                    </p>
                  )}
                  {invite.description && <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1 break-words">{invite.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
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

      {pendingJoinRequestTeams.length > 0 && (
        <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6 space-y-5">
          <h3 className="font-bold text-sm text-white uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} className="text-yellow-400" /> Join Requests Awaiting Your Decision
          </h3>
          {pendingJoinRequestTeams.map((t) => (
            <div key={t.id} className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{t.name}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {joinRequests[t.id].map((r) => (
                  <div key={r.user_id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-sm text-white break-words">{r.full_name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1 break-words">{r.institutional_id}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button disabled={respondingId === r.user_id} onClick={() => respondToJoinRequest(t.id, r.user_id, false)} className="w-8 h-8 rounded-full bg-black border border-neutral-700 flex items-center justify-center text-red-400 hover:bg-red-400 hover:text-white transition-colors disabled:opacity-60">
                        <X size={14} />
                      </button>
                      <button disabled={respondingId === r.user_id} onClick={() => respondToJoinRequest(t.id, r.user_id, true)} className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-400 hover:text-white transition-colors disabled:opacity-60">
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
          <h3 className="font-bold text-sm text-white uppercase tracking-widest">Teams you can join or request</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinableTeams.map((t) => (
              <div key={t.id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-black text-sm text-white break-words">{t.name}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">{t.member_count}/{t.max_members} members · {t.join_mode === 'open' ? 'Open' : 'Approval required'}</p>
                </div>
                {t.join_mode === 'open' ? (
                  <button
                    onClick={() => join(t)}
                    disabled={joiningId === t.id}
                    className="px-4 py-2 rounded-full bg-yellow-400 text-white text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform disabled:opacity-60 flex items-center gap-1 shrink-0"
                  >
                    {joiningId === t.id && <Loader2 size={12} className="animate-spin" />} Join
                  </button>
                ) : (
                  <button
                    onClick={() => requestJoin(t)}
                    disabled={requestingId === t.id}
                    className="px-4 py-2 rounded-full bg-neutral-800 border border-neutral-700 text-white text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors disabled:opacity-60 flex items-center gap-1 shrink-0"
                  >
                    {requestingId === t.id && <Loader2 size={12} className="animate-spin" />} Request
                  </button>
                )}
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
                  <th className="px-6 py-4 border-b border-neutral-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-white">
                {myTeams.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr className="hover:bg-neutral-700 transition-colors group">
                      <td className="px-6 py-4">
                        <button onClick={() => toggleRoster(t.id)} className="flex items-center gap-2 text-left">
                          {expandedTeamId === t.id ? <ChevronUp size={14} className="text-neutral-500 shrink-0" /> : <ChevronDown size={14} className="text-neutral-500 shrink-0" />}
                          <div>
                            <p className="font-black text-sm group-hover:text-yellow-400 transition-colors">{t.name}</p>
                            {t.description && <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">{t.description}</p>}
                            <TeamFormationBadge team={t} />
                          </div>
                        </button>
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
                              placeholder="Register No."
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
                      <td className="px-6 py-4 text-right">
                        {t.member_role === 'leader' ? (
                          <button
                            disabled={disbandingId === t.id}
                            onClick={() => disbandTeam(t)}
                            className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 disabled:opacity-60 inline-flex items-center gap-1"
                          >
                            {disbandingId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Disband
                          </button>
                        ) : (
                          <button
                            disabled={memberBusyId === user?.id}
                            onClick={() => leaveTeam(t)}
                            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-red-400 disabled:opacity-60 inline-flex items-center gap-1"
                          >
                            {memberBusyId === user?.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />} Leave
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedTeamId === t.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-neutral-900/40">
                          {rosterLoading === t.id ? (
                            <div className="flex items-center justify-center py-4 text-neutral-500"><Loader2 className="animate-spin" size={16} /></div>
                          ) : (
                            <div className="space-y-2">
                              {(rosters[t.id] ?? []).filter((m) => m.status === 'active' || (m.was_invited && (m.status === 'invited' || m.status === 'declined'))).map((m) => (
                                <div key={m.user_id} className="flex items-center justify-between gap-3 bg-black border border-neutral-800 rounded-xl px-4 py-2.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {m.member_role === 'leader' ? <Shield size={14} className="text-yellow-400 shrink-0" /> : <User size={14} className="text-neutral-500 shrink-0" />}
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-white break-words">{m.full_name}</p>
                                      <p className="text-[10px] text-neutral-500 break-words">{m.institutional_id ? `${m.institutional_id} · ` : ''}{m.email}</p>
                                    </div>
                                  </div>
                                  {m.status === 'invited' && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-1 shrink-0"><Clock size={12} /> Invitation pending</span>
                                  )}
                                  {m.status === 'declined' && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1 shrink-0"><X size={12} /> Declined</span>
                                  )}
                                  {m.status === 'active' && t.member_role === 'leader' && m.user_id !== user?.id && (
                                    <button
                                      disabled={memberBusyId === m.user_id}
                                      onClick={() => removeMember(t, m.user_id)}
                                      className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 disabled:opacity-60 flex items-center gap-1"
                                    >
                                      {memberBusyId === m.user_id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// "Formed" only once every invitation has been answered and someone besides the leader has
// accepted; until then the leader sees how many invitations are still pending.
function TeamFormationBadge({ team }: { team: Team }) {
  const pending = team.pending_invite_count ?? 0;
  const declined = team.declined_invite_count ?? 0;
  if (pending > 0) {
    return (
      <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
        <Clock size={11} /> {pending} invitation{pending > 1 ? 's' : ''} pending
      </span>
    );
  }
  if (team.member_count >= 2) {
    return (
      <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/30">
        <CheckCircle2 size={11} /> Team formed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-neutral-900 text-neutral-400 border border-neutral-800">
      {declined > 0 ? `${declined} declined · invite someone else` : 'No members yet'}
    </span>
  );
}
