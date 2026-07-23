import React from 'react';
import { User, Shield, Bell, Save } from 'lucide-react';

export default function FacultySettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Settings</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Manage Profile and Preferences</p>
      </div>

      <div className="flex-1 bg-black border-4 border-neutral-800 rounded-[32px] p-8 max-w-4xl">
        <div className="space-y-8">
          <div className="flex items-center gap-6 pb-8 border-b border-neutral-800">
            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-white text-3xl font-black">
              MR
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Dr. Meena R.</h2>
              <p className="text-sm font-bold uppercase tracking-widest text-neutral-500 mt-1">Associate Professor, CSE</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
              <User size={20} className="text-yellow-400" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Email Address</label>
                <input type="email" defaultValue="meena.r@university.edu" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Contact Number</label>
                <input type="tel" defaultValue="+1 234 567 890" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 font-bold" />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-800">
            <button className="px-8 py-4 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-95 transition-transform flex items-center gap-2">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
