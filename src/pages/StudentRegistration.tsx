import React, { useState } from 'react';
import { ChevronLeft, Users, User, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StudentRegistrationProps {
  onNavigate?: (route: string) => void;
}

export default function StudentRegistration({ onNavigate }: StudentRegistrationProps) {
  const [mode, setMode] = useState<'team' | 'solo'>('team');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-8">
        <button 
          onClick={() => onNavigate?.('hackathon-detail')}
          className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft size={14} /> Back to Details
        </button>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Registration</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Code for Good 2025</p>
      </div>

      {/* Mode Selection */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-white">Participation Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`cursor-pointer flex items-start gap-4 p-6 rounded-[32px] border-4 transition-all ${
            mode === 'team' ? 'border-yellow-400 bg-yellow-400/5' : 'border-neutral-800 bg-black hover:border-neutral-700'
          }`}>
            <input 
              type="radio" 
              name="mode" 
              value="team"
              checked={mode === 'team'}
              onChange={() => setMode('team')}
              className="mt-1 accent-yellow-400"
            />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className={mode === 'team' ? 'text-yellow-400' : 'text-neutral-500'} />
                <h3 className={`font-black uppercase tracking-widest text-sm ${mode === 'team' ? 'text-yellow-400' : 'text-white'}`}>Team</h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">Participate with an existing team or create a new one. (2-4 members)</p>
            </div>
          </label>

          <label className={`cursor-pointer flex items-start gap-4 p-6 rounded-[32px] border-4 transition-all ${
            mode === 'solo' ? 'border-yellow-400 bg-yellow-400/5' : 'border-neutral-800 bg-black hover:border-neutral-700'
          }`}>
            <input 
              type="radio" 
              name="mode" 
              value="solo"
              checked={mode === 'solo'}
              onChange={() => setMode('solo')}
              className="mt-1 accent-yellow-400"
            />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User size={18} className={mode === 'solo' ? 'text-yellow-400' : 'text-neutral-500'} />
                <h3 className={`font-black uppercase tracking-widest text-sm ${mode === 'solo' ? 'text-yellow-400' : 'text-white'}`}>Solo</h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">Participate individually. Not recommended for full-stack projects.</p>
            </div>
          </label>
        </div>
      </div>

      {mode === 'team' && (
        <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Select Your Team</h2>
          
          <div className="space-y-4">
            <select 
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-6 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none"
            >
              <option value="">Choose a team...</option>
              <option value="quantum">Quantum Coders (4/4 members)</option>
              <option value="byteme">ByteMe (3/4 members)</option>
            </select>
          </div>

          {selectedTeam === 'quantum' && (
            <div className="pt-6 border-t border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Team Roster</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Requirements Met
                </span>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'Anish K.', role: 'Leader', branch: 'CSE 3rd Yr' },
                  { name: 'Priya R.', role: 'Member', branch: 'IT 3rd Yr' },
                  { name: 'Rahul S.', role: 'Member', branch: 'ECE 2nd Yr' },
                  { name: 'Neha M.', role: 'Member', branch: 'CSE 2nd Yr' },
                ].map((member, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-neutral-500 font-black text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-2">
                          {member.name}
                          {member.role === 'Leader' && <Shield size={12} className="text-yellow-400" />}
                        </p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">{member.branch}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 text-center">
            <button onClick={() => onNavigate?.('team-form')} className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
              + Create a New Team Instead
            </button>
          </div>
        </div>
      )}

      {/* Registration Details */}
      <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 space-y-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-white">Registration Details</h2>
        
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">College ID / Verification Document (PDF only)</label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-700 rounded-xl cursor-pointer hover:bg-neutral-700/50 hover:border-yellow-400 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-neutral-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <p className="text-sm font-bold">Click to upload PDF</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Max 5MB</p>
            </div>
            <input type="file" className="hidden" accept=".pdf" />
          </label>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Proof of External Registration (Link)</label>
          <p className="text-xs text-neutral-400 mb-2 leading-relaxed">Provide the link to your team's registration on the official hackathon platform (e.g., Unstop, Devpost, or Google Drive link of email screenshot) so faculty can verify authenticity.</p>
          <input type="url" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="https://" />
        </div>
      </div>

      {/* Confirmation & Validation */}
      <div className="bg-yellow-400 rounded-[32px] p-8 text-white border-4 border-yellow-500 shadow-lg">
        <h2 className="text-sm font-black uppercase tracking-widest mb-6">Registration Checklist</h2>
        
        <div className="space-y-4 mb-8">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-black" />
            <span className="text-sm font-medium">I agree to the hackathon's code of conduct and rules.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-black" />
            <span className="text-sm font-medium">I confirm that all team members meet the eligibility criteria.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-black" />
            <span className="text-sm font-medium">I understand that submissions past the deadline will not be evaluated.</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/70">
            <AlertCircle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Double check before submitting</span>
          </div>
          <button 
            onClick={() => onNavigate?.('pipeline')}
            className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-transform shadow-lg ${
            (mode === 'team' && !selectedTeam) ? 'bg-black/20 text-white/40 cursor-not-allowed' : 'bg-neutral-900 text-white hover:scale-95'
          }`}>
            Confirm Registration
          </button>
        </div>
      </div>
    </div>
  );
}
