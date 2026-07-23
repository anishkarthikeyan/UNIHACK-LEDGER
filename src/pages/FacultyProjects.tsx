import React, { useState } from 'react';
import { Search, Briefcase, ExternalLink, Filter } from 'lucide-react';

export default function FacultyProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const projects = [
    { id: 1, title: 'Smart Farming AI', team: 'ByteMe', hackathon: 'AI Innovate 5.0', status: 'Submitted', date: 'Oct 15' },
    { id: 2, name: 'EcoTrack App', team: 'Green Coders', hackathon: 'Code for Good 2025', status: 'Under Review', date: 'Sep 22' },
    { id: 3, name: 'Web3 Wallet', team: 'Crypto Knights', hackathon: 'Tether Developers Cup', status: 'Winner', date: 'Aug 10' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Projects</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Review submitted hackathon projects</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="w-full pl-10 pr-4 py-3 bg-black border-2 border-neutral-800 rounded-full text-sm font-bold focus:border-yellow-400 outline-none transition-colors text-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map(proj => (
          <div key={proj.id} className="bg-black border-4 border-neutral-800 rounded-3xl p-6 relative flex flex-col group hover:border-yellow-400 transition-colors">
            <h3 className="text-xl font-black text-white mb-1">{proj.title || proj.name}</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">{proj.hackathon}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Team</p>
                <p className="text-sm font-bold text-white">{proj.team}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Submitted</p>
                <p className="text-sm font-bold text-white">{proj.date}</p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-neutral-800 flex justify-between items-center">
               <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                proj.status === 'Winner' ? 'bg-yellow-400/20 text-yellow-600 border border-yellow-400/20' : 
                proj.status === 'Under Review' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                'bg-neutral-700/50 text-neutral-400'
              }`}>
                {proj.status}
              </span>
              <button className="px-4 py-2 bg-neutral-900 text-white-TMP rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-95 transition-transform flex items-center gap-2">
                Review <ExternalLink size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
