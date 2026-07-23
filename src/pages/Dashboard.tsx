import React from 'react';
import { Calendar, Users, FileCheck, Clock, Eye, MoreHorizontal, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Hackathon } from '../types';

const MOCK_HACKATHONS: Hackathon[] = [
  { id: '1', name: 'Code for Good 2025', status: 'Active', regCloseDate: '25 May 2025', currentRound: 'Round 1: Ideation', interested: 320, registered: 180, lastUpdated: '20 May 2025' },
  { id: '2', name: 'AI Innovate 5.0', status: 'Upcoming', regCloseDate: '02 Jun 2025', currentRound: 'Round 1: Ideation', interested: 210, registered: 120, lastUpdated: '19 May 2025' },
  { id: '3', name: 'Web3 Buildathon', status: 'Upcoming', regCloseDate: '10 Jun 2025', currentRound: 'Upcoming', interested: 150, registered: 45, lastUpdated: '18 May 2025' },
  { id: '4', name: 'HealthHack 2025', status: 'Active', regCloseDate: '28 May 2025', currentRound: 'Round 2: Prototype', interested: 190, registered: 110, lastUpdated: '20 May 2025' },
  { id: '5', name: 'DataVerse Challenge', status: 'Upcoming', regCloseDate: '05 Jun 2025', currentRound: 'Upcoming', interested: 240, registered: 90, lastUpdated: '17 May 2025' },
];


const CHART_DATA = [
  { name: 'Jan', CSE: 120, IT: 80, ECE: 40 },
  { name: 'Feb', CSE: 150, IT: 100, ECE: 60 },
  { name: 'Mar', CSE: 180, IT: 120, ECE: 90 },
  { name: 'Apr', CSE: 250, IT: 160, ECE: 110 },
  { name: 'May', CSE: 320, IT: 210, ECE: 150 },
  { name: 'Jun', CSE: 400, IT: 280, ECE: 190 },
];


const WINNING_DATA = [
  { department: 'CSE', first: 12, second: 18, third: 10 },
  { department: 'IT', first: 8, second: 12, third: 15 },
  { department: 'ECE', first: 5, second: 8, third: 12 },
  { department: 'MECH', first: 2, second: 4, third: 5 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Faculty Hackathon Dashboard</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Welcome back, Dr. Meena R.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Hackathons', value: '12', icon: Calendar, highlight: true },
          { label: 'Students Interested', value: '1,248', icon: Users },
          { label: 'Students Registered', value: '678', icon: FileCheck },
          { label: 'Pending Verifications', value: '24', icon: FileCheck },
          { label: 'Deadlines This Week', value: '6', icon: Clock },
        ].map((stat, i) => (
          <div key={i} className={`${stat.highlight ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-black text-white border-neutral-800'} p-5 rounded-3xl border-2 shadow-lg flex items-center gap-4`}>
            <div className={`p-3 rounded-2xl ${stat.highlight ? 'bg-neutral-900 text-yellow-400' : 'bg-neutral-800 text-white'}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-black leading-none">{stat.value}</p>
              <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${stat.highlight ? 'text-white/70' : 'text-neutral-500'}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participation Growth Chart */}
        <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl p-6">
          <h2 className="font-bold text-lg text-yellow-400 uppercase tracking-widest mb-6">Participation Growth</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCSE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorECE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }} tickMargin={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontWeight: 'bold', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#888' }} />
                <Area type="monotone" dataKey="CSE" stroke="#facc15" strokeWidth={3} fillOpacity={1} fill="url(#colorCSE)" />
                <Area type="monotone" dataKey="IT" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorIT)" />
                <Area type="monotone" dataKey="ECE" stroke="#a78bfa" strokeWidth={3} fillOpacity={1} fill="url(#colorECE)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Winning Analytics Chart */}
        <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl p-6">
          <h2 className="font-bold text-lg text-yellow-400 uppercase tracking-widest mb-6">Winning Analytics</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WINNING_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="department" stroke="#666" tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }} tickMargin={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontWeight: 'bold', color: '#fff' }}
                  cursor={{ fill: '#222' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#888' }} />
                <Bar dataKey="first" name="1st Place" fill="#facc15" radius={[4, 4, 0, 0]} />
                <Bar dataKey="second" name="2nd Place" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="third" name="3rd Place" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Table Area */}
        <div className="lg:col-span-2 bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="font-bold text-lg text-yellow-400 uppercase tracking-widest">Current Hackathons</h2>
            <button className="text-[10px] px-4 py-2 bg-neutral-900 text-white rounded-full font-bold uppercase tracking-widest border border-neutral-800 hover:border-yellow-400 transition-colors">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-b border-neutral-800">Event Name</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Reg. Close Date</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Current Round</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Interested</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Registered</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Last Updated</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-white">
                {MOCK_HACKATHONS.map((h) => (
                  <tr key={h.id} className="hover:bg-neutral-700 transition-colors">
                    <td className="px-6 py-4 font-bold">{h.name}</td>
                    <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{h.regCloseDate}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-yellow-400 text-white">
                        {h.currentRound}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-neutral-400">{h.interested}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-yellow-400">{h.registered}</td>
                    <td className="px-6 py-4 text-neutral-500 font-mono text-xs">{h.lastUpdated}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3 text-neutral-500">
                        <button className="hover:text-yellow-400 transition-colors"><Eye size={18} /></button>
                        <button className="hover:text-yellow-400 transition-colors"><MoreHorizontal size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between bg-black/30 text-[10px] uppercase font-bold tracking-widest text-neutral-500">
            <span>Showing 1 to 5 of 12</span>
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-700 hover:border-yellow-400 hover:text-white transition-colors">&lt;</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-400 text-white font-black">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-700 hover:border-yellow-400 hover:text-white transition-colors">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-700 hover:border-yellow-400 hover:text-white transition-colors">3</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-700 hover:border-yellow-400 hover:text-white transition-colors">&gt;</button>
            </div>
          </div>
        </div>

        {/* Urgent Updates Sidebar */}
        <div className="bg-yellow-400 rounded-[32px] p-6 text-white flex flex-col shadow-lg border-4 border-yellow-500 overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-yellow-400 rotate-45"></div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest">Urgent Updates</div>
          </div>
          <div className="space-y-6 flex-1">
            {[
              { icon: Clock, title: '5 hackathons closing registration this week.', action: 'View Details' },
              { icon: FileCheck, title: '24 verification proofs are pending review.', action: 'Review Now' },
              { icon: Calendar, title: '3 events have outdated round dates.', action: 'Update Now' },
              { icon: Bell, title: '2 events need announcement.', action: 'Send Now' },
            ].map((update, i) => (
              <div key={i} className="flex gap-4 items-start border-b border-white/10 pb-4 last:border-0">
                <div className="mt-1 bg-neutral-900 text-yellow-400 p-2 rounded-xl">
                  <update.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-snug">{update.title}</p>
                  <button className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white mt-2 underline decoration-black/30 underline-offset-4">
                    {update.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
