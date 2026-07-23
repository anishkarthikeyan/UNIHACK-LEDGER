import React from 'react';
import { Search, Filter, Edit2, Copy, Trash2, MoreVertical, Eye } from 'lucide-react';
import { Hackathon } from '../types';

const MOCK_HACKATHONS: Hackathon[] = [
  { id: '1', name: 'Code for Good 2025', status: 'Active', regCloseDate: '25 May 2025', currentRound: 'Round 1: Ideation', interested: 320, registered: 180, lastUpdated: '' },
  { id: '2', name: 'AI Innovate 5.0', status: 'Active', regCloseDate: '02 Jun 2025', currentRound: 'Round 1: Ideation', interested: 210, registered: 120, lastUpdated: '' },
  { id: '3', name: 'Web3 Buildathon', status: 'Upcoming', regCloseDate: '10 Jun 2025', currentRound: 'Upcoming', interested: 150, registered: 45, lastUpdated: '' },
  { id: '4', name: 'HealthHack 2025', status: 'Active', regCloseDate: '28 May 2025', currentRound: 'Round 2: Prototype', interested: 190, registered: 110, lastUpdated: '' },
  { id: '5', name: 'DataVerse Challenge', status: 'Upcoming', regCloseDate: '05 Jun 2025', currentRound: 'Upcoming', interested: 240, registered: 90, lastUpdated: '' },
  { id: '6', name: 'SecureFuture Hack', status: 'Active', regCloseDate: '20 May 2025', currentRound: 'Final Round', interested: 180, registered: 95, lastUpdated: '' },
];

export default function ManageHackathons() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Published Hackathons</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Manage approved and published events</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main List Area */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4 border-b border-neutral-800 overflow-x-auto pb-1 scrollbar-hide">
            {['All (12)', 'Open (3)', 'Upcoming (4)', 'Ongoing (3)', 'Ended (2)', 'Deadline Soon (5)'].map((tab, i) => (
              <button 
                key={tab}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap rounded-full ${
                  i === 0 ? 'bg-yellow-400 text-white' : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search hackathons..." 
                className="w-full pl-11 pr-4 py-3 bg-black border border-neutral-800 rounded-full focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-sm outline-none text-white placeholder-neutral-500 transition-all"
              />
            </div>
            <button className="px-4 py-3 bg-black border border-neutral-800 rounded-full hover:border-yellow-400 hover:text-yellow-400 text-white flex items-center justify-center transition-colors">
              <Filter size={18} />
            </button>
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 border-b border-neutral-800">Hackathon Name</th>
                    <th className="px-6 py-4 border-b border-neutral-800 text-center">Status</th>
                    <th className="px-6 py-4 border-b border-neutral-800">Reg. Close Date</th>
                    <th className="px-6 py-4 border-b border-neutral-800">Current Round</th>
                    <th className="px-6 py-4 border-b border-neutral-800 text-center">Interested</th>
                    <th className="px-6 py-4 border-b border-neutral-800 text-center">Registered</th>
                    <th className="px-6 py-4 border-b border-neutral-800 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-white">
                  {MOCK_HACKATHONS.map((h) => (
                    <tr key={h.id} className="hover:bg-neutral-700 transition-colors">
                      <td className="px-6 py-4 font-bold">{h.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          h.status === 'Active' ? 'bg-yellow-400 text-white' : 'bg-neutral-800 text-neutral-300'
                        }`}>
                          {h.status === 'Active' ? 'Open' : h.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{h.regCloseDate}</td>
                      <td className="px-6 py-4 text-neutral-400 text-xs font-bold uppercase tracking-wider">{h.currentRound}</td>
                      <td className="px-6 py-4 text-center text-neutral-400 font-mono">{h.interested}</td>
                      <td className="px-6 py-4 text-center font-bold text-yellow-400 font-mono">{h.registered}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-4 text-neutral-500">
                          <button className="hover:text-yellow-400 transition-colors"><Edit2 size={16} /></button>
                          <button className="hover:text-yellow-400 transition-colors"><Copy size={16} /></button>
                          <button className="hover:text-yellow-400 transition-colors"><MoreVertical size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-neutral-800 flex items-center justify-between bg-black/30 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              <span>Showing 1 to 6 of 12</span>
              <div className="flex gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-700 hover:border-yellow-400 hover:text-white transition-colors">&lt;</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-400 text-white font-black">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-700 hover:border-yellow-400 hover:text-white transition-colors">2</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-700 hover:border-yellow-400 hover:text-white transition-colors">&gt;</button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Edit Sidebar */}
        <div className="w-full lg:w-[360px] space-y-4">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl overflow-hidden flex flex-col text-white">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-black">
              <h3 className="font-black text-lg tracking-tight uppercase">Quick Edit</h3>
              <button className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors">&times;</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex bg-neutral-800 rounded-full p-1 text-[10px] font-bold uppercase tracking-widest">
                <button className="bg-neutral-900 text-white-TMP py-2 px-4 rounded-full flex-1 shadow-sm text-center">Details</button>
                <button className="text-neutral-500 hover:text-white py-2 px-4 rounded-full flex-1 text-center transition-colors">Round</button>
                <button className="text-neutral-500 hover:text-white py-2 px-4 rounded-full flex-1 text-center transition-colors">Notify</button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Registration Last Date</label>
                  <input type="text" defaultValue="25/05/2025" className="w-full px-4 py-3 bg-black border-2 border-neutral-800 rounded-xl text-sm font-mono font-bold outline-none focus:border-white transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Round 1 Date</label>
                  <input type="text" defaultValue="18/05/2025" className="w-full px-4 py-3 bg-black border-2 border-neutral-800 rounded-xl text-sm font-mono font-bold outline-none focus:border-white transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Final Demo Date</label>
                  <input type="text" defaultValue="08/06/2025" className="w-full px-4 py-3 bg-black border-2 border-neutral-800 rounded-xl text-sm font-mono font-bold outline-none focus:border-white transition-colors" />
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-100 space-y-3">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Post Announcement</label>
                <textarea 
                  rows={3}
                  placeholder="Write an announcement..."
                  className="w-full px-4 py-3 bg-black border-2 border-neutral-800 rounded-xl text-sm font-medium outline-none focus:border-white transition-colors resize-none"
                ></textarea>
                <button className="w-full py-4 bg-neutral-900 text-yellow-400 rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-[0.98] transition-transform">
                  Post Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
