import React, { useEffect, useState } from 'react';
import { BarChart2, PieChart, TrendingUp, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { ReportSummary } from '../types';

export default function FacultyReports() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.reports.summary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  const maxDomain = Math.max(1, ...(summary?.domainBreakdown.map((d) => d.n) ?? [1]));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Reports</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Analytics across all hackathons</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black border-4 border-neutral-800 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="text-yellow-400" size={24} />
            <h2 className="font-black uppercase tracking-widest text-white">Participation</h2>
          </div>
          <p className="text-4xl font-black font-mono text-white">{summary?.totalParticipants ?? 0}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-2">Approved Registrations</p>
        </div>
        <div className="bg-black border-4 border-neutral-800 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-yellow-400" size={24} />
            <h2 className="font-black uppercase tracking-widest text-white">Win Rate</h2>
          </div>
          <p className="text-4xl font-black font-mono text-white">{summary?.winRate ?? 0}%</p>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-2">Verified wins / registrations</p>
        </div>
        <div className="bg-black border-4 border-neutral-800 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="text-yellow-400" size={24} />
            <h2 className="font-black uppercase tracking-widest text-white">Top Domain</h2>
          </div>
          <p className="text-4xl font-black font-mono text-white">{summary?.topDomain ?? '—'}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-2">Most listed hackathon domain</p>
        </div>
      </div>

      <div className="flex-1 bg-black border-4 border-neutral-800 rounded-[32px] p-8">
        <h2 className="font-black uppercase tracking-widest text-white mb-8">Domain Breakdown</h2>
        {!summary || summary.domainBreakdown.length === 0 ? (
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No domain data yet.</p>
        ) : (
          <div className="space-y-5">
            {summary.domainBreakdown.map((d) => (
              <div key={d.domain} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-neutral-300">
                  <span>{d.domain}</span>
                  <span className="font-mono text-neutral-500">{d.n}</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(d.n / maxDomain) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
