import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, Shield, User, FileText, Database } from 'lucide-react';

export default function AdminAuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const logs = [
    { id: 'L-101', time: '10:45 AM, Today', actor: 'Admin One', role: 'Admin', action: 'Changed Role', target: 'Dr. Suresh V.', module: 'Users', details: 'Faculty -> Admin (Attempt Denied)', severity: 'High' },
    { id: 'L-102', time: '09:30 AM, Today', actor: 'System', role: 'System', action: 'Flagged Access', target: '192.168.1.45', module: 'Auth', details: '5 failed login attempts for admin@univ.edu', severity: 'High' },
    { id: 'L-103', time: '08:15 AM, Today', actor: 'Dr. Meena R.', role: 'Faculty', action: 'Approved Hackathon', target: 'NASA Space Apps', module: 'Hackathons', details: 'Status: Pending -> Active', severity: 'Low' },
    { id: 'L-104', time: 'Yesterday', actor: 'Admin One', role: 'Admin', action: 'Edited Setting', target: 'Platform Policies', module: 'Settings', details: 'Updated registration deadline rules', severity: 'Medium' },
    { id: 'L-105', time: 'Yesterday', actor: 'System', role: 'System', action: 'Created Account', target: 'Anish K. (ST-4091)', module: 'Users', details: 'SSO auto-provisioning', severity: 'Low' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Audit Logs</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">System Accountability & Investigation</p>
        </div>
        <button className="px-6 py-3 bg-neutral-900 border-2 border-neutral-800 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:border-yellow-400 transition-colors flex items-center gap-2">
          <Database size={14} /> Export Logs
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input 
            type="text" 
            placeholder="Search logs by actor, action, target..." 
            className="w-full pl-10 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full text-sm font-bold focus:border-yellow-400 outline-none transition-colors text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-6 py-3 bg-neutral-900 border-2 border-neutral-800 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:border-yellow-400 transition-colors flex items-center gap-2">
          <Filter size={14} /> Filters
        </button>
      </div>

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 overflow-hidden flex flex-col shadow-xl">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-900 border-b-2 border-neutral-800 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Timestamp & ID</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action & Target</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-neutral-100 hover:bg-neutral-900 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{log.time}</p>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{log.id}</p>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                      {log.role === 'Admin' || log.role === 'System' ? <Shield size={10} className="text-white" /> : <User size={10} className="text-neutral-500" />}
                    </div>
                    <div>
                      <p className="font-black text-white">{log.actor}</p>
                      <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{log.role}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`font-bold ${log.severity === 'High' ? 'text-red-500' : 'text-white'}`}>{log.action}</p>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{log.target}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-neutral-700 text-neutral-400 rounded text-[9px] font-bold uppercase tracking-widest">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-neutral-400 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Showing recent 50 logs</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">Previous</button>
            <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
