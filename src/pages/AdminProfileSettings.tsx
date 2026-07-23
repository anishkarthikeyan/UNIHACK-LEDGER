import React from 'react';
import { User, Shield, Bell, Save } from 'lucide-react';

export default function AdminProfileSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Admin Profile</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Manage Your Personal Account</p>
      </div>

      <div className="flex-1 bg-black border-4 border-neutral-800 rounded-[32px] p-8 max-w-4xl shadow-xl">
        <div className="space-y-8">
          <div className="flex items-center gap-6 pb-8 border-b border-neutral-800">
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white text-3xl font-black">
              AD
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Admin One</h2>
              <p className="text-sm font-bold uppercase tracking-widest text-neutral-500 mt-1">Super Administrator</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
              <User size={20} className="text-white" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Email Address</label>
                <input type="email" defaultValue="admin@university.edu" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Contact Number</label>
                <input type="tel" defaultValue="+1 999 888 777" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 font-bold" />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-800">
            <button className="px-8 py-4 bg-neutral-900 text-white-TMP rounded-full font-black uppercase tracking-widest text-xs hover:scale-95 transition-transform flex items-center gap-2 shadow-lg">
              <Save size={16} /> Save Profile Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
