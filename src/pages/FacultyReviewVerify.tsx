import React, { useState } from 'react';
import { Check, X, Clock, ExternalLink, MessageSquare, AlertCircle } from 'lucide-react';

export default function FacultyReviewVerify() {
  const [activeTab, setActiveTab] = useState('Suggestions');
  
  const suggestions = [
    { id: 1, title: 'NASA Space Apps Challenge', org: 'NASA', suggestedBy: 'Anish K. (3rd Year, CSE)', date: 'Oct 2 - Oct 4', domain: 'Other', tags: 'Space, Data', status: 'Pending' },
    { id: 2, title: 'ETHGlobal Waterloo', org: 'ETHGlobal', suggestedBy: 'Rahul M. (2nd Year, IT)', date: 'Jun 22 - Jun 24', domain: 'Crypto', tags: 'Web3, Solidity', status: 'Pending' },
    { id: 3, title: 'Tether Developers Cup', org: 'Tether', suggestedBy: 'Sara T. (4th Year, CSE)', date: 'Ongoing', domain: 'Crypto', tags: 'Local AI', status: 'Approved' }
  ];

  const approvals = [
    { id: 1, type: 'Project Upload', title: 'Smart Farming AI', student: 'Anish K.', status: 'Pending' },
    { id: 2, type: 'Team Change', title: 'Quantum Coders', student: 'Priya R.', status: 'Pending' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Review & Verify</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Manage Student Suggestions and Requests</p>
      </div>

      <div className="flex gap-4 border-b border-neutral-800 pb-2">
        {['Suggestions', 'Other Requests'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors ${activeTab === tab ? 'bg-neutral-900 text-white-TMP' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 p-8">
        {activeTab === 'Suggestions' && (
          <div className="space-y-6">
            <h2 className="font-black text-white uppercase tracking-widest mb-4">Suggested Hackathons</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {suggestions.map(s => (
                <div key={s.id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-white leading-tight">{s.title}</h3>
                      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-1">{s.org}</p>
                    </div>
                    {s.status === 'Pending' ? (
                      <span className="px-3 py-1 bg-yellow-400/20 text-yellow-600 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock size={12} /> Pending
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <Check size={12} /> Approved
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Suggested By</p>
                      <p className="text-sm font-bold text-white">{s.suggestedBy}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Dates</p>
                      <p className="text-sm font-bold text-white">{s.date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Domain</p>
                      <p className="text-sm font-bold text-white">{s.domain}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Tags</p>
                      <p className="text-sm font-bold text-white">{s.tags}</p>
                    </div>
                  </div>

                  {s.status === 'Pending' && (
                    <div className="flex gap-3 pt-4 border-t border-neutral-100">
                      <button className="flex-1 py-3 bg-yellow-400 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform flex items-center justify-center gap-2">
                        <Check size={14} /> Approve & Add
                      </button>
                      <button className="flex-1 py-3 bg-neutral-800 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2">
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Other Requests' && (
          <div className="space-y-6">
            <h2 className="font-black text-white uppercase tracking-widest mb-4">Pending Verifications</h2>
            <div className="space-y-4">
              {approvals.map(req => (
                <div key={req.id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center shrink-0">
                      <AlertCircle size={24} className="text-neutral-500" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">{req.type}</span>
                      <h3 className="text-lg font-black text-white">{req.title}</h3>
                      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{req.student}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-6 py-3 bg-neutral-900 text-white-TMP rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
