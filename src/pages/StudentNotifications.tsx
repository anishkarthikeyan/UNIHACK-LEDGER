import React, { useState } from 'react';
import { Bell, AlertCircle, Clock, CheckCircle2, Calendar, CheckCheck, Trash2, ShieldAlert } from 'lucide-react';

interface StudentNotificationsProps {
  onNavigate?: (route: string) => void;
}

export default function StudentNotifications({ onNavigate }: StudentNotificationsProps) {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedId, setSelectedId] = useState<number>(1);

  const notifications = [
    {
      id: 1,
      title: 'Registration Closing Soon',
      source: 'Code for Good 2025',
      type: 'Deadline',
      time: '2 hours ago',
      unread: true,
      urgent: true,
      icon: Clock,
      content: 'The registration window for Code for Good 2025 will close in 48 hours. Please ensure all your team members have accepted their invitations and completed their profiles to avoid disqualification.'
    },
    {
      id: 2,
      title: 'Round 1 Results Announced',
      source: 'AI Innovate 5.0',
      type: 'Faculty Update',
      time: '5 hours ago',
      unread: true,
      urgent: false,
      icon: Bell,
      content: 'The results for the Ideation Round have been published. Check your pipeline to see if your team has been selected for the Prototype Phase. Congratulations to all teams who advanced!'
    },
    {
      id: 3,
      title: 'Student ID Verification Pending',
      source: 'System Admin',
      type: 'Verification',
      time: '1 day ago',
      unread: false,
      urgent: true,
      icon: ShieldAlert,
      content: 'Your college email and student ID card verification is still pending. You will not be able to participate in any external hackathons until your identity is verified by the faculty.'
    },
    {
      id: 4,
      title: 'New Hackathon Added',
      source: 'Health Club',
      type: 'General',
      time: '2 days ago',
      unread: false,
      urgent: false,
      icon: Calendar,
      content: 'HealthHack 2025 has just been announced. It is open to all years and focuses on creating digital solutions for campus well-being. Early bird registration is now open.'
    },
    {
      id: 5,
      title: 'Project Submission Successful',
      source: 'Web3 Buildathon',
      type: 'Faculty Update',
      time: '4 days ago',
      unread: false,
      urgent: false,
      icon: CheckCircle2,
      content: 'Your final project files (GitHub repo, presentation, and demo video) have been successfully submitted and locked for review. Evaluation will begin next week.'
    }
  ];

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Deadlines') return n.type === 'Deadline';
    if (activeTab === 'Faculty Updates') return n.type === 'Faculty Update';
    if (activeTab === 'Verification') return n.type === 'Verification';
    return true;
  });

  const selectedNotification = filteredNotifications.find(n => n.id === selectedId) || filteredNotifications[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Notifications</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Stay updated on your hackathons and deadlines</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-4 bg-black border-2 border-neutral-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors flex items-center justify-center gap-2">
            <CheckCheck size={16} /> Mark All Read
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-black border-4 border-neutral-800 rounded-[32px] overflow-hidden flex flex-col md:flex-row">
        
        {/* Left List Pane */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800">
          
          <div className="p-6 border-b border-neutral-800">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {['All', 'Deadlines', 'Faculty Updates', 'Verification'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap rounded-full shrink-0 ${
                    activeTab === tab ? 'bg-neutral-900 text-white-TMP' : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => setSelectedId(notif.id)}
                className={`p-6 border-b border-neutral-800 cursor-pointer transition-all hover:bg-neutral-700 ${
                  selectedId === notif.id ? 'bg-neutral-800/50' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 shrink-0 ${notif.unread ? 'text-yellow-400' : 'text-neutral-500'}`}>
                     {notif.unread ? <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2"></div> : <div className="w-2 h-2 rounded-full bg-transparent mt-2"></div>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-sm font-bold leading-tight ${notif.unread ? 'text-white' : 'text-neutral-300'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest whitespace-nowrap ml-4">{notif.time}</span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">{notif.source}</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                        {notif.type}
                      </span>
                      {notif.urgent && (
                        <span className="px-2 py-1 rounded bg-yellow-400/10 border border-yellow-400/20 text-[9px] font-bold uppercase tracking-widest text-yellow-400">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col bg-black/20">
          {selectedNotification ? (
            <>
              <div className="p-8 border-b border-neutral-800 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${
                    selectedNotification.urgent ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' : 'bg-black border-neutral-800 text-neutral-400'
                  }`}>
                    <selectedNotification.icon size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedNotification.title}</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-1">{selectedNotification.source} • {selectedNotification.time}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full border-2 border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-neutral-300 leading-relaxed text-sm">
                    {selectedNotification.content}
                  </p>
                </div>
                
                {selectedNotification.type === 'Deadline' && (
                   <div className="mt-8 p-6 bg-yellow-400 rounded-2xl text-white border-4 border-yellow-500">
                     <h4 className="font-black uppercase tracking-widest text-sm mb-2">Required Action</h4>
                     <p className="text-sm font-medium mb-4">You need to finalize your team formation before the deadline.</p>
                     <button onClick={() => onNavigate?.('teams')} className="px-6 py-3 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-[0.98] transition-transform">
                       Go to Team Dashboard
                     </button>
                   </div>
                )}
                {selectedNotification.type === 'Verification' && (
                   <div className="mt-8 p-6 bg-black rounded-2xl text-white border-2 border-neutral-800">
                     <h4 className="font-black uppercase tracking-widest text-sm mb-2">Required Action</h4>
                     <p className="text-sm text-neutral-400 mb-4">Please upload a valid college ID card.</p>
                     <button onClick={() => onNavigate?.('profile')} className="px-6 py-3 bg-neutral-900 text-white-TMP rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-700 transition-colors">
                       Upload Document
                     </button>
                   </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
              <Bell size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">Select a notification to view</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
