import React, { useState } from 'react';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';

interface ResetPasswordProps {
  token: string;
  onDone: () => void;
}

// Reached via a `?reset_token=...` URL from the password-reset email (server/services/email/templates
// passwordResetEmail — see App.tsx for how the token is picked up). This app has no client-side
// router (App.tsx switches on in-memory tab state), so this screen is rendered directly by
// App.tsx ahead of its normal authenticated/unauthenticated branch — it works whether or not the
// visitor happens to have a session, matching how a password-reset link is used in practice.
export default function ResetPassword({ token, onDone }: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="w-full max-w-md z-10 bg-black border-4 border-neutral-800 rounded-[32px] p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {done ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="mx-auto text-yellow-400" size={32} />
            <h2 className="text-lg font-black uppercase tracking-widest text-white">Password updated</h2>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">You can now sign in with your new password.</p>
            <button onClick={onDone} className="w-full mt-2 px-6 py-3.5 bg-yellow-400 text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-[0.98] transition-transform shadow-lg">
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-14 h-14 mx-auto mb-4 bg-neutral-900 rounded-2xl flex items-center justify-center text-yellow-400 border-2 border-neutral-800">
                <KeyRound size={26} />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest text-white">Set a new password</h2>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">This link can only be used once.</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">New Password</label>
              <input
                type="password" required minLength={8}
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm outline-none focus:border-yellow-400 transition-colors text-white placeholder-neutral-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">Confirm Password</label>
              <input
                type="password" required minLength={8}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-sm outline-none focus:border-yellow-400 transition-colors text-white placeholder-neutral-600"
              />
            </div>
            {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}
            <button
              type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-yellow-400 text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-[0.98] transition-transform shadow-lg disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Updating…' : 'Update Password'}
            </button>
            <button type="button" onClick={onDone} className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
