import React, { useState } from 'react';
import { ChevronLeft, Users, Save, CheckCircle2, Shield, UserPlus, X, Search } from 'lucide-react';

interface StudentTeamFormProps {
  onNavigate?: (route: string) => void;
}

export default function StudentTeamForm({ onNavigate }: StudentTeamFormProps) {
  const [visibility, setVisibility] = useState('public');
  const [joinMode, setJoinMode] = useState('invite');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-8">
        <div>
          <button 
            onClick={() => onNavigate?.('teams')}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-2 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Teams
          </button>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Create New Team</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Form a group for upcoming hackathons</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate?.('teams')}
            className="px-6 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg"
          >
            <CheckCircle2 size={16} /> Save Team
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-8 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <Users size={18} className="text-yellow-400" /> Team Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Team Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Quantum Coders"
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Description</label>
                <textarea 
                  rows={3}
                  placeholder="What is your team's focus and goal?"
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white transition-colors resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Preferred Domains</label>
                  <input 
                    type="text" 
                    placeholder="e.g. AI, Web3, FinTech"
                    className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Tech Stack</label>
                  <input 
                    type="text" 
                    placeholder="e.g. React, Node, Python"
                    className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Max Members</label>
                <select defaultValue="4" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none">
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                  <option>6</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invitation Management */}
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-8 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-yellow-400" /> Member Management
            </h2>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Invite Students</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="text" 
                    placeholder="Search by name or student ID..."
                    className="w-full pl-12 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                  />
                </div>
                <button className="px-6 py-3 bg-neutral-900 border-2 border-neutral-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors">
                  Send Invite
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Current Members & Invites</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-neutral-900 border-2 border-yellow-400/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-yellow-400 text-white flex items-center justify-center font-black text-xs">
                      AK
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        Anish K. (You)
                        <Shield size={12} className="text-yellow-400" />
                      </p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">Team Leader</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-black text-neutral-400 flex items-center justify-center font-black text-xs">
                      PR
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Priya R.</p>
                      <p className="text-[10px] text-yellow-400 uppercase tracking-widest mt-0.5">Invite Pending</p>
                    </div>
                  </div>
                  <button className="text-neutral-500 hover:text-red-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6">
            <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Visibility Settings</h3>
            <div className="space-y-3">
              {[
                { id: 'public', label: 'Public', desc: 'Anyone can find and request to join this team.' },
                { id: 'private', label: 'Private', desc: 'Hidden from search. Invite only.' }
              ].map(opt => (
                <label key={opt.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  visibility === opt.id ? 'border-yellow-400 bg-yellow-400/5' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                }`}>
                  <input 
                    type="radio" 
                    name="visibility" 
                    value={opt.id}
                    checked={visibility === opt.id}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="mt-1 accent-yellow-400"
                  />
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${visibility === opt.id ? 'text-yellow-400' : 'text-white'}`}>{opt.label}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6">
            <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Join Mode</h3>
            <div className="space-y-3">
              {[
                { id: 'invite', label: 'Invite Only', desc: 'Leader must send invitations.' },
                { id: 'request', label: 'Request to Join', desc: 'Users can request to join the team.' }
              ].map(opt => (
                <label key={opt.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  joinMode === opt.id ? 'border-yellow-400 bg-yellow-400/5' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                }`}>
                  <input 
                    type="radio" 
                    name="joinMode" 
                    value={opt.id}
                    checked={joinMode === opt.id}
                    onChange={(e) => setJoinMode(e.target.value)}
                    className="mt-1 accent-yellow-400"
                  />
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${joinMode === opt.id ? 'text-yellow-400' : 'text-white'}`}>{opt.label}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
