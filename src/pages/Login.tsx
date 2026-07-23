import React from 'react';
import { User, BookOpen, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: (role: 'student' | 'faculty' | 'admin') => void;
}

export default function Login({ onLogin }: LoginProps) {
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-4xl z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">
            UniHack<span className="text-yellow-400">Ledger</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
            A modern, minimalist hackathon management platform. <br className="hidden md:block"/> Select your portal to continue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Student Card */}
          <button 
            onClick={() => onLogin('student')}
            className="group bg-black border-4 border-neutral-800 rounded-[32px] p-8 text-left hover:border-yellow-400 hover:bg-neutral-700 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl group-hover:bg-yellow-400/20 transition-all"></div>
            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-yellow-400 mb-8 border-2 border-neutral-800 group-hover:border-yellow-400 transition-colors">
              <User size={32} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-3 text-white">Student</h2>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
              Explore hackathons, manage teams, track pipeline, and showcase projects.
            </p>
          </button>

          {/* Faculty Card */}
          <button 
            onClick={() => onLogin('faculty')}
            className="group bg-black border-4 border-neutral-800 rounded-[32px] p-8 text-left hover:border-yellow-400 hover:bg-neutral-700 transition-all duration-300 relative overflow-hidden transform md:-translate-y-4"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl group-hover:bg-yellow-400/20 transition-all"></div>
            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-yellow-400 mb-8 border-2 border-neutral-800 group-hover:border-yellow-400 transition-colors">
              <BookOpen size={32} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-3 text-white">Faculty</h2>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
              Create events, track student progress, verify proofs, and review projects.
            </p>
          </button>

          {/* Admin Card */}
          <button 
            onClick={() => onLogin('admin')}
            className="group bg-black border-4 border-neutral-800 rounded-[32px] p-8 text-left hover:border-yellow-400 hover:bg-neutral-700 transition-all duration-300 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl group-hover:bg-yellow-400/20 transition-all"></div>
            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-yellow-400 mb-8 border-2 border-neutral-800 group-hover:border-yellow-400 transition-colors">
              <Shield size={32} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-3 text-white">Admin</h2>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
              Manage users, govern roles, review audit logs, and configure system policies.
            </p>
          </button>
        </div>
        
        <div className="mt-16 text-center">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
              © 2026 UNIHACK LEDGER. ALL RIGHTS RESERVED.
            </p>
        </div>
      </div>
    </div>
  );
}
