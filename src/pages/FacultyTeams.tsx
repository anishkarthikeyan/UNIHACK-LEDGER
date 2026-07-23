import React, { useState } from 'react';
import { Search, Users, ExternalLink } from 'lucide-react';

export default function FacultyTeams() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const teams = [
    { id: 1, name: 'ByteMe', members: 4, hackathon: 'AI Innovate 5.0', status: 'Registered' },
    { id: 2, name: 'Quantum Coders', members: 3, hackathon: 'Code for Good 2025', status: 'Pending Verification' },
    { id: 3, name: 'Design Divas', members: 2, hackathon: 'Designathon 2024', status: 'Verified' },
    { id: 4, name: 'Data Miners', members: 5, hackathon: 'DataVerse Challenge', status: 'Registered' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Teams</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Manage participating teams</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search teams..." 
              className="w-full pl-10 pr-4 py-3 bg-black border-2 border-neutral-800 rounded-full text-sm font-bold focus:border-yellow-400 outline-none transition-colors text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {teams.map(team => (
          <div key={team.id} className="bg-black border-4 border-neutral-800 rounded-3xl p-6 relative flex flex-col group hover:border-yellow-400 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shrink-0">
                <Users size={20} className="text-white" />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                team.status === 'Verified' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 
                team.status === 'Pending Verification' ? 'bg-yellow-400/20 text-yellow-600 border border-yellow-400/20' :
                'bg-neutral-700/50 text-neutral-400'
              }`}>
                {team.status}
              </span>
            </div>
            
            <h3 className="text-xl font-black text-white mb-1">{team.name}</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6">{team.hackathon}</p>
            
            <div className="mt-auto pt-4 border-t border-neutral-800 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {team.members} Members
              </span>
              <button className="text-white hover:text-yellow-500 transition-colors">
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
