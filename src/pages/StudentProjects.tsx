import React, { useEffect, useState } from 'react';
import { Briefcase, Users, User, CheckCircle2, FileEdit, Search, Plus, Github, ExternalLink, Clock, Folder, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Project } from '../types';
import type { NavigateFn } from '../App';

interface StudentProjectsProps {
  onNavigate?: NavigateFn;
}

export default function StudentProjects({ onNavigate }: StudentProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All Projects');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.projects.mine()
      .then(setProjects)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load projects.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (filter === 'Team' && p.participation_mode !== 'team') return false;
    if (filter === 'Solo' && p.participation_mode !== 'solo') return false;
    if (filter === 'Public' && p.visibility !== 'public') return false;
    if (filter === 'Private' && p.visibility !== 'private') return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !(p.hackathon_title ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const teamCount = projects.filter((p) => p.participation_mode === 'team').length;
  const soloCount = projects.filter((p) => p.participation_mode === 'solo').length;
  const publicCount = projects.filter((p) => p.visibility === 'public').length;
  const privateCount = projects.filter((p) => p.visibility === 'private').length;

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">Projects Repository</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Manage your hackathon submissions and portfolio</p>
        </div>
        <button onClick={() => onNavigate?.('project-add')} className="px-6 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg">
          <Plus size={16} /> Add New Project
        </button>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Projects', value: projects.length, icon: Folder, highlight: true },
          { label: 'Team Projects', value: teamCount, icon: Users, highlight: false },
          { label: 'Solo Projects', value: soloCount, icon: User, highlight: false },
          { label: 'Public', value: publicCount, icon: CheckCircle2, highlight: false },
          { label: 'Private', value: privateCount, icon: FileEdit, highlight: false },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.highlight ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-black text-white border-neutral-800'} p-5 rounded-3xl border-2 shadow-lg flex flex-col justify-between h-32`}>
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl ${stat.highlight ? 'bg-neutral-900 text-yellow-400' : 'bg-neutral-800 text-white'}`}>
                <stat.icon size={20} />
              </div>
              <p className="text-3xl font-black leading-none font-mono">{stat.value}</p>
            </div>
            <p className={`text-[10px] uppercase font-bold tracking-widest leading-tight ${stat.highlight ? 'text-white/70' : 'text-neutral-500'}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name or hackathon..."
            className="w-full pl-14 pr-6 py-4 bg-black border-4 border-neutral-800 rounded-full focus:border-yellow-400 focus:bg-neutral-900 text-sm outline-none text-white placeholder-neutral-500 font-bold transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {['All Projects', 'Team', 'Solo', 'Public', 'Private'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0 ${
              filter === tab
                ? 'bg-neutral-900 text-white border-2 border-white'
                : 'bg-black border-2 border-neutral-800 text-neutral-400 hover:border-white hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest text-center py-20 flex items-center justify-center gap-2"><Briefcase size={16} /> No projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 flex flex-col hover:border-yellow-400 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  project.visibility === 'public' ? 'bg-yellow-400 text-white border border-yellow-500' : 'bg-neutral-800 text-white border border-neutral-700'
                }`}>
                  {project.visibility}
                </span>
                <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  {project.participation_mode}
                </span>
              </div>

              <h3 className="text-xl font-black leading-tight mb-2 group-hover:text-yellow-400 transition-colors cursor-pointer" onClick={() => onNavigate?.('project-detail', project.id)}>{project.title}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4">{project.hackathon_title ?? 'No linked hackathon'}</p>

              <p className="text-sm text-neutral-400 mb-6 line-clamp-2">{project.description}</p>

              <div className="flex items-center gap-4 mb-6">
                {project.github_url ? (
                  <a href={project.github_url} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors" title="GitHub Repository">
                    <Github size={20} />
                  </a>
                ) : (
                  <div className="text-neutral-700" title="No GitHub Link"><Github size={20} /></div>
                )}
                {project.demo_url ? (
                  <a href={project.demo_url} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors" title="Live Demo">
                    <ExternalLink size={20} />
                  </a>
                ) : (
                  <div className="text-neutral-700" title="No Live Demo"><ExternalLink size={20} /></div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
                <button onClick={() => onNavigate?.('project-detail', project.id)} className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white hover:border-yellow-400 transition-colors">
                  <FileEdit size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
