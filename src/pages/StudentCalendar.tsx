import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function StudentCalendar() {
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderType, setReminderType] = useState('Solo');
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Dummy calendar data to render the grid
  // Assuming May 2025 for demo purposes where 1st is Thursday
  const daysInMonth = 31;
  const startDay = 4; // Thursday index in 0-indexed week

  const renderCalendarDays = () => {
    const days = [];
    // Empty days from previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 border border-neutral-800/50 p-2 opacity-20"></div>);
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      // Dummy events logic
      const isSelected = i === 25;
      const hasDeadline = i === 10 || i === 25;
      const hasEvent = i === 15 || i === 25;

      days.push(
        <div 
          key={i} 
          className={`h-24 md:h-32 border border-neutral-800 p-2 flex flex-col transition-all cursor-pointer ${
            isSelected ? 'bg-yellow-400/10 border-yellow-400' : 'hover:bg-neutral-700 hover:border-neutral-700'
          }`}
        >
          <span className={`text-sm font-mono font-bold p-1 rounded-full w-8 h-8 flex items-center justify-center ${isSelected ? 'bg-yellow-400 text-white' : 'text-neutral-400'}`}>
            {i}
          </span>
          <div className="mt-auto space-y-1">
            {hasDeadline && (
              <div className="w-full h-1.5 bg-yellow-400 rounded-full" title="Deadline"></div>
            )}
            {hasEvent && (
              <div className="w-full h-1.5 bg-black rounded-full" title="Event"></div>
            )}
          </div>
        </div>
      );
    }
    
    // Fill remaining grid
    const totalCells = Math.ceil((daysInMonth + startDay) / 7) * 7;
    for (let i = daysInMonth + startDay; i < totalCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="h-24 md:h-32 border border-neutral-800/50 p-2 opacity-20"></div>);
    }

    return days;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Calendar</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Manage deadlines, rounds, and schedules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          
          {/* Filters */}
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6">
            <div className="flex items-center gap-2 mb-6 text-white">
              <Filter size={18} />
              <h2 className="font-black uppercase tracking-widest text-sm">Event Filters</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-5 h-5 rounded-md border-2 border-yellow-400 flex items-center justify-center bg-yellow-400/20">
                  <div className="w-2.5 h-2.5 bg-yellow-400 rounded-sm"></div>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-yellow-400 transition-colors">Deadlines</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-5 h-5 rounded-md border-2 border-white flex items-center justify-center bg-neutral-900/10">
                  <div className="w-2.5 h-2.5 bg-black rounded-sm"></div>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-white transition-colors">Hackathon Rounds</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                 <div className="w-5 h-5 rounded-md border-2 border-neutral-600 flex items-center justify-center">
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 group-hover:text-white transition-colors">Team Meetings</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                 <div className="w-5 h-5 rounded-md border-2 border-neutral-600 flex items-center justify-center">
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 group-hover:text-white transition-colors">General Reminders</span>
              </label>
            </div>
          </div>

          {/* Agenda */}
          <div className="bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon size={20} className="text-white" />
              <div>
                <h3 className="font-black uppercase tracking-widest text-sm">Agenda</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">25 May 2025</p>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="bg-black/10 rounded-2xl p-4 border border-white/5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Deadline</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">11:59 PM</span>
                </div>
                <p className="font-bold text-sm mb-1 leading-tight">Code for Good Registration Closes</p>
                <p className="text-xs font-medium opacity-80">Make sure team profile is complete.</p>
              </div>

              <div className="bg-black/10 rounded-2xl p-4 border border-white/5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Round Start</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">10:00 AM</span>
                </div>
                <p className="font-bold text-sm mb-1 leading-tight">HealthHack Prototype Phase</p>
                <p className="text-xs font-medium opacity-80">Workspace will be unlocked.</p>
              </div>
            </div>

            <button 
              onClick={() => setShowReminderModal(true)}
              className="w-full mt-4 py-3 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-[0.98] transition-transform"
            >
              Add Personal Reminder
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-black border-4 border-neutral-800 rounded-[32px] p-6 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-widest text-white">May <span className="text-neutral-500">2025</span></h2>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border-2 border-neutral-700 flex items-center justify-center text-white hover:border-yellow-400 hover:text-yellow-400 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button className="w-10 h-10 rounded-full border-2 border-neutral-700 flex items-center justify-center text-white hover:border-yellow-400 hover:text-yellow-400 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          {/* Days of Week */}
          <div className="grid grid-cols-7 mb-4">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 pb-2 border-b-2 border-neutral-800">
                {day}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="grid grid-cols-7 flex-1 border-l border-t border-neutral-800">
            {renderCalendarDays()}
          </div>
        </div>

      </div>

      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">New Reminder</h2>
              <button onClick={() => setShowReminderModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Reminder Type</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setReminderType('Solo')}
                    className={`flex-1 py-3 border-2 rounded-full font-bold uppercase tracking-widest text-[10px] transition-colors ${reminderType === 'Solo' ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-neutral-900 border-neutral-800 text-white hover:border-white'}`}
                  >
                    Personal (Solo)
                  </button>
                  <button 
                    onClick={() => setReminderType('Team')}
                    className={`flex-1 py-3 border-2 rounded-full font-bold uppercase tracking-widest text-[10px] transition-colors ${reminderType === 'Team' ? 'bg-black border-white text-white' : 'bg-neutral-900 border-neutral-800 text-white hover:border-white'}`}
                  >
                    Team Sync
                  </button>
                </div>
              </div>

              {reminderType === 'Team' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Select Team</label>
                  <select className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors appearance-none">
                    <option>ByteMe - AI Innovate 5.0</option>
                    <option>Design Divas - Designathon 2024</option>
                  </select>
                  <p className="text-[9px] text-neutral-400 mt-2 font-bold uppercase tracking-widest">This will notify all members of the selected team.</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Title</label>
                <input type="text" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" placeholder={reminderType === 'Team' ? "e.g. Brainstorming session" : "e.g. Finish prototype"} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Date</label>
                  <input type="date" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Time</label>
                  <input type="time" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Notes (Optional)</label>
                <textarea rows={3} className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors resize-none" placeholder="Any additional details..."></textarea>
              </div>

              <button onClick={() => setShowReminderModal(false)} className="w-full py-4 mt-4 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-[0.98] transition-transform">
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
