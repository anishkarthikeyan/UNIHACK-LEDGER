import React from 'react';
import { ChevronLeft, FileEdit, Github, Globe, FileText, Image as ImageIcon, MessageSquare, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';

interface StudentProjectDetailProps {
  onNavigate?: (route: string) => void;
}

export default function StudentProjectDetail({ onNavigate }: StudentProjectDetailProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-neutral-800 pb-8">
        <div>
          <button 
            onClick={() => onNavigate?.('projects')}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Repository
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white">HealthSync App</h1>
            <span className="px-3 py-1 bg-yellow-400 text-white font-bold uppercase tracking-widest text-[10px] rounded-full border border-yellow-500">
              Published
            </span>
            <span className="px-3 py-1 bg-neutral-800 text-white font-bold uppercase tracking-widest text-[10px] rounded-full border border-neutral-700">
              Team Project
            </span>
          </div>
          <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest">HealthHack 2024</p>
        </div>
        
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-black border-2 border-neutral-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors flex items-center justify-center gap-2">
            <ExternalLink size={16} /> View Public
          </button>
          <button 
            onClick={() => onNavigate?.('project-add')}
            className="px-6 py-3 bg-neutral-900 text-white-TMP rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
          >
            <FileEdit size={16} /> Edit Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Cover (Optional, if they have an image) */}
          <div className="w-full h-64 md:h-80 bg-black border-4 border-neutral-800 rounded-[32px] flex items-center justify-center overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent z-10"></div>
            <ImageIcon size={48} className="text-neutral-700 z-0" />
            <div className="absolute bottom-6 left-6 right-6 z-20">
               <h3 className="text-xl font-black text-white mb-2">Project Cover Image</h3>
               <p className="text-xs text-neutral-400">healthsync-cover-final.png</p>
            </div>
          </div>

          <div className="space-y-6 text-white">
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Problem Statement</h2>
              <p className="text-sm leading-relaxed bg-black p-6 rounded-2xl border-l-4 border-yellow-400">
                Patient records are fragmented across multiple healthcare providers, making it difficult for individuals to have a complete view of their medical history in emergencies.
              </p>
            </section>
            
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Solution Description</h2>
              <p className="text-sm leading-relaxed text-neutral-300">
                HealthSync is a decentralized health records management system built with React and Solidity. It empowers patients by giving them full control over who accesses their medical data via smart contracts, ensuring security, transparency, and interoperability between different hospital systems.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {['React', 'Node.js', 'Solidity', 'Ethereum', 'Tailwind CSS'].map(tech => (
                  <span key={tech} className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Faculty Feedback */}
          <div className="bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg">
             <div className="flex items-center gap-3 mb-4">
              <MessageSquare size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">Faculty Review</h3>
            </div>
            <div className="bg-black/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-green-700" />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                "Excellent use of blockchain for data integrity. The UI is clean, and the presentation clearly articulated the real-world impact. Approved for public showcase."
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-4">
                — Dr. Meena R. (12 Jan 2025)
              </p>
            </div>
          </div>

          {/* Links & Resources */}
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 space-y-6">
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Project Links</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-yellow-400 transition-colors group">
                  <div className="flex items-center gap-3 text-white">
                    <Github size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
                    <span className="text-xs font-bold font-mono">github.com/team/healthsync</span>
                  </div>
                  <ExternalLink size={14} className="text-neutral-500" />
                </a>
                <a href="#" className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-yellow-400 transition-colors group">
                  <div className="flex items-center gap-3 text-white">
                    <Globe size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
                    <span className="text-xs font-bold font-mono">healthsync-demo.app</span>
                  </div>
                  <ExternalLink size={14} className="text-neutral-500" />
                </a>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-800">
              <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Uploaded Assets</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-neutral-400">
                      <FileText size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Pitch_Deck.pdf</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest">2.4 MB</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-neutral-400">
                      <ImageIcon size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">App_Screenshots.zip</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest">12.1 MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          {/* Metadata */}
          <div className="flex flex-col gap-2 p-6">
             <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
               <span className="text-neutral-500">Created</span>
               <span className="text-white">10 Jan 2025</span>
             </div>
             <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
               <span className="text-neutral-500">Last Updated</span>
               <span className="text-white">12 Jan 2025</span>
             </div>
             <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
               <span className="text-neutral-500">Visibility</span>
               <span className="text-yellow-400 flex items-center gap-1"><Globe size={12} /> Public Showcase</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
