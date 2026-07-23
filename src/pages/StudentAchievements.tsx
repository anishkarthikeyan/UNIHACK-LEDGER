import React, { useState } from 'react';
import { Award, Trophy, Star, Target, CheckCircle2, Medal, ChevronRight, Upload, X, FileText } from 'lucide-react';

export default function StudentAchievements() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('Participant');
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Achievements</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Your hackathon portfolio and verified records</p>
      </div>

      {/* Profile Summary & KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="col-span-2 md:col-span-4 lg:col-span-2 bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg flex items-center gap-6">
          <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center font-black text-xl text-yellow-400">
            AK
          </div>
          <div>
            <h2 className="font-black uppercase tracking-widest text-lg">Anish K.</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Computer Science • 3rd Year</p>
          </div>
        </div>

        {[
          { label: 'Total Participations', value: '8', icon: Target },
          { label: 'Wins & Runner-ups', value: '2', icon: Trophy },
          { label: 'Finalist Entries', value: '4', icon: Star },
          { label: 'Verified Certificates', value: '6', icon: CheckCircle2 },
        ].map((stat, i) => (
          <div key={i} className="bg-black p-5 rounded-3xl border-2 border-neutral-800 shadow-lg flex flex-col justify-between h-auto min-h-[120px]">
            <div className="flex justify-between items-start mb-2">
               <div className="p-2 rounded-xl bg-neutral-900 text-yellow-400 border border-neutral-800">
                <stat.icon size={16} />
              </div>
            </div>
            <p className="text-3xl font-black text-white font-mono">{stat.value}</p>
            <p className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Timeline View */}
        <div className="xl:col-span-1 bg-black border-4 border-neutral-800 rounded-[32px] p-8">
          <h2 className="text-lg font-black uppercase tracking-widest text-white mb-8 flex items-center gap-2">
            <Medal size={18} className="text-yellow-400" /> Career Timeline
          </h2>
          
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-neutral-800">
            {[
              { year: '2025', title: 'Code for Good 2025', status: 'Upcoming', type: 'Team' },
              { year: '2024', title: 'HealthHack 2024', status: 'Winner (1st)', type: 'Team', highlight: true },
              { year: '2024', title: 'AI Innovate 4.0', status: 'Finalist', type: 'Solo' },
              { year: '2023', title: 'Designathon 2023', status: 'Participant', type: 'Team' }
            ].map((item, i) => (
              <div key={i} className="relative flex items-center justify-between group">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-neutral-100 z-10 shrink-0 ${item.highlight ? 'bg-yellow-400 text-white' : 'bg-neutral-900 text-neutral-500'}`}>
                  {item.highlight ? <Trophy size={14} /> : <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full"></div>}
                </div>
                <div className="w-[calc(100%-3.5rem)] p-4 rounded-2xl border-2 border-neutral-800 bg-neutral-900 group-hover:border-neutral-600 transition-colors ml-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{item.year}</p>
                  <h3 className={`font-bold text-sm mb-1 ${item.highlight ? 'text-yellow-400' : 'text-white'}`}>{item.title}</h3>
                  <div className="flex gap-2">
                    <span className="text-[10px] text-neutral-400 font-medium">{item.status}</span>
                    <span className="text-[10px] text-neutral-400">• {item.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificates & Outcomes Table */}
        <div className="xl:col-span-2 bg-black border-4 border-neutral-800 rounded-[32px] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="font-bold text-lg text-white uppercase tracking-widest">Verified Records</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowUploadModal(true)}
                className="text-[10px] px-6 py-3 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center gap-2"
              >
                <Upload size={14} /> Submit Record
              </button>
              <button className="text-[10px] px-6 py-3 bg-neutral-900 text-white rounded-full font-bold uppercase tracking-widest border border-neutral-800 hover:border-white transition-colors">
                Download Portfolio
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-b border-neutral-800">Event Name</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Date</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Outcome</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Verification</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-white">
                {[
                  { name: 'HealthHack 2024', date: 'Dec 2024', outcome: 'Winner (1st Prize)', verified: true },
                  { name: 'AI Innovate 4.0', date: 'Oct 2024', outcome: 'Top 10 Finalist', verified: true },
                  { name: 'Web3 Buildathon', date: 'Aug 2024', outcome: 'Participant', verified: true },
                  { name: 'Designathon 2023', date: 'Nov 2023', outcome: 'Participant', verified: true },
                ].map((record, i) => (
                  <tr key={i} className="hover:bg-neutral-700 transition-colors group">
                    <td className="px-6 py-4 font-bold">{record.name}</td>
                    <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{record.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        record.outcome.includes('Winner') ? 'bg-yellow-400 text-white' : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      }`}>
                        {record.outcome}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {record.verified ? (
                        <div className="flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                          <CheckCircle2 size={14} /> Verified
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => { setSelectedCert(record.name); setShowCertModal(true); }} className="px-4 py-2 rounded-full border-2 border-neutral-700 text-white text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 hover:text-yellow-400 transition-colors ml-auto flex items-center gap-2">
                          View <ChevronRight size={14} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Submit Record</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Hackathon Name</label>
                <input type="text" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder="e.g. Code for Good 2025" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Outcome</label>
                <select 
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors appearance-none mb-4"
                >
                  <option value="Participant">Participant</option>
                  <option value="Finalist">Finalist</option>
                  <option value="Winner (1st)">Winner (1st)</option>
                  <option value="Runner-up">Runner-up</option>
                  <option value="Other">Other</option>
                </select>
                {outcome === 'Other' && (
                  <input type="text" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors animate-in fade-in slide-in-from-top-2" placeholder="Please specify your outcome..." />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Proof Document (PDF only)</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-700 rounded-xl cursor-pointer hover:bg-neutral-700/50 hover:border-yellow-400 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-neutral-400">
                    <Upload size={24} className="mb-2" />
                    <p className="text-sm font-bold">Click to upload PDF</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Max 5MB</p>
                  </div>
                  <input type="file" className="hidden" accept=".pdf" />
                </label>
              </div>

              <button onClick={() => setShowUploadModal(false)} className="w-full py-4 mt-4 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-[0.98] transition-transform">
                Submit for Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowCertModal(false)}>
          <div className="bg-black border-4 border-neutral-800 rounded-3xl overflow-hidden max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/50">
              <h3 className="font-bold text-sm text-white flex items-center gap-2"><FileText size={16} /> {selectedCert} - Certificate.pdf</h3>
              <button onClick={() => setShowCertModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="h-[60vh] bg-neutral-800 flex items-center justify-center flex-col gap-4">
              <FileText size={64} className="text-neutral-700" />
              <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">PDF Viewer Placeholder</p>
              <button className="px-6 py-3 bg-neutral-700 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-600 transition-colors">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
