import React from 'react';
import { Edit2, Lock, Download, MoreHorizontal, Bell } from 'lucide-react';

export default function HackathonDetail() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Hackathon Detail View</h1>
          <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mt-2">Hackathons &gt; Code for Good 2025</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-black border-2 border-neutral-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:border-yellow-400 transition-colors flex items-center gap-2">
            <Edit2 size={14} /> Edit
          </button>
          <button className="px-6 py-3 bg-black border-2 border-neutral-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:border-yellow-400 transition-colors flex items-center gap-2">
            <Lock size={14} /> Close Reg
          </button>
          <button className="px-4 py-3 bg-black border-2 border-neutral-800 text-white rounded-full hover:border-yellow-400 transition-colors flex items-center justify-center">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-[48px] border-4 border-neutral-800 shadow-xl overflow-hidden p-8 text-white">
             <div className="flex justify-between items-start mb-8">
                <div>
                   <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                     Code for Good 2025 
                     <span className="bg-yellow-400 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full not-italic">Open</span>
                   </h2>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Organizer</span> <span className="font-bold">Computer Science Department</span></div>
                <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Domain</span> <span className="font-bold">Health, Social Impact, AI</span></div>
                <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Eligibility</span> <span className="font-bold">All Years (UG & PG)</span></div>
                <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Team Size</span> <span className="font-bold">2 - 5 Members (Solo Allowed: No)</span></div>
                <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Registration Closes</span> <span className="font-bold font-mono">25 May 2025</span></div>
                <div className="md:col-span-2 flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Rounds</span> <span className="font-bold font-mono">Round 1: Ideation &rarr; Round 2: Prototype &rarr; Final Demo</span></div>
                <div className="md:col-span-2 flex flex-col gap-2"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Event Links</span> 
                  <div className="flex gap-4">
                    <a href="#" className="bg-neutral-900 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-400 hover:text-white transition-colors">Website</a> 
                    <a href="#" className="bg-neutral-900 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-400 hover:text-white transition-colors">Discord</a>
                  </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl overflow-hidden flex flex-col text-white">
              <div className="p-6 border-b border-neutral-800">
                <h3 className="font-black text-lg text-yellow-400 uppercase tracking-widest">Registered Teams</h3>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                    <tr><th className="px-6 py-3 border-b border-neutral-800">Team Name</th><th className="px-6 py-3 border-b border-neutral-800">Leader</th><th className="px-6 py-3 border-b border-neutral-800">Members</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    <tr className="hover:bg-neutral-700"><td className="px-6 py-4 font-bold">ByteBusters</td><td className="px-6 py-4 text-neutral-400">Arjun K.</td><td className="px-6 py-4 text-center font-mono">4</td></tr>
                    <tr className="hover:bg-neutral-700"><td className="px-6 py-4 font-bold">CodeCrafters</td><td className="px-6 py-4 text-neutral-400">Priya S.</td><td className="px-6 py-4 text-center font-mono">5</td></tr>
                    <tr className="hover:bg-neutral-700"><td className="px-6 py-4 font-bold">DevDynamos</td><td className="px-6 py-4 text-neutral-400">Rohit M.</td><td className="px-6 py-4 text-center font-mono">3</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-neutral-800 bg-black/30 flex justify-center">
                 <button className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 transition-colors">View All (180)</button>
              </div>
            </div>

            <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl overflow-hidden flex flex-col text-white">
              <div className="p-6 border-b border-neutral-800">
                <h3 className="font-black text-lg text-yellow-400 uppercase tracking-widest">Solo Participants</h3>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                    <tr><th className="px-6 py-3 border-b border-neutral-800">Name</th><th className="px-6 py-3 border-b border-neutral-800">Department</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    <tr className="hover:bg-neutral-700"><td className="px-6 py-4 font-bold">Sneha R.</td><td className="px-6 py-4 text-neutral-400">CSE</td></tr>
                    <tr className="hover:bg-neutral-700"><td className="px-6 py-4 font-bold">Vikram J.</td><td className="px-6 py-4 text-neutral-400">ECE</td></tr>
                    <tr className="hover:bg-neutral-700"><td className="px-6 py-4 font-bold">Neha P.</td><td className="px-6 py-4 text-neutral-400">IT</td></tr>
                  </tbody>
                </table>
              </div>
               <div className="p-4 border-t border-neutral-800 bg-black/30 flex justify-center">
                 <button className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 transition-colors">View All (28)</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl p-6 text-white">
            <h3 className="font-black text-lg text-yellow-400 uppercase tracking-widest mb-6">Timeline</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-800 before:to-transparent">
               {[
                 { label: 'Registration Opens', date: '01 May 2025' },
                 { label: 'Registration Close', date: '25 May 2025', active: true },
                 { label: 'Round 1: Ideation', date: '18 May 2025' },
                 { label: 'Round 2: Prototype', date: '01 Jun 2025' },
                 { label: 'Final Demo', date: '08 Jun 2025' },
               ].map((item, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className={`flex items-center justify-center w-5 h-5 rounded-full border-4 ${item.active ? 'border-yellow-400 bg-neutral-900' : 'border-neutral-800 bg-black'} z-10 shrink-0`}></div>
                     <div className="flex flex-col ml-4">
                        <span className={`text-sm ${item.active ? 'font-bold text-white' : 'font-medium text-neutral-400'}`}>{item.label}</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 font-mono">{item.date}</span>
                     </div>
                  </div>
               ))}
            </div>
             <button className="mt-8 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 transition-colors w-full text-center">View Full Timeline</button>
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl p-6 text-white">
            <h3 className="font-black text-lg uppercase tracking-widest mb-6">Stats</h3>
             <div className="space-y-4">
               {[
                 { label: 'Interested', value: '320' },
                 { label: 'Registered', value: '180' },
                 { label: 'Solo', value: '28' },
                 { label: 'Total', value: '868' },
                 { label: 'Pending Verifications', value: '12' },
               ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-black rounded-2xl">
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{item.label}</span>
                     <span className="font-black text-lg font-mono">{item.value}</span>
                  </div>
               ))}
            </div>
          </div>
          
           <div className="bg-yellow-400 rounded-[32px] border-4 border-yellow-500 shadow-xl p-6 text-white">
            <h3 className="font-black text-lg uppercase tracking-widest mb-6">Actions</h3>
             <div className="space-y-3">
                <button className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-[0.98] transition-transform flex items-center justify-center gap-3"><Bell size={16} className="text-yellow-400"/> Push Reminder</button>
                <button className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-[0.98] transition-transform flex items-center justify-center gap-3"><Edit2 size={16} className="text-yellow-400"/> Post Announcement</button>
                <button className="w-full py-4 bg-transparent border-2 border-white text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors flex items-center justify-center gap-3"><Download size={16} /> Export Participants</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
