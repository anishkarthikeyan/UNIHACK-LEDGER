import React from 'react';
import { Download, BarChart2, PieChart, TrendingUp } from 'lucide-react';

export default function FacultyReports() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Reports</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Analytics and Exportable Data</p>
        </div>
        <button className="px-6 py-3 bg-neutral-900 text-white-TMP rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform flex items-center gap-2">
          <Download size={14} /> Export Global Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black border-4 border-neutral-800 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="text-yellow-400" size={24} />
            <h2 className="font-black uppercase tracking-widest text-white">Participation</h2>
          </div>
          <p className="text-4xl font-black font-mono text-white">1,248</p>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-2">Total Students</p>
        </div>
        <div className="bg-black border-4 border-neutral-800 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-yellow-400" size={24} />
            <h2 className="font-black uppercase tracking-widest text-white">Win Rate</h2>
          </div>
          <p className="text-4xl font-black font-mono text-white">18%</p>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-2">Across all hackathons</p>
        </div>
        <div className="bg-black border-4 border-neutral-800 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="text-yellow-400" size={24} />
            <h2 className="font-black uppercase tracking-widest text-white">Top Domain</h2>
          </div>
          <p className="text-4xl font-black font-mono text-white">AI</p>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-2">45% of registrations</p>
        </div>
      </div>

      <div className="flex-1 bg-black border-4 border-neutral-800 rounded-[32px] p-8 flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <BarChart2 size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold uppercase tracking-widest">Detailed Charts Rendering...</p>
        </div>
      </div>
    </div>
  );
}
