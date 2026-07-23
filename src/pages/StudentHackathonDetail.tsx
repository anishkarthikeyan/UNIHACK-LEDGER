import React from 'react';
import { ChevronLeft, Calendar, Users, FileText, Download, CheckCircle2, AlertCircle, Clock, MapPin, Globe, Star } from 'lucide-react';

interface StudentHackathonDetailProps {
  onNavigate?: (route: string) => void;
}

export default function StudentHackathonDetail({ onNavigate }: StudentHackathonDetailProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-neutral-800 pb-8">
        <div>
          <button 
            onClick={() => onNavigate?.('explore')}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Explore
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white">Code for Good 2025</h1>
            <span className="px-3 py-1 bg-yellow-400 text-white font-bold uppercase tracking-widest text-[10px] rounded-full border border-yellow-500 mt-2">
              Registration Open
            </span>
          </div>
          <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest">Organized by CSE Department</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 min-w-max">
          <button className="px-6 py-4 bg-neutral-900 border-2 border-neutral-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors flex items-center justify-center gap-2">
            <Star size={16} /> Mark Interested
          </button>
          <button 
            onClick={() => onNavigate?.('hackathon-register')}
            className="px-8 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2"
          >
            Register Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Info Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black border-4 border-neutral-800 rounded-[32px] p-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Mode</span>
              <span className="text-sm font-bold text-white flex items-center gap-2"><MapPin size={14} className="text-yellow-400" /> Offline</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-neutral-800 pl-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Team Size</span>
              <span className="text-sm font-bold text-white flex items-center gap-2"><Users size={14} className="text-yellow-400" /> 2 - 4 Members</span>
            </div>
            <div className="flex flex-col gap-1 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 pl-0 md:pl-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Eligibility</span>
              <span className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle2 size={14} className="text-yellow-400" /> All Years</span>
            </div>
            <div className="flex flex-col gap-1 border-t md:border-t-0 border-l border-neutral-800 pt-4 md:pt-0 pl-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Reg. Closes</span>
              <span className="text-sm font-bold text-white flex items-center gap-2"><Clock size={14} className="text-yellow-400" /> 25 May 2025</span>
            </div>
          </div>

          <div className="space-y-6 text-white">
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">About the Hackathon</h2>
              <p className="text-sm leading-relaxed text-neutral-300">
                Code for Good is the university's premier social impact hackathon. Build tech solutions for non-profits and community organizations. This year's focus areas include sustainability, accessible education, and healthcare logistics.
              </p>
            </section>
            
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Domains & Themes</h2>
              <div className="flex flex-wrap gap-2">
                {['Social Impact', 'Sustainability', 'Healthcare', 'EdTech', 'AI for Good'].map(tech => (
                  <span key={tech} className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Timeline */}
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8">
             <h2 className="text-lg font-black uppercase tracking-widest text-white mb-8 flex items-center gap-2">
              <Calendar size={18} className="text-yellow-400" /> Event Timeline
            </h2>
            
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-800 before:to-transparent">
              
              {[
                { title: 'Registration Opens', date: '01 May 2025', desc: 'Team formation and registration begins.', active: false },
                { title: 'Registration Closes', date: '25 May 2025', desc: 'Deadline to submit team details and finalize members.', active: true },
                { title: 'Round 1: Ideation', date: '01 Jun 2025', desc: 'Online submission of problem statement and proposed solution.', active: false },
                { title: 'Grand Finale (Offline)', date: '15 Jun 2025', desc: '24-hour hackathon at the Main Campus Auditorium.', active: false },
              ].map((milestone, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-neutral-100 bg-neutral-900 text-neutral-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <div className={`w-3 h-3 rounded-full ${milestone.active ? 'bg-yellow-400' : 'bg-neutral-700'}`}></div>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border-2 border-neutral-800 bg-neutral-900 group-hover:border-neutral-600 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold text-sm ${milestone.active ? 'text-yellow-400' : 'text-white'}`}>{milestone.title}</h3>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">{milestone.date}</p>
                    <p className="text-xs text-neutral-400">{milestone.desc}</p>
                  </div>
                </div>
              ))}
              
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Rules & Eligibility */}
          <div className="bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg">
             <div className="flex items-center gap-3 mb-6">
              <AlertCircle size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">Important Rules</h3>
            </div>
            
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0"></div>
                <p>Teams must consist of students from the same university.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0"></div>
                <p>Inter-departmental teams are highly encouraged.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0"></div>
                <p>All participants must bring a valid student ID to the offline finale.</p>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 space-y-6">
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Downloads & Attachments</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-yellow-400 transition-colors group text-left">
                  <div className="flex items-center gap-3 text-white">
                    <FileText size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
                    <div>
                      <p className="text-xs font-bold text-white">Rulebook_2025.pdf</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">2.4 MB</p>
                    </div>
                  </div>
                  <Download size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-yellow-400 transition-colors group text-left">
                  <div className="flex items-center gap-3 text-white">
                    <FileText size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
                    <div>
                      <p className="text-xs font-bold text-white">Problem_Statements.pdf</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">1.1 MB</p>
                    </div>
                  </div>
                  <Download size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
            
            <div className="pt-6 border-t border-neutral-800">
               <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Faculty Coordinator</h3>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-yellow-400 border border-neutral-800 font-black text-sm">
                   DR
                 </div>
                 <div>
                   <p className="font-bold text-white text-sm">Dr. Rajesh Kumar</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">CSE Dept. • rajesh.k@uni.edu</p>
                 </div>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
