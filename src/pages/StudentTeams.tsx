import React, { useState } from 'react';
import { Users, Mail, Clock, CheckCircle2, User, Plus, MoreHorizontal, Shield, UsersRound, ChevronRight, Check, X } from 'lucide-react';

interface StudentTeamsProps {
  onNavigate?: (route: string) => void;
}

export default function StudentTeams({ onNavigate }: StudentTeamsProps) {
  const [showInvites, setShowInvites] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">My Teams</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Manage your collaborations and invitations</p>
        </div>
        <button onClick={() => onNavigate?.('team-form')} className="px-6 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg">
          <Plus size={16} /> Create New Team
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'My Teams', value: '3', icon: Users, highlight: true },
          { label: 'Open Invites', value: '2', icon: Mail, highlight: false },
          { label: 'Pending Requests', value: '1', icon: Clock, highlight: false },
          { label: 'Registered', value: '2', icon: CheckCircle2, highlight: false },
          { label: 'Solo Entries', value: '1', icon: User, highlight: false },
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

      {/* Invites & Requests Banner (if any) */}
      <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6 flex flex-col gap-6 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-yellow-400 border border-neutral-800">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">You have 2 new team invitations</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">Review them to join ongoing hackathon registrations</p>
            </div>
          </div>
          <button 
            onClick={() => setShowInvites(!showInvites)}
            className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${showInvites ? 'bg-yellow-400 text-white' : 'bg-neutral-900 text-white-TMP hover:bg-neutral-700'}`}
          >
            {showInvites ? 'Hide Invitations' : 'View Invitations'}
          </button>
        </div>

        {showInvites && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800 animate-in slide-in-from-top-2">
            {[
              { team: 'ByteMe', hackathon: 'AI Innovate 5.0', role: 'Frontend Dev' },
              { team: 'Design Divas', hackathon: 'Designathon', role: 'UX Researcher' }
            ].map((invite, i) => (
              <div key={i} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-white">{invite.team}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">{invite.hackathon} • {invite.role}</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full bg-black border border-neutral-700 flex items-center justify-center text-red-400 hover:bg-red-400 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-400 hover:text-white transition-colors">
                    <Check size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="font-bold text-lg text-white uppercase tracking-widest">Team Directory</h2>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search teams..." 
                  className="hidden md:block px-6 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full focus:border-yellow-400 text-xs outline-none text-white placeholder-neutral-500 font-bold transition-all w-64"
                />
            </div>
          </div>
          
          <div className="flex items-center gap-4 border-b border-neutral-800 px-6 py-2 overflow-x-auto scrollbar-hide">
            {['All Teams (3)', 'Active (2)', 'Past (1)'].map((tab, i) => (
              <button 
                key={tab}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap rounded-full ${
                  i === 0 ? 'bg-neutral-900 text-white-TMP' : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-b border-neutral-800">Team Details</th>
                  <th className="px-6 py-4 border-b border-neutral-800">My Role</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Members</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Active Hackathons</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Status</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-white">
                {[
                  { name: 'Quantum Coders', desc: 'Full-stack AI Solutions', role: 'Leader', members: '4/4', hackathons: 'Code for Good 2025', status: 'Registered' },
                  { name: 'ByteMe', desc: 'Web3 & Blockchain', role: 'Member', members: '3/4', hackathons: 'AI Innovate 5.0', status: 'Drafting' },
                  { name: 'Design Divas', desc: 'UI/UX & Frontend', role: 'Member', members: '2/3', hackathons: 'None', status: 'Idle' },
                ].map((t, i) => (
                  <tr key={i} className="hover:bg-neutral-700 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-black text-sm group-hover:text-yellow-400 transition-colors">{t.name}</p>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">{t.desc}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {t.role === 'Leader' ? <Shield size={14} className="text-yellow-400" /> : <User size={14} className="text-neutral-500" />}
                        <span className={`text-xs font-bold uppercase tracking-widest ${t.role === 'Leader' ? 'text-yellow-400' : 'text-neutral-300'}`}>{t.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <UsersRound size={16} className="text-neutral-500" />
                        <span className="font-mono text-sm">{t.members}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-neutral-300">
                      {t.hackathons !== 'None' ? (
                        <span className="px-3 py-1 bg-neutral-900 border border-neutral-700 rounded-full text-[10px] uppercase tracking-widest inline-block">{t.hackathons}</span>
                      ) : (
                        <span className="text-neutral-500 text-[10px] uppercase tracking-widest">None Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        t.status === 'Registered' ? 'bg-yellow-400 text-white' : 
                        t.status === 'Drafting' ? 'bg-neutral-800 text-white border border-neutral-700' :
                        'bg-neutral-900 text-neutral-500 border border-neutral-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="w-10 h-10 rounded-full border-2 border-neutral-700 flex items-center justify-center text-white hover:border-yellow-400 hover:text-yellow-400 transition-colors ml-auto">
                          <MoreHorizontal size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
