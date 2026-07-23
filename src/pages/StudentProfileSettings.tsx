import React from 'react';
import { UserCircle, Settings, Mail, Bell, Shield, BookOpen, LogOut } from 'lucide-react';

export default function StudentProfileSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Profile & Settings</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Manage your account, preferences, and notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col - Identity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-yellow-400 text-white rounded-full flex items-center justify-center font-black text-3xl mb-4 border-4 border-neutral-100 outline outline-4 outline-yellow-400/20">
              AK
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-1">Anish K.</h2>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-6">Student • CSE 3rd Year</p>
          </div>

          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6 space-y-4">
             <div className="flex items-center gap-3 text-neutral-400 mb-4">
                <Shield size={18} className="text-yellow-400" />
                <h3 className="font-black uppercase tracking-widest text-sm text-white">Account Status</h3>
             </div>
             
             <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Email Verification</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Verified</span>
               </div>
               <p className="text-xs text-white font-mono">anish.k@student.uni.edu</p>
             </div>
             
             <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">ID Card</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Pending Review</span>
               </div>
               <p className="text-xs text-neutral-400">Uploaded 2 days ago</p>
             </div>
          </div>
        </div>

        {/* Right Col - Settings Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Academic Info */}
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8">
            <h3 className="font-black uppercase tracking-widest text-lg text-white mb-6 flex items-center gap-2">
              <BookOpen size={20} className="text-yellow-400" /> Academic & Skills
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Department</label>
                <select defaultValue="Computer Science & Engineering" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none">
                  <option>Computer Science & Engineering</option>
                  <option>Information Technology</option>
                  <option>Electronics & Communication</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Year of Study</label>
                <select defaultValue="3rd Year" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none">
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Domain Interests (Comma separated)</label>
                <input 
                  type="text" 
                  defaultValue="Web Development, AI/ML, Blockchain"
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Preferred Tech Stack</label>
                <input 
                  type="text" 
                  defaultValue="React, Node.js, Python, Solidity"
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
               <button className="px-6 py-3 bg-neutral-900 text-white-TMP rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-neutral-700 transition-colors">
                 Save Profile
               </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8">
            <h3 className="font-black uppercase tracking-widest text-lg text-white mb-6 flex items-center gap-2">
              <Bell size={20} className="text-yellow-400" /> Notifications & Privacy
            </h3>
            
            <div className="space-y-6">
              {[
                { title: 'Email Notifications', desc: 'Receive updates about deadlines and faculty announcements via email.', defaultChecked: true },
                { title: 'Push Notifications', desc: 'Receive browser push notifications for urgent alerts.', defaultChecked: true },
                { title: 'Public Profile Visibility', desc: 'Allow other students to find you in team searches.', defaultChecked: true },
                { title: 'Showcase Participation', desc: 'Automatically list my completed projects in the public innovation gallery.', defaultChecked: false }
              ].map((setting, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-neutral-800 last:border-0">
                  <div>
                    <h4 className="text-sm font-bold text-white">{setting.title}</h4>
                    <p className="text-xs text-neutral-500 mt-1">{setting.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input type="checkbox" className="sr-only peer" defaultChecked={setting.defaultChecked} />
                    <div className="w-11 h-6 bg-neutral-900 border-2 border-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 peer-checked:after:bg-neutral-900 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400 peer-checked:border-yellow-400"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
