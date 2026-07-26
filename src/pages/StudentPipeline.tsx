import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, PlayCircle, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Registration } from '../types';
import type { NavigateFn } from '../App';

interface StudentPipelineProps {
  onNavigate?: NavigateFn;
}

function stageOf(r: Registration) {
  if (r.status === 'rejected') return 'Rejected';
  if (r.status === 'withdrawn') return 'Withdrawn';
  if (r.hackathon_status === 'completed' || r.hackathon_status === 'archived') return 'Completed';
  if (r.hackathon_status === 'ongoing') return 'Ongoing';
  if (r.status === 'pending_verification') return 'Needs Action';
  if (r.status === 'approved') return 'Registered';
  return 'Submitted';
}

function progressOf(stage: string) {
  switch (stage) {
    case 'Needs Action': return 25;
    case 'Registered': return 50;
    case 'Ongoing': return 75;
    case 'Completed': return 100;
    default: return 10;
  }
}

const STAGE_COLORS: Record<string, string> = {
  'Needs Action': 'bg-yellow-400 text-white border border-yellow-500',
  Registered: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
  Ongoing: 'bg-neutral-900 text-white border border-neutral-800',
  Completed: 'bg-neutral-900 text-neutral-500 border border-neutral-700',
  Rejected: 'bg-red-500/20 text-red-400 border border-red-500/40',
  Withdrawn: 'bg-neutral-900 text-neutral-500 border border-neutral-700',
  Submitted: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
};

export default function StudentPipeline({ onNavigate }: StudentPipelineProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState('All');

  useEffect(() => {
    api.registrations.mine()
      .then(setRegistrations)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load pipeline.'))
      .finally(() => setLoading(false));
  }, []);

  const items = registrations.map((r) => ({ registration: r, stage: stageOf(r) }));
  const needsAction = items.find((i) => i.stage === 'Needs Action');
  const ongoing = items.find((i) => i.stage === 'Ongoing');
  const upcoming = items
    .filter((i) => i.stage !== 'Completed' && i.stage !== 'Rejected' && i.stage !== 'Withdrawn')
    .sort((a, b) => new Date(a.registration.registration_closes_at).getTime() - new Date(b.registration.registration_closes_at).getTime())[0];

  const stageCounts = items.reduce<Record<string, number>>((acc, i) => { acc[i.stage] = (acc[i.stage] ?? 0) + 1; return acc; }, {});
  const stages = ['All', ...Object.keys(stageCounts)];
  const filteredItems = activeStage === 'All' ? items : items.filter((i) => i.stage === activeStage);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">My Pipeline</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Track your hackathon progress and pending actions</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} />
            <h3 className="font-black uppercase tracking-widest text-sm">Needs Action</h3>
          </div>
          {needsAction ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">{needsAction.registration.hackathon_title}</p>
              <p className="font-bold text-sm mb-6">Awaiting faculty verification.</p>
              <button onClick={() => onNavigate?.('hackathon-detail', needsAction.registration.hackathon_id)} className="mt-auto w-full py-3 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-[0.98] transition-transform">
                View Details
              </button>
            </>
          ) : <p className="text-sm font-bold opacity-80">Nothing needs your attention right now.</p>}
        </div>

        <div className="bg-black rounded-[32px] p-6 text-white border-4 border-neutral-800 shadow-lg flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-neutral-400">
            <Clock size={24} />
            <h3 className="font-black uppercase tracking-widest text-sm text-white">Upcoming Deadline</h3>
          </div>
          {upcoming ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">{upcoming.registration.hackathon_title}</p>
              <p className="font-bold text-sm mb-6">Registration closes {new Date(upcoming.registration.registration_closes_at).toLocaleDateString()}.</p>
              <button onClick={() => onNavigate?.('hackathon-detail', upcoming.registration.hackathon_id)} className="mt-auto w-full py-3 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-700 transition-colors">
                View Details
              </button>
            </>
          ) : <p className="text-sm font-bold text-neutral-400">No upcoming deadlines.</p>}
        </div>

        <div className="bg-black rounded-[32px] p-6 text-white border-4 border-neutral-800 shadow-lg flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-neutral-400">
            <PlayCircle size={24} />
            <h3 className="font-black uppercase tracking-widest text-sm text-white">Ongoing</h3>
          </div>
          {ongoing ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">{ongoing.registration.hackathon_title}</p>
              <p className="font-bold text-sm mb-6">Event is currently active.</p>
              <button onClick={() => onNavigate?.('hackathon-detail', ongoing.registration.hackathon_id)} className="mt-auto w-full py-3 bg-transparent border-2 border-neutral-700 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 hover:text-yellow-400 transition-colors">
                View Details
              </button>
            </>
          ) : <p className="text-sm font-bold text-neutral-400">No ongoing hackathons.</p>}
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-neutral-800 pb-2 overflow-x-auto scrollbar-hide">
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap rounded-full ${
              activeStage === stage ? 'bg-neutral-900 text-white' : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-700'
            }`}
          >
            {stage} {stage !== 'All' ? `(${stageCounts[stage]})` : `(${items.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest text-center py-16">Nothing in the pipeline yet — go explore some hackathons.</p>
        ) : filteredItems.map(({ registration: r, stage }) => (
          <div key={r.id} className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-yellow-400 transition-colors group">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-black group-hover:text-yellow-400 transition-colors">{r.hackathon_title}</h3>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${STAGE_COLORS[stage]}`}>
                  {stage}
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{r.team_name ?? 'Solo entry'}</p>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 max-w-xs h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${progressOf(stage)}%` }}></div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{progressOf(stage)}% Complete</span>
              </div>
            </div>

            <div className="flex flex-col md:items-end justify-center gap-4 border-t md:border-t-0 md:border-l border-neutral-800 pt-6 md:pt-0 md:pl-6">
              <div className="text-left md:text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Registration Closes</p>
                <p className="text-sm font-mono font-bold text-white">{new Date(r.registration_closes_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => onNavigate?.('hackathon-detail', r.hackathon_id)} className="px-6 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white hover:border-yellow-400 hover:text-yellow-400 transition-colors flex items-center justify-center gap-2">
                View Details <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
