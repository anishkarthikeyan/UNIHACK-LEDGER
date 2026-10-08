import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Eye, AlertCircle, FileText, Loader2, Users, Check, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Hackathon, Notification, Registration, TeamInvite } from '../types';
import type { NavigateFn } from '../App';

interface StudentDashboardProps {
  onNavigate?: NavigateFn;
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.hackathons.list(), api.registrations.mine(), api.notifications.list()])
      .then(([h, r, n]) => { setHackathons(h); setRegistrations(r); setNotifications(n); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
    // Loaded separately so a failure here doesn't blank the rest of the dashboard.
    api.teams.invitesMine().then(setTeamInvites).catch(() => { /* non-critical */ });
  }, []);

  const respondToInvite = async (invite: TeamInvite, accept: boolean) => {
    setRespondingInviteId(invite.team_id);
    setInviteMessage(null);
    try {
      await api.teams.respond(invite.team_id, accept);
      setTeamInvites((prev) => prev.filter((i) => i.team_id !== invite.team_id));
      setInviteMessage(accept ? `You joined ${invite.name}.` : `Invitation to ${invite.name} declined.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to respond to invitation.');
    } finally {
      setRespondingInviteId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  const interestedCount = hackathons.filter((h) => h.interested).length;
  const registeredCount = registrations.filter((r) => r.status !== 'rejected' && r.status !== 'withdrawn').length;
  const ongoingCount = registrations.filter((r) => r.hackathon_status === 'ongoing').length;
  const upcomingDeadlines = registrations.filter((r) => {
    const days = (new Date(r.registration_closes_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  });

  const urgentRegistration = upcomingDeadlines.find((r) => r.status === 'draft' || r.status === 'submitted');
  const unreadNotifications = notifications.filter((n) => !n.read_at).slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">Student Dashboard</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2 break-words">Welcome back, {user?.full_name ?? 'Student'}</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}
      {inviteMessage && <p className="text-green-500 text-xs font-bold uppercase tracking-widest">{inviteMessage}</p>}

      {teamInvites.length > 0 && (
        <div className="bg-black border-4 border-yellow-400/60 rounded-[32px] p-5 sm:p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400/10 rounded-full flex items-center justify-center text-yellow-400 border border-yellow-400/30 shrink-0">
              <Users size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="font-black uppercase tracking-widest text-white">Team Invitation{teamInvites.length > 1 ? 's' : ''}</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">The team is formed only when you accept</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teamInvites.map((invite) => (
              <div key={invite.team_id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-white break-words">{invite.name}</h3>
                  {invite.invited_by_name && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mt-1 break-words">
                      From {invite.invited_by_name}{invite.invited_by_institutional_id ? ` (${invite.invited_by_institutional_id})` : ''}
                    </p>
                  )}
                  {invite.description && <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1 break-words">{invite.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    disabled={respondingInviteId === invite.team_id}
                    onClick={() => respondToInvite(invite, false)}
                    className="px-4 py-2 rounded-full bg-black border border-neutral-700 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-400 hover:text-white transition-colors disabled:opacity-60 flex items-center gap-1"
                  >
                    <X size={12} /> Decline
                  </button>
                  <button
                    disabled={respondingInviteId === invite.team_id}
                    onClick={() => respondToInvite(invite, true)}
                    className="px-4 py-2 rounded-full bg-yellow-400 text-white text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform disabled:opacity-60 flex items-center gap-1"
                  >
                    {respondingInviteId === invite.team_id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {urgentRegistration && (
        <div className="bg-red-500 rounded-[32px] p-5 sm:p-6 text-white border-4 border-red-600 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shrink-0">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black uppercase tracking-widest text-lg">Action Required</h2>
              <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-90 break-words">
                Registration for <span className="text-white">{urgentRegistration.hackathon_title}</span> closes {new Date(urgentRegistration.registration_closes_at).toLocaleDateString()}.
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate?.('hackathon-detail', urgentRegistration.hackathon_id)} className="px-6 py-3 bg-black text-red-600 rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-95 transition-transform shrink-0 whitespace-nowrap shadow-lg">
            View Details
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Interested', value: interestedCount, icon: Eye, highlight: false },
          { label: 'Registered', value: registeredCount, icon: CheckCircle2, highlight: true },
          { label: 'Ongoing', value: ongoingCount, icon: Clock, highlight: false },
          { label: 'Upcoming Deadlines', value: upcomingDeadlines.length, icon: AlertCircle, highlight: false },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.highlight ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-black text-white border-neutral-800'} p-4 sm:p-5 rounded-3xl border-2 shadow-lg flex items-center gap-3 sm:gap-4 min-w-0`}>
            <div className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${stat.highlight ? 'bg-neutral-900 text-yellow-400' : 'bg-neutral-800 text-white'}`}>
              <stat.icon size={22} className="sm:hidden" />
              <stat.icon size={24} className="hidden sm:block" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-3xl font-black leading-none font-mono">{stat.value}</p>
              <p className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-widest mt-1 break-words ${stat.highlight ? 'text-white/70' : 'text-neutral-500'}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl overflow-hidden flex flex-col min-w-0">
          <div className="p-4 sm:p-6 border-b border-neutral-800 flex justify-between items-center gap-3">
            <h2 className="font-bold text-base sm:text-lg text-white uppercase tracking-widest">My Pipeline</h2>
            <button onClick={() => onNavigate?.('pipeline')} className="text-[10px] px-4 py-2 bg-neutral-900 text-white rounded-full font-bold uppercase tracking-widest border border-neutral-800 hover:border-yellow-400 transition-colors shrink-0">
              View All
            </button>
          </div>

          {registrations.length === 0 ? (
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16 px-4 break-words">No registrations yet — explore hackathons to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 border-b border-neutral-800">Hackathon</th>
                    <th className="px-6 py-4 border-b border-neutral-800">Reg. Close Date</th>
                    <th className="px-6 py-4 border-b border-neutral-800">Status</th>
                    <th className="px-6 py-4 border-b border-neutral-800 text-center">Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-white">
                  {registrations.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-700 transition-colors">
                      <td className="px-6 py-4 font-bold">{r.hackathon_title}</td>
                      <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{new Date(r.registration_closes_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => onNavigate?.('hackathon-detail', r.hackathon_id)} className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors bg-neutral-900 border border-neutral-700 text-white hover:border-yellow-400">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-yellow-400 rounded-[32px] p-5 sm:p-6 text-white flex flex-col shadow-lg border-4 border-yellow-500 overflow-hidden min-w-0">
            <div className="flex justify-between items-start gap-3 mb-6">
              <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center shrink-0">
                <div className="w-4 h-4 bg-yellow-400 rotate-45"></div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-right break-words">Reminders & Alerts</div>
            </div>
            <div className="space-y-4 flex-1 min-w-0">
              {unreadNotifications.length === 0 ? (
                <p className="text-sm font-bold text-white/80">You're all caught up.</p>
              ) : unreadNotifications.map((n) => (
                <div key={n.id} className="flex flex-col gap-2 border-b border-white/10 pb-4 last:border-0 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-snug break-words">{n.title}</p>
                    {n.body && <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-1 break-words">{n.body}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl p-5 sm:p-6 text-white min-w-0">
            <h3 className="font-black text-lg text-white uppercase tracking-widest mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={() => onNavigate?.('explore')} className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 border-2 border-transparent transition-all flex items-center justify-center gap-3"><Eye size={16} className="text-neutral-500"/> Explore Hackathons</button>
              <button onClick={() => onNavigate?.('calendar')} className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 border-2 border-transparent transition-all flex items-center justify-center gap-3"><Calendar size={16} className="text-neutral-500"/> Calendar</button>
              <button onClick={() => onNavigate?.('profile')} className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 border-2 border-transparent transition-all flex items-center justify-center gap-3"><FileText size={16} className="text-neutral-500"/> Update Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
