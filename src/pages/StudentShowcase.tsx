import React, { useEffect, useState } from 'react';
import { Search, Github, ExternalLink, Users, User, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Project } from '../types';
import type { NavigateFn } from '../App';

interface StudentShowcaseProps {
  onNavigate?: NavigateFn;
}

export default function StudentShowcase({ onNavigate }: StudentShowcaseProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.projects.showcase()
      .then(setProjects)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load showcase.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.hackathon_title ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.team_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    p.tech_stack.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const featured = filtered.filter((p) => p.showcase_featured);
  const rest = filtered.filter((p) => !p.showcase_featured);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Innovation Gallery</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Discover published projects and winning solutions</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title, hackathon, team, or tech stack..."
            className="w-full pl-14 pr-6 py-4 bg-black border-4 border-neutral-800 rounded-full focus:border-yellow-400 focus:bg-neutral-900 text-sm outline-none text-white placeholder-neutral-500 font-bold transition-all"
          />
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest text-center py-20">No public projects yet — be the first to publish one from your Projects page.</p>
      ) : (
        <>
          {featured.length > 0 && (
            <div>
              <h2 className="text-lg font-black uppercase tracking-widest text-yellow-400 mb-6">Featured</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featured.map((project) => (
                  <div key={project.id} className="bg-black border-4 border-neutral-800 rounded-[32px] overflow-hidden flex flex-col sm:flex-row group hover:border-yellow-400 transition-colors">
                    <div className="w-full sm:w-2/5 h-48 sm:h-auto bg-neutral-900 border-b-4 sm:border-b-0 sm:border-r-4 border-neutral-800 flex items-center justify-center p-6 relative overflow-hidden">
                      {project.poster_url ? (
                        <img src={project.poster_url} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <span className="text-neutral-700 font-black text-xs uppercase tracking-widest z-10">No Image</span>
                      )}
                    </div>
                    <div className="p-6 sm:w-3/5 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-yellow-400 text-white text-[9px] font-bold uppercase tracking-widest rounded">Featured</span>
                      </div>
                      <h3 className="text-xl font-black leading-tight mb-1 group-hover:text-yellow-400 transition-colors">{project.title}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">{project.hackathon_title ?? 'Independent project'}</p>
                      <p className="text-sm text-neutral-400 mb-4 line-clamp-2">{project.description}</p>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          {project.participation_mode === 'team' ? <Users size={14} className="text-yellow-400" /> : <User size={14} className="text-yellow-400" />}
                          {project.team_name ?? 'Solo'}
                        </div>
                        <button onClick={() => onNavigate?.('project-detail', project.id)} className="w-8 h-8 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center text-white hover:border-yellow-400 transition-colors">
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-8">
            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-6">Recent Submissions</h2>
            {rest.length === 0 ? (
              <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">No other public submissions match this search.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {rest.map((project) => (
                  <div key={project.id} className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 flex flex-col hover:border-yellow-400 transition-colors group cursor-pointer" onClick={() => onNavigate?.('project-detail', project.id)}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{project.hackathon_title ?? 'Independent'}</span>
                      {project.participation_mode === 'team' ? <Users size={14} className="text-neutral-400" /> : <User size={14} className="text-neutral-400" />}
                    </div>
                    <h3 className="text-lg font-black leading-tight mb-2 group-hover:text-yellow-400 transition-colors">{project.title}</h3>
                    <p className="text-xs text-neutral-400 font-bold mb-6">{project.team_name ?? 'Solo project'}</p>

                    <div className="mt-auto flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      {project.github_url ? (
                        <a href={project.github_url} target="_blank" rel="noreferrer" className="flex-1 py-2.5 bg-neutral-900 border border-neutral-800 rounded-full flex justify-center items-center gap-2 hover:border-white transition-colors text-[10px] font-bold uppercase tracking-widest text-white">
                          <Github size={14} className="text-neutral-500" /> Repo
                        </a>
                      ) : (
                        <div className="flex-1 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-full flex justify-center items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                          <Github size={14} /> No Repo
                        </div>
                      )}
                      <button onClick={() => onNavigate?.('project-detail', project.id)} className="flex-1 py-2.5 bg-neutral-900 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-700 transition-colors flex justify-center items-center gap-2">
                        <ExternalLink size={12} /> View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
