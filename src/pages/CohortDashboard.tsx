import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, Layers, Activity, CheckCircle2, Search, Loader2, X, AlertCircle, Trophy, Percent, UsersRound, Medal } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABEL } from '../types';
import type { CohortHackathon, CohortSummary, SdeStatus, Student, StudentDetail } from '../types';

// Shared cohort view for every scoped staff role (Faculty Advisor, Coordinator, SDE Coordinator,
// HOD). The server decides what the caller may see (server/lib/scope.ts); this screen only
// renders whatever /cohort/summary, /cohort/hackathons and /students return for them.

const card = 'bg-black rounded-[32px] border-4 border-neutral-800 p-6';
const th = 'pb-3 px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500';
const td = 'py-3 px-3 text-sm';

// Win ratio = students with at least one verified win (winner/runner-up) / students participating.
const ratio = (wins: number, of: number) => (of ? `${Math.round((wins / of) * 100)}%` : '—');
const pct = (part: number, of: number) => (of ? Math.round((part / of) * 100) : 0);

const TITLES: Record<string, string> = {
  faculty: 'My Students',
  coordinator: 'CSE Cohort Overview',
  sde_coordinator: 'SDE Cohort Overview',
  hod: 'Department Overview',
  admin: 'Cohort Overview',
};

function scopeText(summary: CohortSummary): string {
  if (summary.role === 'admin') return 'All departments (admin)';
  if (!summary.scope.length) return 'No scope assigned yet';
  return summary.scope
    .map((s) => [s.department_code, s.batch_year ? `Batch ${s.batch_year}–${s.batch_year + 4}` : 'All batches', s.section ? `Section ${s.section}` : 'All sections'].join(' · '))
    .join('  |  ');
}

