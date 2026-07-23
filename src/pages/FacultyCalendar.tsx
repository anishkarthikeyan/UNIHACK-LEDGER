import React from 'react';
import { Calendar as CalendarIcon, Clock, Users, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function FacultyCalendar() {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Calendar</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Hackathon schedules and deadlines</p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-neutral-900 text-white-TMP rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-95 transition-transform flex items-center gap-2">
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-black border-4 border-neutral-800 rounded-[32px] p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-widest">May 2025</h2>
            <div className="flex gap-2">
              <button className="p-2 border-2 border-neutral-800 rounded-full text-neutral-400 hover:text-white hover:border-white transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button className="p-2 border-2 border-neutral-800 rounded-full text-neutral-400 hover:text-white hover:border-white transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2 flex-1">
            {dates.map(date => {
              const hasEvent = date === 20 || date === 25 || date === 28;
              const isToday = date === 20;
              return (
                <div 
                  key={date} 
                  className={`relative p-2 rounded-xl border-2 transition-all cursor-pointer min-h-[80px] ${
                    isToday ? 'bg-yellow-400 border-yellow-400 text-white shadow-lg scale-105 z-10' : 
                    hasEvent ? 'bg-neutral-900 border-white text-white hover:bg-neutral-800' : 
                    'bg-neutral-900 border-neutral-100 text-neutral-400 hover:border-neutral-800'
                  }`}
                >
                  <span className="font-bold">{date}</span>
                  {hasEvent && (
                    <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                      <div className={`h-1.5 flex-1 rounded-full ${isToday ? 'bg-neutral-900/50' : 'bg-black'}`}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-6">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Upcoming Events</h2>
          
          {[
            { title: 'Code for Good Reg. Close', time: 'May 25, 11:59 PM', type: 'Deadline' },
            { title: 'HealthHack Kickoff', time: 'May 28, 10:00 AM', type: 'Event' },
            { title: 'AI Innovate Mentoring', time: 'Jun 2, 2:00 PM', type: 'Meeting' }
          ].map((event, i) => (
            <div key={i} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 flex items-start gap-4 hover:border-yellow-400 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center shrink-0 group-hover:bg-yellow-400 group-hover:text-white transition-colors">
                {event.type === 'Deadline' ? <Clock size={20} /> : <Users size={20} />}
              </div>
              <div>
                <h3 className="font-black text-white">{event.title}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-1">{event.time}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-neutral-800 rounded text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                  {event.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
