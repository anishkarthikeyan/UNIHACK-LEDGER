import React, { useEffect, useMemo, useState } from 'react';
import { Search, Users, Loader2, Trophy, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';
import { RESULT_LABEL } from '../types';
import type { StaffTeam } from '../types';

// Teams with at least one member in the viewer's scope (the server decides — a Faculty Advisor
// sees teams touching their section, the HOD sees every team). Members from other sections are
// listed too, with the viewer's own students highlighted.

const pill = 'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest';
const REG_STYLE: Record<string, string> = {
  approved: 'bg-green-500/15 text-green-400',
  pending_verification: 'bg-yellow-400/15 text-yellow-400',
  rejected: 'bg-red-500/15 text-red-400',
};

export default function FacultyTeams() {
  const [teams, setTeams] = useState<StaffTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('');
  const [onlyWinners, setOnlyWinners] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.teams.all()
      .then(setTeams)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load teams.'))
      .finally(() => setLoading(false));
  }, []);

  const sections = useMemo(() => [...new Set(teams.flatMap((t) => t.sections))].sort(), [teams]);
  const filtered = teams.filter((t) => {
    const q = search.trim().toLowerCase();
    if (q && !t.name.toLowerCase().includes(q) && !t.members.some((m) => m.full_name.toLowerCase().includes(q) || m.institutional_id.toLowerCase().includes(q))
      && !t.hackathons.some((h) => h.title.toLowerCase().includes(q))) return false;
    if (section && !t.sections.includes(section)) return false;
    if (onlyWinners && !t.wins) return false;
    return true;
  });
  const totalWins = teams.reduce((n, t) => n + t.wins, 0);
  const entries = teams.reduce((n, t) => n + t.hackathons.length, 0);

  if (loading) return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Teams</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">
            {teams.length} teams · {entries} competition entries · {totalWins} wins / runner-ups
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input type="text" placeholder="Team, student, Reg. No., hackathon" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black border-2 border-neutral-800 rounded-full text-sm font-bold focus:border-yellow-400 outline-none text-white" />
          </div>
          <select value={section} onChange={(e) => setSection(e.target.value)} className="px-4 py-3 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none">
            <option value="">All sections</option>
            {sections.map((s) => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <button onClick={() => setOnlyWinners((v) => !v)}
            className={`px-4 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border-2 transition-colors flex items-center justify-center gap-2 ${onlyWinners ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-black text-white border-neutral-800'}`}>
            <Trophy size={12} /> Winners only
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      {filtered.length === 0 ? (
        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">No teams found.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map((team) => {
            const expanded = open[team.id];
            const hackathons = expanded ? team.hackathons : team.hackathons.slice(0, 3);
            return (
              <div key={team.id} className="bg-black border-4 border-neutral-800 rounded-3xl p-6 flex flex-col gap-5 hover:border-neutral-700 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full border border-neutral-800 flex items-center justify-center shrink-0"><Users size={18} className="text-white" /></div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-white truncate">{team.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                        {team.member_count} member{team.member_count === 1 ? '' : 's'} · Sections {team.sections.join(', ') || '—'}
                      </p>
                    </div>
                  </div>
                  {team.wins > 0 && (
                    <span className={`${pill} bg-yellow-400 text-black flex items-center gap-1 shrink-0`}><Trophy size={10} /> {team.wins} win{team.wins === 1 ? '' : 's'}</span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[420px]">
                    <thead><tr className="border-b border-neutral-800">
                      {['Member', 'Reg. No.', 'Sec', 'SDE'].map((h) => <th key={h} className="pb-2 pr-3 text-[9px] font-black uppercase tracking-widest text-neutral-500">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {team.members.map((m) => (
                        <tr key={m.user_id} className={`border-b border-neutral-900 ${m.in_scope ? 'text-white' : 'text-neutral-400'}`}>
                          <td className="py-2 pr-3 text-sm font-bold">
                            <span className="flex items-center gap-1.5">
                              {m.member_role === 'leader' && <Crown size={12} className="text-yellow-400 shrink-0" />}
                              {m.full_name}
                              {m.status === 'invited' && <span className={`${pill} bg-neutral-800 text-neutral-400`}>invited</span>}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-xs font-mono">{m.institutional_id}</td>
                          <td className="py-2 pr-3 text-xs font-black">{m.section ?? '—'}</td>
                          <td className="py-2 pr-3">
                            <span className={`${pill} ${m.sde_status === 'SDE' ? 'bg-blue-500/15 text-blue-400' : 'bg-neutral-800 text-neutral-400'}`}>{m.sde_status ?? '—'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-2">Competitions ({team.hackathons.length})</p>
                  {team.hackathons.length === 0 ? <p className="text-xs text-neutral-500">Not registered for any competition yet.</p> : (
                    <ul className="space-y-1.5">
                      {hackathons.map((h) => {
                        const result = team.results.find((r) => r.hackathon_id === h.hackathon_id);
                        return (
                          <li key={h.registration_id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-neutral-200 truncate">{h.title}</span>
                            <span className="flex items-center gap-1.5 shrink-0">
                              {result?.result && result.result !== 'participant' && (
                                <span className={`${pill} ${result.result === 'winner' || result.result === 'runner_up' ? 'bg-yellow-400 text-black' : 'bg-purple-500/15 text-purple-300'}`}>
                                  {RESULT_LABEL[result.result]}{result.status !== 'approved' ? ' · unverified' : ''}
                                </span>
                              )}
                              <span className={`${pill} ${REG_STYLE[h.registration_status] ?? 'bg-neutral-800 text-neutral-400'}`}>{h.registration_status.replace(/_/g, ' ')}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {team.hackathons.length > 3 && (
                    <button onClick={() => setOpen((o) => ({ ...o, [team.id]: !expanded }))} className="mt-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-yellow-400 flex items-center gap-1">
                      {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> {team.hackathons.length - 3} more</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
