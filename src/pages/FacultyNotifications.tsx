import React, { useState } from 'react';
import { Bell, AlertCircle, FileText, CheckCircle2, Search } from 'lucide-react';

export default function FacultyNotifications() {
  const [activeTab, setActiveTab] = useState('All');
  
  const notifications = [
    { id: 1, type: 'Action', title: 'New Hackathon Suggestion', source: 'Anish K.', time: '2 hours ago', unread: true, icon: AlertCircle },
    { id: 2, type: 'System', title: 'Registration Goal Met', source: 'System', time: '5 hours ago', unread: true, icon: CheckCircle2 },
    { id: 3, type: 'Action', title: 'Pending Verifications: 24', source: 'Platform', time: '1 day ago', unread: false, icon: FileText },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Notifications</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Activity and Alerts</p>
        </div>
      </div>

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 p-8 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 border-b border-neutral-800 pb-2 flex-1">
            {['All', 'Unread', 'Action Required'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors ${activeTab === tab ? 'bg-neutral-900 text-white-TMP' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 overflow-auto flex-1">
          {notifications.map(n => (
            <div key={n.id} className={`p-6 border-2 rounded-2xl flex items-start gap-4 transition-colors cursor-pointer ${
              n.unread ? 'bg-neutral-900 border-white shadow-lg' : 'bg-transparent border-neutral-800 hover:bg-neutral-900'
            }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                n.unread ? 'bg-yellow-400 text-white' : 'bg-neutral-800 text-neutral-500'
              }`}>
                <n.icon size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-black text-white">{n.title}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{n.time}</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-1">{n.source}</p>
              </div>
              {n.unread && <div className="w-3 h-3 bg-red-500 rounded-full shrink-0"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
