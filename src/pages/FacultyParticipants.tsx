import React, { useState } from 'react';
import { Search, Filter, Mail, Award, CheckCircle2 } from 'lucide-react';

export default function FacultyParticipants() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const participants = [
    { id: 1, name: 'Anish K.', year: '3rd Year', dept: 'CSE', projects: 4, hackathons: 5, rank: 12 },
    { id: 2, name: 'Rahul M.', year: '2nd Year', dept: 'IT', projects: 2, hackathons: 2, rank: 45 },
    { id: 3, name: 'Priya R.', year: '4th Year', dept: 'ECE', projects: 6, hackathons: 8, rank: 3 },
    { id: 4, name: 'Sara T.', year: '3rd Year', dept: 'CSE', projects: 3, hackathons: 4, rank: 28 },
    { id: 5, name: 'Vikas S.', year: '1st Year', dept: 'CSE', projects: 1, hackathons: 1, rank: 112 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Participants</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Manage and view student profiles</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full pl-10 pr-4 py-3 bg-black border-2 border-neutral-800 rounded-full text-sm font-bold focus:border-yellow-400 outline-none transition-colors text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-6 py-3 bg-neutral-900 text-white-TMP rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform shrink-0 flex items-center gap-2">
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-800/50 text-neutral-500 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-b border-neutral-800">Student Name</th>
                <th className="px-6 py-4 border-b border-neutral-800">Department</th>
                <th className="px-6 py-4 border-b border-neutral-800 text-center">Hackathons</th>
                <th className="px-6 py-4 border-b border-neutral-800 text-center">Projects</th>
                <th className="px-6 py-4 border-b border-neutral-800 text-center">Rank</th>
                <th className="px-6 py-4 border-b border-neutral-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-900 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-black text-white">{p.name}</p>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">{p.year}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-neutral-400">{p.dept}</td>
                  <td className="px-6 py-4 text-center font-black text-white">{p.hackathons}</td>
                  <td className="px-6 py-4 text-center font-black text-white">{p.projects}</td>
                  <td className="px-6 py-4 text-center font-black text-yellow-500">#{p.rank}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors">
                        <Mail size={16} />
                      </button>
                    </div>
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
