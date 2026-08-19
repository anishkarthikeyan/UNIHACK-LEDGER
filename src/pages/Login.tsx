import React, { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';

// Stage 2A: no role selector here by design — the backend determines role from the database
// (see server/routes/auth.routes.ts POST /auth/login), never from anything the client sends or
// picks. This screen only ever collects email + password.
export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotSent, setForgotSent] = useState(false);

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

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.forgotPassword(email);
      setForgotSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send reset link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6">
            UniHack<span className="text-yellow-400">Ledger</span>
          </h1>
          <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
            A modern, minimalist hackathon management platform. Sign in to continue.
          </p>
        </div>

        {mode === 'login' ? (
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">Password</label>
                  <button type="button" onClick={() => { setMode('forgot'); setError(null); setForgotSent(false); }} className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-yellow-400 transition-colors">
                    Forgot password?
                  </button>
                </div>
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
        ) : (
          <div className="max-w-md mx-auto bg-black border-4 border-neutral-800 rounded-[32px] p-8 mb-10">
            {forgotSent ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="mx-auto text-yellow-400" size={32} />
                <p className="text-sm text-neutral-300 font-medium">If an account exists for <span className="text-white font-bold">{email}</span>, a password reset link has been sent.</p>
                <button type="button" onClick={() => { setMode('login'); setForgotSent(false); }} className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 hover:underline">
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={submitForgot} className="space-y-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-white mb-1">Reset Password</h2>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">We'll email you a link to set a new one.</p>
                </div>
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
                {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-yellow-400 text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-[0.98] transition-transform shadow-lg disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => { setMode('login'); setError(null); }} className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
                  Back to sign in
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
            © 2026 UNIHACK LEDGER. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </div>
  );
}