export default function CohortDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<CohortSummary | null>(null);
  const [hackathons, setHackathons] = useState<CohortHackathon[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('');
  const [sde, setSde] = useState<'' | SdeStatus>('');
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [allHackathons, setAllHackathons] = useState(false);

  useEffect(() => {
    Promise.all([api.cohort.summary(), api.cohort.hackathons()])
      .then(([s, h]) => { setSummary(s); setHackathons(h); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load cohort.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setStudentsLoading(true);
    const handle = setTimeout(() => {
      api.students.list(search.trim() || undefined, { section: section || undefined, sde: sde || undefined })
        .then(setStudents)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load students.'))
        .finally(() => setStudentsLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [search, section, sde]);

  const openStudent = async (id: string) => {
    setDetailLoading(true);
    try { setDetail(await api.students.get(id)); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to load student.'); }
    finally { setDetailLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  if (!summary) return <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error ?? 'Failed to load cohort.'}</p>;

  const { totals } = summary;
  const verified = summary.participationBySection.reduce((n, s) => n + s.verified_students, 0);
  const participationFor = (sec: string) => summary.participationBySection.find((p) => p.section === sec);
  const sectionOptions = summary.sections.map((s) => s.section);
  const ranking = [...summary.participationBySection]
    .filter((p) => p.participating_students > 0)
    .sort((a, b) => b.winning_students / b.participating_students - a.winning_students / a.participating_students || b.wins - a.wins);
  const shownHackathons = allHackathons ? hackathons : hackathons.slice(0, 15);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">{TITLES[summary.role] ?? 'Cohort'}</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">
          {user ? ROLE_LABEL[user.role] : ''} · {scopeText(summary)}{summary.sdeOnly ? ' · SDE students only' : ''}
        </p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      {summary.role !== 'admin' && !summary.scope.length && (
        <div className="bg-black border-4 border-yellow-400/40 rounded-[32px] p-6 flex items-start gap-3">
          <AlertCircle className="text-yellow-400 shrink-0" size={20} />
          <p className="text-sm text-neutral-300">You have not been assigned any sections, batches or departments yet, so no students are visible. An admin can assign your scope under Admin → Scope Assignments.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        {[
          { label: 'Students', value: totals.total_students, icon: Users },
          { label: 'SDE / Non-SDE', value: `${totals.sde}/${totals.non_sde}`, icon: ShieldCheck },
          { label: 'Sections', value: totals.sections, icon: Layers },
          { label: 'Teams', value: totals.teams, icon: UsersRound },
          { label: `Participating (${pct(totals.participating_students, totals.total_students)}%)`, value: totals.participating_students, icon: Activity },
          { label: 'Verified entries', value: verified, icon: CheckCircle2 },
          { label: `Wins · ${totals.winning_students} students`, value: totals.wins, icon: Trophy },
          { label: 'Win ratio', value: ratio(totals.winning_students, totals.participating_students), icon: Percent },
        ].map((stat) => (
          <div key={stat.label} className="bg-black p-5 rounded-3xl border-2 border-neutral-800 min-h-[110px] flex flex-col justify-between">
            <stat.icon size={18} className="text-yellow-400" />
            <div>
              <p className="text-3xl font-black text-white font-mono">{stat.value}</p>
              <p className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`${card} xl:col-span-2 overflow-x-auto`}>
          <h2 className="font-black uppercase tracking-widest text-white mb-4">Sections</h2>
          {summary.sections.length === 0 ? (
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No students in scope.</p>
          ) : (
            <table className="w-full text-left min-w-[760px]">
              <thead><tr className="border-b border-neutral-800">
                {['Batch', 'Section', 'Students', 'SDE', 'Non-SDE', 'Teams', 'Participating', 'Pending', 'Wins', 'Winners', 'Win ratio'].map((h) => <th key={h} className={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {summary.sections.map((s) => {
                  const p = participationFor(s.section);
                  return (
                    <tr key={`${s.batch_year}-${s.section}`} onClick={() => setSection(s.section)} className="border-b border-neutral-900 hover:bg-neutral-900 cursor-pointer text-white">
                      <td className={td}>{s.department_code} {s.batch_year}</td>
                      <td className={`${td} font-black text-yellow-400`}>{s.section}</td>
                      <td className={`${td} font-mono`}>{s.total}</td>
                      <td className={`${td} font-mono`}>{s.sde}</td>
                      <td className={`${td} font-mono`}>{s.non_sde}</td>
                      <td className={`${td} font-mono`}>{p?.teams ?? 0}</td>
                      <td className={`${td} font-mono`}>{p?.participating_students ?? 0} <span className="text-neutral-500 text-xs">({pct(p?.participating_students ?? 0, s.total)}%)</span></td>
                      <td className={`${td} font-mono`}>{p?.pending_registrations ?? 0}</td>
                      <td className={`${td} font-mono text-yellow-400`}>{p?.wins ?? 0}</td>
                      <td className={`${td} font-mono`}>{p?.winning_students ?? 0}</td>
                      <td className={`${td} font-mono font-black`}>{ratio(p?.winning_students ?? 0, p?.participating_students ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-6">
          <div className={card}>
            <h2 className="font-black uppercase tracking-widest text-white mb-4">SDE vs Non-SDE</h2>
            {summary.participationBySde.length === 0 ? (
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No students in scope.</p>
            ) : summary.participationBySde.map((g) => (
              <div key={g.sde_status} className="py-3 border-b border-neutral-900 last:border-0 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-black text-white">{g.sde_status}</span>
                  <span className="text-xs font-mono text-neutral-400">{g.students} students</span>
                </div>
                {[
                  { label: 'Participation', value: pct(g.participating_students, g.students), text: `${g.participating_students} / ${g.students}` },
                  { label: 'Win ratio', value: pct(g.winning_students, g.participating_students), text: `${g.winning_students} winners · ${g.wins} wins` },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-500"><span>{bar.label} {bar.value}%</span><span>{bar.text}</span></div>
                    <div className="h-2 bg-neutral-900 rounded-full mt-1 overflow-hidden"><div className="h-full bg-yellow-400 rounded-full" style={{ width: `${bar.value}%` }} /></div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {ranking.length > 1 && (
            <div className={card}>
              <h2 className="font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2"><Medal size={16} className="text-yellow-400" /> Top Sections</h2>
              <ol className="space-y-2">
                {ranking.slice(0, 5).map((p, i) => (
                  <li key={p.section} onClick={() => setSection(p.section)} className="flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-900 rounded-xl px-2 py-1.5">
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-neutral-900 text-[10px] font-black text-yellow-400 flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm font-black text-white">Section {p.section}</span>
                    </span>
                    <span className="text-xs font-mono text-neutral-400">{ratio(p.winning_students, p.participating_students)} · {p.wins} wins</span>
                  </li>
                ))}
              </ol>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mt-3">Ranked by win ratio (winners ÷ participants)</p>
            </div>
          )}
        </div>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <h2 className="font-black uppercase tracking-widest text-white mb-4">Hackathon Participation ({hackathons.length})</h2>
        {hackathons.length === 0 ? (
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No students in scope have registered for a hackathon yet.</p>
        ) : (
          <>
          <table className="w-full text-left min-w-[640px]">
            <thead><tr className="border-b border-neutral-800">{['Hackathon', 'Status', 'Teams', 'Students', 'Verified', 'Pending', 'Wins', 'Win ratio'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {shownHackathons.map((h) => (
                <tr key={h.hackathon_id} className="border-b border-neutral-900 text-white">
                  <td className={`${td} font-bold`}>{h.title}</td>
                  <td className={`${td} text-[10px] font-bold uppercase tracking-widest text-neutral-400`}>{h.hackathon_status.replace(/_/g, ' ')}</td>
                  <td className={`${td} font-mono`}>{h.teams}</td>
                  <td className={`${td} font-mono`}>{h.participating_students}</td>
                  <td className={`${td} font-mono`}>{h.verified_students}</td>
                  <td className={`${td} font-mono`}>{h.pending_registrations}</td>
                  <td className={`${td} font-mono text-yellow-400`}>{h.wins}</td>
                  <td className={`${td} font-mono`}>{ratio(h.winning_students, h.participating_students)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hackathons.length > 15 && (
            <button onClick={() => setAllHackathons((v) => !v)} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-yellow-400">
              {allHackathons ? 'Show top 15' : `Show all ${hackathons.length} hackathons`}
            </button>
          )}
          </>
        )}
      </div>

      <div className={`${card} space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-black uppercase tracking-widest text-white">Student Lookup</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or Reg. No."
                className="pl-10 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full text-sm text-white outline-none focus:border-yellow-400 w-full sm:w-56" />
            </div>
            <select value={section} onChange={(e) => setSection(e.target.value)} className="px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none">
              <option value="">All sections</option>
              {sectionOptions.map((s) => <option key={s} value={s}>Section {s}</option>)}
            </select>
            {!summary.sdeOnly && (
              <select value={sde} onChange={(e) => setSde(e.target.value as '' | SdeStatus)} className="px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none">
                <option value="">SDE + Non-SDE</option>
                <option value="SDE">SDE</option>
                <option value="Non-SDE">Non-SDE</option>
              </select>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {studentsLoading ? (
            <div className="flex items-center justify-center py-10 text-neutral-500"><Loader2 className="animate-spin" /></div>
          ) : students.length === 0 ? (
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest py-6">No students match.</p>
          ) : (
            <table className="w-full text-left min-w-[560px]">
              <thead><tr className="border-b border-neutral-800">{['Reg. No.', 'Name', 'Section', 'SDE', 'Participating', 'Verified'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} onClick={() => openStudent(s.id)} className="border-b border-neutral-900 hover:bg-neutral-900 cursor-pointer text-white">
                    <td className={`${td} font-mono`}>{s.institutional_id}</td>
                    <td className={`${td} font-bold`}>{s.full_name}</td>
                    <td className={td}>{s.section ?? '—'}</td>
                    <td className={td}>{s.sde_status ?? '—'}</td>
                    <td className={`${td} font-mono`}>{s.participating_count ?? 0}</td>
                    <td className={`${td} font-mono`}>{s.hackathon_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{students.length} student{students.length === 1 ? '' : 's'}</p>
      </div>

      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-neutral-950 border-4 border-neutral-800 rounded-[32px] p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {detailLoading || !detail ? (
              <div className="flex items-center justify-center py-10 text-neutral-500"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white break-words">{detail.full_name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">
                      {detail.institutional_id} · {detail.department_code} {detail.batch_year} · Section {detail.section} · {detail.sde_status}{detail.year_of_study ? ` · Year ${detail.year_of_study}` : ''}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">{detail.email}</p>
                  </div>
                  <button onClick={() => setDetail(null)} className="text-neutral-500 hover:text-white"><X size={20} /></button>
                </div>
                {[
                  { title: 'Registrations', rows: detail.registrations.map((r) => `${r.hackathon_title} — ${r.status.replace(/_/g, ' ')}${r.team_name ? ` (team ${r.team_name})` : ' (solo)'}`) },
                  { title: 'Teams', rows: detail.teams.map((t) => `${t.name} — ${t.member_role}, ${t.status}`) },
                  { title: 'Achievements', rows: detail.achievements.map((a) => `${a.title} — ${a.outcome} (${a.status.replace(/_/g, ' ')})`) },
                ].map((block) => (
                  <div key={block.title}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-2">{block.title}</h4>
                    {block.rows.length === 0 ? <p className="text-xs text-neutral-500">None yet.</p> : (
                      <ul className="space-y-1">{block.rows.map((r, i) => <li key={i} className="text-sm text-neutral-200">{r}</li>)}</ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
