import React from 'react';
import { Users, FileCheck, Shield, AlertTriangle, TrendingUp, Award, Activity, UserPlus, FileText, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Admin Dashboard</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Platform Overview & Metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '1,420', icon: Users, highlight: false },
          { label: 'Students', value: '1,350', icon: FileCheck, highlight: false },
          { label: 'Faculty', value: '65', icon: Shield, highlight: false },
          { label: 'Admins', value: '5', icon: Shield, highlight: true },
          { label: 'Active Hackathons', value: '12', icon: Activity, highlight: false },
          { label: 'Total Participations', value: '4,520', icon: TrendingUp, highlight: false },
          { label: 'Total Wins', value: '185', icon: Award, highlight: false },
          { label: 'Flagged Actions', value: '3', icon: AlertTriangle, highlight: true },
        ].map((stat, i) => (
          <div key={i} className={`${stat.highlight ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-black text-white border-neutral-800'} p-5 rounded-3xl border-2 shadow-lg flex items-center gap-4`}>
            <div className={`p-3 rounded-2xl ${stat.highlight ? 'bg-neutral-900 text-yellow-400' : 'bg-neutral-800 text-white'}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-black leading-none font-mono">{stat.value}</p>
              <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${stat.highlight ? 'text-white/70' : 'text-neutral-500'}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
        
        {/* Department Performance */}
        <div className="xl:col-span-2 space-y-6 flex flex-col">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl overflow-hidden flex flex-col flex-1">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
              <h2 className="font-bold text-lg text-white uppercase tracking-widest">Department Performance</h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-black/5 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-center">Students</th>
                    <th className="px-6 py-4 text-center">Participations</th>
                    <th className="px-6 py-4 text-center">Wins</th>
                    <th className="px-6 py-4 text-center">Finalists</th>
                    <th className="px-6 py-4 text-center">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { dept: 'CSE', students: 520, parts: 2150, wins: 85, finalists: 140, rank: 1 },
                    { dept: 'IT', students: 380, parts: 1420, wins: 52, finalists: 90, rank: 2 },
                    { dept: 'ECE', students: 450, parts: 950, wins: 48, finalists: 75, rank: 3 },
                  ].map((d, i) => (
                    <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-900 transition-colors">
                      <td className="px-6 py-4 font-black text-white">{d.dept}</td>
                      <td className="px-6 py-4 text-center font-bold text-neutral-400">{d.students}</td>
                      <td className="px-6 py-4 text-center font-bold text-neutral-400">{d.parts}</td>
                      <td className="px-6 py-4 text-center font-black text-white">{d.wins}</td>
                      <td className="px-6 py-4 text-center font-bold text-neutral-400">{d.finalists}</td>
                      <td className="px-6 py-4 text-center font-black text-yellow-500">#{d.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Winner Highlights */}
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 shadow-xl">
             <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-white uppercase tracking-widest">Recent Winners</h2>
              <button className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white">View All</button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Quantum Coders', dept: 'CSE', hackathon: 'AI Innovate 5.0', position: '1st Place' },
                { name: 'Data Miners', dept: 'IT', hackathon: 'Web3 Buildathon', position: '2nd Place' },
              ].map((w, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-neutral-900 border-2 border-neutral-100 rounded-2xl">
                  <div>
                    <p className="font-black text-white text-sm">{w.name}</p>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{w.dept} • {w.hackathon}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-400/20 text-yellow-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {w.position}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Activity & Alerts */}
        <div className="space-y-6 flex flex-col">
          {/* Alerts Panel */}
          <div className="bg-red-500 rounded-[32px] border-4 border-red-600 p-6 text-white shadow-xl animate-pulse">
            <h2 className="font-black uppercase tracking-widest text-lg flex items-center gap-2 mb-4">
              <AlertTriangle size={20} /> Action Required
            </h2>
            <div className="space-y-3">
              <div className="bg-black/10 p-3 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-widest">Suspicious access attempt</p>
                <p className="text-[10px] font-bold mt-1 opacity-70">Multiple failed logins from 192.168.1.45</p>
              </div>
              <div className="bg-black/10 p-3 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-widest">Unusual role change</p>
                <p className="text-[10px] font-bold mt-1 opacity-70">Faculty role granted to student account ID #402</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6 shadow-xl">
            <h2 className="font-bold text-lg text-white uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-yellow-400 transition-colors group">
                <UserPlus size={20} className="text-neutral-400 group-hover:text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white text-center">Add Student</span>
              </button>
              <button className="p-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-yellow-400 transition-colors group">
                <Shield size={20} className="text-neutral-400 group-hover:text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white text-center">Add Faculty</span>
              </button>
              <button className="p-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-yellow-400 transition-colors group">
                <Activity size={20} className="text-neutral-400 group-hover:text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white text-center">Edit Hackathons</span>
              </button>
              <button className="p-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-yellow-400 transition-colors group">
                <FileText size={20} className="text-neutral-400 group-hover:text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white text-center">Audit Logs</span>
              </button>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6 shadow-xl flex-1 flex flex-col">
            <h2 className="font-bold text-lg text-white uppercase tracking-widest mb-4">Recent Activity</h2>
            <div className="space-y-4 flex-1 overflow-y-auto">
              {[
                { text: 'New student added: Rahul M.', time: '10 mins ago', icon: CheckCircle2 },
                { text: 'Department edited: CSE', time: '1 hour ago', icon: FileText },
                { text: 'Hackathon updated: Code for Good', time: '2 hours ago', icon: Activity },
                { text: 'Faculty role changed: Dr. Meena', time: '5 hours ago', icon: Shield },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center shrink-0">
                    <activity.icon size={14} className="text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{activity.text}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
