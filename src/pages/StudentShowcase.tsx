import React from 'react';
import { Search, Filter, Github, ExternalLink, Users, User, ArrowRight } from 'lucide-react';

interface StudentShowcaseProps {
  onNavigate?: (route: string) => void;
}

export default function StudentShowcase({ onNavigate }: StudentShowcaseProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Innovation Gallery</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Discover published projects and winning solutions</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search projects by domain, tech stack, or team..." 
            className="w-full pl-14 pr-6 py-4 bg-black border-4 border-neutral-800 rounded-full focus:border-yellow-400 focus:bg-neutral-900 text-sm outline-none text-white placeholder-neutral-500 font-bold transition-all"
          />
        </div>
        <button className="px-8 py-4 bg-neutral-900 text-white-TMP border-4 border-white rounded-full hover:bg-neutral-700 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors">
          <Filter size={18} /> Filters
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide border-b border-neutral-800">
         <select className="px-6 py-3 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none appearance-none hover:border-yellow-400 transition-colors shrink-0">
           <option>All Hackathons</option>
           <option>Code for Good 2024</option>
           <option>HealthHack 2024</option>
         </select>
         <select className="px-6 py-3 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none appearance-none hover:border-yellow-400 transition-colors shrink-0">
           <option>All Domains</option>
         </select>
         <select className="px-6 py-3 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none appearance-none hover:border-yellow-400 transition-colors shrink-0">
           <option>Winner & Finalists</option>
         </select>
      </div>

      {/* Featured Projects */}
      <div>
        <h2 className="text-lg font-black uppercase tracking-widest text-yellow-400 mb-6">Featured / Winners</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'EcoTrack Platform',
              hackathon: 'Sustainability Hack 2024 (1st Place)',
              team: 'GreenTech Innovators',
              type: 'Team',
              desc: 'An AI-powered dashboard for tracking corporate carbon footprints and suggesting sustainable alternatives in real-time.',
              tags: ['React', 'Python', 'AI'],
              image: true
            },
            {
              title: 'MedChain Records',
              hackathon: 'HealthHack 2024 (Runner Up)',
              team: 'BlockHealers',
              type: 'Team',
              desc: 'Decentralized health records system using Ethereum smart contracts to ensure patient data privacy and control.',
              tags: ['Web3', 'Solidity', 'Next.js'],
              image: true
            }
          ].map((project, i) => (
            <div key={i} className="bg-black border-4 border-neutral-800 rounded-[32px] overflow-hidden flex flex-col sm:flex-row group hover:border-yellow-400 transition-colors">
              <div className="w-full sm:w-2/5 h-48 sm:h-auto bg-neutral-900 border-b-4 sm:border-b-0 sm:border-r-4 border-neutral-800 flex items-center justify-center p-6 relative">
                 <div className="absolute inset-0 bg-yellow-400/5 group-hover:bg-yellow-400/10 transition-colors"></div>
                 <span className="text-neutral-700 font-black text-xs uppercase tracking-widest z-10">Project Image</span>
              </div>
              <div className="p-6 sm:w-3/5 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-yellow-400 text-white text-[9px] font-bold uppercase tracking-widest rounded">Winner</span>
                </div>
                <h3 className="text-xl font-black leading-tight mb-1 group-hover:text-yellow-400 transition-colors">{project.title}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">{project.hackathon}</p>
                <p className="text-sm text-neutral-400 mb-4 line-clamp-2">{project.desc}</p>
                
                <div className="mt-auto flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs font-bold text-white">
                     {project.type === 'Team' ? <Users size={14} className="text-yellow-400" /> : <User size={14} className="text-yellow-400" />}
                     {project.team}
                   </div>
                   <button onClick={() => onNavigate?.('project-detail')} className="w-8 h-8 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center text-white hover:border-yellow-400 transition-colors">
                     <ArrowRight size={14} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Projects Grid */}
      <div className="pt-8">
        <h2 className="text-lg font-black uppercase tracking-widest text-white mb-6">Recent Submissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { title: 'Campus Navigate UI', team: 'Design Divas', type: 'Team', hackathon: 'Designathon 2024' },
            { title: 'AI Study Assistant', team: 'Alex M.', type: 'Solo', hackathon: 'EdTech Hack' },
            { title: 'FinDash', team: 'Quant Squad', type: 'Team', hackathon: 'FinTech 2024' },
            { title: 'Smart Parking', team: 'IoT Builders', type: 'Team', hackathon: 'Smart City Hack' },
            { title: 'Web3 Auth Service', team: 'Crypto Kids', type: 'Team', hackathon: 'Code for Good 2024' },
            { title: 'Recipe AI', team: 'Foodies', type: 'Team', hackathon: 'AI Innovate 4.0' },
            { title: 'Accessibility Maps', team: 'Sarah J.', type: 'Solo', hackathon: 'Designathon 2024' },
            { title: 'Study Sync', team: 'Late Nighters', type: 'Team', hackathon: 'EdTech Hack' }
          ].map((project, i) => (
            <div key={i} className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 flex flex-col hover:border-yellow-400 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{project.hackathon}</span>
                 {project.type === 'Team' ? <Users size={14} className="text-neutral-400" /> : <User size={14} className="text-neutral-400" />}
              </div>
              <h3 className="text-lg font-black leading-tight mb-2 group-hover:text-yellow-400 transition-colors">{project.title}</h3>
              <p className="text-xs text-neutral-400 font-bold mb-6">By {project.team}</p>
              
              <div className="mt-auto flex items-center gap-3">
                 <button className="flex-1 py-2.5 bg-neutral-900 border border-neutral-800 rounded-full flex justify-center items-center gap-2 hover:border-white transition-colors text-[10px] font-bold uppercase tracking-widest text-white">
                   <Github size={14} className="text-neutral-500" /> Repo
                 </button>
                 <button onClick={() => onNavigate?.('project-detail')} className="flex-1 py-2.5 bg-neutral-900 text-white-TMP rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-700 transition-colors">
                   View
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
