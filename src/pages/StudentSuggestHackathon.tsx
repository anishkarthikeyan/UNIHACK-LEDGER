import React, { useState } from 'react';
import { Send, Globe, Calendar, FileText, CheckCircle2, Tags, DollarSign, Users, Monitor, GraduationCap, Code } from 'lucide-react';

interface StudentSuggestHackathonProps {
  onNavigate?: (route: string) => void;
}

export default function StudentSuggestHackathon({ onNavigate }: StudentSuggestHackathonProps) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center space-y-6 bg-black border-4 border-neutral-800 p-12 rounded-[32px] max-w-lg">
          <div className="w-20 h-20 bg-yellow-400 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(250,204,21,0.3)]">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-white">Suggestion Received</h2>
          <p className="text-neutral-400 text-sm">Your hackathon suggestion has been sent to the faculty. Once approved, it will be added to the ledger for everyone to explore.</p>
          <button 
            onClick={() => onNavigate?.('explore')}
            className="w-full py-4 bg-neutral-900 text-white-TMP rounded-full font-black uppercase tracking-widest text-xs hover:bg-neutral-700 transition-colors"
          >
            Explore Ledgers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white mb-2">
            Suggest a <span className="text-neutral-500">Hackathon</span>
          </h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest max-w-xl">
            Found an exciting hackathon that isn't on our radar? Suggest it here and it will be sent to faculty for approval.
          </p>
        </div>
      </div>

      <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-8 w-full flex-1">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Hackathon Title</label>
                <input required type="text" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="e.g. NASA Space Apps Challenge" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Organizing Body</label>
                <input required type="text" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="e.g. NASA" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Official Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input required type="url" className="w-full pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="https://" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Registration Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input required type="date" className="w-full pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Event Dates</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input required type="text" className="w-full pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="e.g. Oct 2 - Oct 4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Domain</label>
                  <div className="relative">
                    <Code className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <select className="w-full pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors appearance-none">
                      <option value="">Select Domain...</option>
                      <option value="AI">AI / Machine Learning</option>
                      <option value="Crypto">Crypto / Web3</option>
                      <option value="Quantum">Quantum Computing</option>
                      <option value="Student">Student / General</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Mode</label>
                  <div className="relative">
                    <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <select className="w-full pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors appearance-none">
                      <option value="">Select Mode...</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Eligible Years</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <select className="w-full pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors appearance-none">
                      <option value="">Select Eligibility...</option>
                      <option value="All">All Years</option>
                      <option value="1-2">1st & 2nd Year</option>
                      <option value="3+">3rd Year+</option>
                      <option value="4+">4th Year+</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Tags / Tech Stack</label>
                  <div className="relative">
                    <Tags className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input type="text" className="w-full pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="e.g. React, Node.js" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Prize Pool</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input type="text" className="w-full pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="e.g. $10,000" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Expected Participants</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input type="number" className="w-full pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="e.g. 500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Short Description</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-6 text-neutral-400" size={18} />
                  <textarea required rows={4} className="w-full pl-12 pr-4 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors resize-none" placeholder="Briefly describe what this hackathon is about..."></textarea>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-800 flex justify-end">
            <button type="submit" className="px-8 py-4 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg">
              <Send size={16} /> Send to Faculty for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
