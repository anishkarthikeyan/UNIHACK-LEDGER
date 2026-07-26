import React, { useState } from 'react';
import { User, BookOpen, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = {
  student: { email: 'student@demo.edu', password: 'Demo@123', icon: User, label: 'Student', copy: 'Explore hackathons, manage teams, track pipeline, and showcase projects.' },
  faculty: { email: 'faculty@demo.edu', password: 'Demo@123', icon: BookOpen, label: 'Faculty', copy: 'Create events, track student progress, verify proofs, and review projects.' },
  admin: { email: 'admin@demo.edu', password: 'Demo@123', icon: Shield, label: 'Admin', copy: 'Manage users, govern roles, review audit logs, and configure system policies.' },
} as const;

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (key: keyof typeof DEMO_ACCOUNTS) => {
    setEmail(DEMO_ACCOUNTS[key].email);
    setPassword(DEMO_ACCOUNTS[key].password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-4xl z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">
            UniHack<span className="text-yellow-400">Ledger</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
            A modern, minimalist hackathon management platform. <br className="hidden md:block"/> Sign in to continue.
          </p>
        </div>

        <form onSubmit={submit} className="max-w-md mx-auto bg-black border-4 border-neutral-800 rounded-[32px] p-8 mb-10">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@demo.edu"
                className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm outline-none focus:border-yellow-400 transition-colors text-white placeholder-neutral-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm outline-none focus:border-yellow-400 transition-colors text-white placeholder-neutral-600"
              />
            </div>
            {error && (
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-yellow-400 text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-[0.98] transition-transform shadow-lg disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </form>

        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4">
          Or quick-fill a demo account
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {(Object.keys(DEMO_ACCOUNTS) as (keyof typeof DEMO_ACCOUNTS)[]).map((key) => {
            const account = DEMO_ACCOUNTS[key];
            const Icon = account.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => fillDemo(key)}
                className="group bg-black border-4 border-neutral-800 rounded-[32px] p-8 text-left hover:border-yellow-400 hover:bg-neutral-700 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl group-hover:bg-yellow-400/20 transition-all"></div>
                <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-yellow-400 mb-8 border-2 border-neutral-800 group-hover:border-yellow-400 transition-colors">
                  <Icon size={32} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-widest mb-3 text-white">{account.label}</h2>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
                  {account.copy}
                </p>
              </button>
            );
          })}
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
