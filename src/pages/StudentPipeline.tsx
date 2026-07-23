import React from 'react';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, PlayCircle, FolderArchive } from 'lucide-react';

interface StudentPipelineProps {
  onNavigate?: (route: string) => void;
}

export default function StudentPipeline({ onNavigate }: StudentPipelineProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">My Pipeline</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Track your hackathon progress and pending actions</p>
      </div>

      {/* Action Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} />
            <h3 className="font-black uppercase tracking-widest text-sm">Needs Action</h3>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">Code for Good 2025</p>
          <p className="font-bold text-sm mb-6">Submit Team Details by tomorrow.</p>
          <button onClick={() => onNavigate?.('hackathon-register')} className="mt-auto w-full py-3 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-[0.98] transition-transform">
            Complete Now
          </button>
        </div>
        
        <div className="bg-black rounded-[32px] p-6 text-white border-4 border-neutral-800 shadow-lg flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-neutral-400">
            <Clock size={24} />
            <h3 className="font-black uppercase tracking-widest text-sm text-white">Upcoming Deadline</h3>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">HealthHack 2025</p>
          <p className="font-bold text-sm mb-6">Round 1 Prototype submission closes in 3 days.</p>
          <button onClick={() => onNavigate?.('hackathon-detail')} className="mt-auto w-full py-3 bg-neutral-900 text-white-TMP rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-700 transition-colors">
            View Details
          </button>
        </div>

        <div className="bg-black rounded-[32px] p-6 text-white border-4 border-neutral-800 shadow-lg flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-neutral-400">
            <PlayCircle size={24} />
            <h3 className="font-black uppercase tracking-widest text-sm text-white">Ongoing</h3>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">AI Innovate 5.0</p>
          <p className="font-bold text-sm mb-6">Event is currently active. Coding phase in progress.</p>
          <button onClick={() => onNavigate?.('hackathon-detail')} className="mt-auto w-full py-3 bg-transparent border-2 border-neutral-700 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 hover:text-yellow-400 transition-colors">
            Go to Workspace
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-neutral-800 pb-2 overflow-x-auto scrollbar-hide">
        {['All (8)', 'Needs Action (1)', 'Registered (2)', 'Ongoing (1)', 'Completed (3)', 'Archived (1)'].map((tab, i) => (
          <button 
            key={tab}
            className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap rounded-full ${
              i === 0 ? 'bg-neutral-900 text-white-TMP' : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Pipeline List */}
      <div className="space-y-4">
        {[
          {
            title: 'Code for Good 2025',
            org: 'CSE Department',
            status: 'Needs Action',
            statusColor: 'bg-yellow-400 text-white border border-yellow-500',
            deadline: 'Tomorrow, 11:59 PM',
            progress: 25,
            action: 'Complete Profile'
          },
          {
            title: 'HealthHack 2025',
            org: 'Health Club',
            status: 'Registered',
            statusColor: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
            deadline: '28 May 2025',
            progress: 50,
            action: 'View Team'
          },
          {
            title: 'AI Innovate 5.0',
            org: 'AI Club',
            status: 'Ongoing',
            statusColor: 'bg-neutral-900 text-white-TMP border border-neutral-800',
            deadline: 'In Progress',
            progress: 75,
            action: 'Workspace'
          },
          {
            title: 'Web3 Buildathon',
            org: 'Tech Society',
            status: 'Completed',
            statusColor: 'bg-neutral-900 text-neutral-500 border border-neutral-700',
            deadline: 'Ended 10 May 2025',
            progress: 100,
            action: 'View Certificate'
          }
        ].map((item, i) => (
          <div key={i} className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-yellow-400 transition-colors group">
             <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black group-hover:text-yellow-400 transition-colors">{item.title}</h3>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{item.org}</p>
                
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-1 max-w-xs h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${item.progress}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{item.progress}% Complete</span>
                </div>
             </div>

             <div className="flex flex-col md:items-end justify-center gap-4 border-t md:border-t-0 md:border-l border-neutral-800 pt-6 md:pt-0 md:pl-6">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Next Milestone</p>
                  <p className="text-sm font-mono font-bold text-white">{item.deadline}</p>
                </div>
                <button onClick={() => onNavigate?.('hackathon-detail')} className="px-6 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white hover:border-yellow-400 hover:text-yellow-400 transition-colors flex items-center justify-center gap-2">
                  {item.action} <ChevronRight size={14} />
                </button>
             </div>
          </div>
        ))}
      </div>

    </div>
  );
}
