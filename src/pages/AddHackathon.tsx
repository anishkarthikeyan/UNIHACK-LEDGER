import React from 'react';

export default function AddHackathon() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500  bg-black p-8 rounded-[48px] border-4 border-neutral-800 shadow-2xl text-white">
      <div className="pb-6 border-b border-neutral-800">
        <h1 className="text-3xl font-black tracking-tighter uppercase text-yellow-400">Add New Hackathon</h1>
        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-2">Hackathons &gt; Add New</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Hackathon Title *</label>
          <input type="text" placeholder="Enter hackathon title" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-white placeholder-neutral-600" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Organizer / Department *</label>
          <select className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-white appearance-none">
            <option>Select organizer</option>
            <option>Computer Science Dept.</option>
          </select>
        </div>
        
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Short Description *</label>
          <textarea 
            rows={3} 
            placeholder="Describe the hackathon, theme, problem focus, and goals..." 
            className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm font-medium outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all resize-none text-white placeholder-neutral-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Year Eligibility *</label>
          <select className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-white appearance-none">
            <option>Select eligible years</option>
            <option>All Years (UG & PG)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Team Size Rules *</label>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-2xl px-4 py-2 focus-within:border-yellow-400 transition-all">
                <span className="text-[10px] font-bold uppercase text-neutral-500">Min</span>
                <input type="number" defaultValue={2} className="w-full bg-transparent text-sm font-bold outline-none text-white" />
             </div>
             <div className="flex items-center gap-3 flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-2xl px-4 py-2 focus-within:border-yellow-400 transition-all">
                <span className="text-[10px] font-bold uppercase text-neutral-500">Max</span>
                <input type="number" defaultValue={5} className="w-full bg-transparent text-sm font-bold outline-none text-white" />
             </div>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-900 p-6 rounded-3xl border-2 border-neutral-800 mt-2">
           <div className="space-y-2">
             <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Reg. Last Date *</label>
             <input type="text" placeholder="dd/mm/yyyy" className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-sm font-mono font-bold outline-none focus:border-yellow-400 text-white placeholder-neutral-700" />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Round 1 Date *</label>
             <input type="text" placeholder="dd/mm/yyyy" className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-sm font-mono font-bold outline-none focus:border-yellow-400 text-white placeholder-neutral-700" />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Round 2 Date</label>
             <input type="text" placeholder="dd/mm/yyyy" className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-sm font-mono font-bold outline-none focus:border-yellow-400 text-white placeholder-neutral-700" />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Final Demo Date *</label>
             <input type="text" placeholder="dd/mm/yyyy" className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-sm font-mono font-bold outline-none focus:border-yellow-400 text-white placeholder-neutral-700" />
           </div>
        </div>

        <div className="md:col-span-2 pt-8 flex justify-end gap-4">
          <button className="px-8 py-4 bg-transparent border-2 border-neutral-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-full hover:border-white transition-colors">
            Cancel
          </button>
          <button className="px-8 py-4 bg-neutral-800 border-2 border-neutral-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-full hover:bg-neutral-700 transition-colors">
            Save Draft
          </button>
          <button className="px-10 py-4 bg-yellow-400 text-white text-[10px] uppercase tracking-widest font-bold rounded-full hover:scale-95 transition-transform shadow-lg shadow-yellow-400/20">
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
