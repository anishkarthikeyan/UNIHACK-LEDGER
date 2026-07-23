import React from 'react';
import { Save, Settings2, Shield, Calendar, Users, Briefcase } from 'lucide-react';

export default function AdminSystemSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">System Settings</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Platform-Wide Configuration & Policies</p>
        </div>
        <button className="px-8 py-4 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-95 transition-transform flex items-center gap-2 shadow-lg">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 p-8 overflow-y-auto shadow-xl">
        <div className="max-w-4xl space-y-12">
          
          {/* Academic Configuration */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2 border-b-2 border-neutral-800 pb-4">
              <Calendar size={24} className="text-neutral-400" /> Academic Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Current Academic Year</label>
                <select className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 font-bold appearance-none">
                  <option>2024-2025</option>
                  <option selected>2025-2026</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Default Semester</label>
                <select className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 font-bold appearance-none">
                  <option>Odd Semester</option>
                  <option selected>Even Semester</option>
                </select>
              </div>
            </div>
          </div>

          {/* Governance & Security */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2 border-b-2 border-neutral-800 pb-4">
              <Shield size={24} className="text-neutral-400" /> Governance & Security
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl cursor-pointer hover:border-yellow-400 transition-colors">
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-yellow-400" />
                <div>
                  <p className="font-bold text-white">Require confirmation for role escalation</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mt-1">Warn before making someone a Faculty or Admin</p>
                </div>
              </label>
              <label className="flex items-center gap-4 p-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl cursor-pointer hover:border-yellow-400 transition-colors">
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-yellow-400" />
                <div>
                  <p className="font-bold text-white">Enable auto-provisioning via SSO</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mt-1">Automatically create student accounts on first login</p>
                </div>
              </label>
            </div>
          </div>

          {/* Department Management */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2 border-b-2 border-neutral-800 pb-4">
              <Briefcase size={24} className="text-neutral-400" /> Department Master List
            </h2>
            <div className="space-y-3">
              {['Computer Science & Engineering (CSE)', 'Information Technology (IT)', 'Electronics & Communication (ECE)'].map((dept, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl">
                  <p className="font-bold text-white">{dept}</p>
                  <button className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white">Edit</button>
                </div>
              ))}
              <button className="w-full p-4 bg-transparent border-2 border-dashed border-neutral-700 rounded-2xl text-neutral-500 font-bold uppercase tracking-widest text-[10px] hover:border-white hover:text-white transition-colors">
                + Add New Department
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
