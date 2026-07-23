import React from 'react';
import { Calendar, CheckCircle2, Clock, Eye, AlertCircle, FileText } from 'lucide-react';

interface StudentDashboardProps {
  onNavigate?: (route: string) => void;
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Student Dashboard</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Welcome back, Anish K.</p>
      </div>

      {/* Urgent Notification Banner */}
      <div className="bg-red-500 rounded-[32px] p-6 text-white border-4 border-red-600 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-black uppercase tracking-widest text-lg">Action Required</h2>
            <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-90">Registration for <span className="text-white">Code for Good 2025</span> ends today, but your team has not registered!</p>
          </div>
        </div>
        <button onClick={() => onNavigate?.('hackathon-register')} className="px-6 py-3 bg-black text-red-600 rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-95 transition-transform shrink-0 whitespace-nowrap shadow-lg">
          Register Now
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Interested', value: '12', icon: Eye, highlight: false },
          { label: 'Registered', value: '5', icon: CheckCircle2, highlight: true },
          { label: 'Ongoing', value: '3', icon: Clock, highlight: false },
          { label: 'Upcoming Deadlines', value: '4', icon: AlertCircle, highlight: false },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area: My Pipeline */}
        <div className="lg:col-span-2 bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="font-bold text-lg text-white uppercase tracking-widest">My Pipeline</h2>
            <button onClick={() => onNavigate?.('pipeline')} className="text-[10px] px-4 py-2 bg-neutral-900 text-white rounded-full font-bold uppercase tracking-widest border border-neutral-800 hover:border-yellow-400 transition-colors">
              View All
            </button>
          </div>
          
          <div className="flex items-center gap-4 border-b border-neutral-800 px-6 py-2 overflow-x-auto scrollbar-hide">
            {['Upcoming (4)', 'Needs Action (3)', 'Registered (5)', 'Ongoing (3)', 'Ended (2)'].map((tab, i) => (
              <button 
                key={tab}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap rounded-full ${
                  i === 1 ? 'bg-yellow-400 text-white' : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-b border-neutral-800">Hackathon</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Organizer</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Reg. Close Date</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Round / Stage</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Next Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-white">
                {[
                  { name: 'Code for Good 2025', org: 'CSE Dept.', date: '25 May 2025', stage: 'Round 1: Ideation', status: 'Registered', action: 'View Details' },
                  { name: 'AI Innovate 5.0', org: 'AI Club', date: '02 Jun 2025', stage: 'Round 1: Ideation', status: 'Interested', action: 'View Details' },
                  { name: 'Web3 Buildathon', org: 'Tech Society', date: '10 Jun 2025', stage: 'Upcoming', status: 'Not Registered', action: 'Explore' },
                  { name: 'HealthHack 2025', org: 'Health Club', date: '28 May 2025', stage: 'Round 2: Prototype', status: 'Registered', action: 'Go to Event' },
                ].map((h, i) => (
                  <tr key={i} className="hover:bg-neutral-700 transition-colors">
                    <td className="px-6 py-4 font-bold">{h.name}</td>
                    <td className="px-6 py-4 text-neutral-400 font-bold text-xs uppercase tracking-wider">{h.org}</td>
                    <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{h.date}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {h.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button onClick={() => onNavigate?.('hackathon-detail')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${h.action === 'Explore' ? 'bg-neutral-900 text-white hover:bg-neutral-700' : 'bg-neutral-900 border border-neutral-700 text-white hover:border-yellow-400'}`}>
                          {h.action}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-yellow-400 rounded-[32px] p-6 text-white flex flex-col shadow-lg border-4 border-yellow-500 overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-400 rotate-45"></div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest">Reminders & Alerts</div>
            </div>
            <div className="space-y-4 flex-1">
              {[
                { title: 'Registration closing soon', desc: 'Code for Good 2025', tag: '2 days left' },
                { title: 'Round 1 submission due', desc: 'AI Innovate 5.0', tag: '5 days left' },
                { title: 'Verification pending', desc: 'Submit your college email', tag: 'Action needed' },
              ].map((alert, i) => (
                <div key={i} className="flex flex-col gap-2 border-b border-white/10 pb-4 last:border-0">
                  <div>
                    <p className="text-sm font-bold leading-snug">{alert.title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-1">{alert.desc}</p>
                  </div>
                  <div className="self-start px-2 py-1 bg-neutral-900 text-yellow-400 text-[10px] font-bold uppercase tracking-widest rounded">
                    {alert.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
           <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl p-6 text-white">
            <h3 className="font-black text-lg text-white uppercase tracking-widest mb-4">Quick Actions</h3>
             <div className="space-y-3">
                <button onClick={() => onNavigate?.('explore')} className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 border-2 border-transparent transition-all flex items-center justify-center gap-3"><Eye size={16} className="text-neutral-500"/> Explore Hackathons</button>
                <button onClick={() => onNavigate?.('calendar')} className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 border-2 border-transparent transition-all flex items-center justify-center gap-3"><Calendar size={16} className="text-neutral-500"/> Calendar</button>
                <button onClick={() => onNavigate?.('profile')} className="w-full py-4 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-yellow-400 border-2 border-transparent transition-all flex items-center justify-center gap-3"><FileText size={16} className="text-neutral-500"/> Update Profile</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
