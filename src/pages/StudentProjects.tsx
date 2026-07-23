import React, { useState } from 'react';
import { Briefcase, Users, User, CheckCircle2, FileEdit, Search, Filter, Plus, Github, ExternalLink, Clock, Folder } from 'lucide-react';

interface StudentProjectsProps {
  onNavigate?: (route: string) => void;
}

export default function StudentProjects({ onNavigate }: StudentProjectsProps) {
  const [filter, setFilter] = useState('All Projects');
  
  const projects = [
    { 
      title: 'HealthSync App', 
      hackathon: 'HealthHack 2024', 
      type: 'Team', 
      status: 'Published',
      updated: '10 Jan 2025',
      hasGithub: true,
      hasDemo: true,
      desc: 'A decentralized health records management system built with React and Solidity.'
    },
    { 
      title: 'EcoTrack Dashboard', 
      hackathon: 'Code for Good 2024', 
      type: 'Team', 
      status: 'Published',
      updated: '15 Dec 2024',
      hasGithub: true,
      hasDemo: false,
      desc: 'Real-time carbon footprint tracker for university campuses.'
    },
    { 
      title: 'AI Study Assistant', 
      hackathon: 'AI Innovate 4.0', 
      type: 'Solo', 
      status: 'Draft',
      updated: '05 May 2025',
      hasGithub: false,
      hasDemo: false,
      desc: 'Personalized study path generator using Gemini API.'
    },
    { 
      title: 'Campus Navigate UI', 
      hackathon: 'Designathon 2024', 
      type: 'Team', 
      status: 'Draft',
      updated: '12 Apr 2025',
      hasGithub: true,
      hasDemo: true,
      desc: 'Figma prototypes and frontend implementation for campus indoor navigation.'
    }
  ];

  const filteredProjects = projects.filter(p => {
    if (filter === 'All Projects') return true;
    if (filter === 'Team' || filter === 'Solo') return p.type === filter;
    if (filter === 'Published' || filter === 'Drafts') return p.status === (filter === 'Drafts' ? 'Draft' : 'Published');
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Projects Repository</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Manage your hackathon submissions and portfolio</p>
        </div>
        <button onClick={() => onNavigate?.('project-add')} className="px-6 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg">
          <Plus size={16} /> Add New Project
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Projects', value: '4', icon: Folder, highlight: true },
          { label: 'Team Projects', value: '3', icon: Users, highlight: false },
          { label: 'Solo Projects', value: '1', icon: User, highlight: false },
          { label: 'Published', value: '2', icon: CheckCircle2, highlight: false },
          { label: 'Drafts', value: '2', icon: FileEdit, highlight: false },
        ].map((stat, i) => (
          <div key={i} className={`${stat.highlight ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-black text-white border-neutral-800'} p-5 rounded-3xl border-2 shadow-lg flex flex-col justify-between h-32`}>
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

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search projects by name, hackathon, or tech stack..." 
            className="w-full pl-14 pr-6 py-4 bg-black border-4 border-neutral-800 rounded-full focus:border-yellow-400 focus:bg-neutral-900 text-sm outline-none text-white placeholder-neutral-500 font-bold transition-all"
          />
        </div>
        <button className="px-8 py-4 bg-neutral-900 text-white-TMP border-4 border-white rounded-full hover:bg-neutral-700 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors shrink-0">
          <Filter size={18} /> Filters
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
         {['All Projects', 'Team', 'Solo', 'Published', 'Drafts'].map((tab) => (
           <button 
             key={tab}
             onClick={() => setFilter(tab)}
             className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0 ${
               filter === tab 
                 ? 'bg-neutral-900 text-white-TMP border-2 border-white' 
                 : 'bg-black border-2 border-neutral-800 text-neutral-400 hover:border-white hover:text-white'
             }`}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredProjects.map((project, i) => (
          <div key={i} className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 flex flex-col hover:border-yellow-400 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                project.status === 'Published' ? 'bg-yellow-400 text-white border border-yellow-500' : 'bg-neutral-800 text-white border border-neutral-700'
              }`}>
                {project.status}
              </span>
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {project.type}
              </span>
            </div>
            
            <h3 className="text-xl font-black leading-tight mb-2 group-hover:text-yellow-400 transition-colors cursor-pointer" onClick={() => onNavigate?.('project-detail')}>{project.title}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4">{project.hackathon}</p>
            
            <p className="text-sm text-neutral-400 mb-6 line-clamp-2">{project.desc}</p>
            
            <div className="flex items-center gap-4 mb-6">
              {project.hasGithub ? (
                <button className="text-neutral-400 hover:text-white transition-colors" title="GitHub Repository">
                  <Github size={20} />
                </button>
              ) : (
                <div className="text-neutral-700" title="No GitHub Link">
                  <Github size={20} />
                </div>
              )}
              {project.hasDemo ? (
                <button className="text-neutral-400 hover:text-white transition-colors" title="Live Demo">
                  <ExternalLink size={20} />
                </button>
              ) : (
                <div className="text-neutral-700" title="No Live Demo">
                  <ExternalLink size={20} />
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-neutral-800 flex items-center justify-between">
               <div className="flex items-center gap-2 text-neutral-500">
                 <Clock size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">{project.updated}</span>
               </div>
               <button onClick={() => onNavigate?.('project-add')} className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white hover:border-yellow-400 transition-colors">
                 <FileEdit size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
