import React, { useEffect, useState } from 'react';
import { Search, Users, Loader2, Globe, Lock } from 'lucide-react';
import { api } from '../lib/api';
import type { Team } from '../types';

export default function FacultyTeams() {
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.teams.all()
      .then(setTeams)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load teams.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = teams.filter((t) => !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Teams</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">All teams across the platform</p>
        </div>
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

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      {filtered.length === 0 ? (
        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">No teams found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filtered.map((team) => (
            <div key={team.id} className="bg-black border-4 border-neutral-800 rounded-3xl p-6 relative flex flex-col group hover:border-yellow-400 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shrink-0 border border-neutral-800">
                  <Users size={20} className="text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-neutral-800 text-neutral-300 flex items-center gap-1">
                  {team.visibility === 'public' ? <Globe size={10} /> : <Lock size={10} />} {team.visibility}
                </span>
              </div>

              <h3 className="text-xl font-black text-white mb-1">{team.name}</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6">{team.description ?? 'No description'}</p>

              <div className="mt-auto pt-4 border-t border-neutral-800 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  {team.member_count} / {team.max_members} Members
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{team.join_mode}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
