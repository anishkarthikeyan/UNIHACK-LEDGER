import React, { useEffect, useState } from 'react';
import { Shield, Bell, BookOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function StudentProfileSettings() {
  const { user, refresh } = useAuth();
  const [programme, setProgramme] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [interests, setInterests] = useState('');
  const [techStack, setTechStack] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setProgramme(user.programme ?? '');
    setYearOfStudy(user.year_of_study ?? 1);
    setInterests((user.interests ?? []).join(', '));
    setTechStack((user.tech_stack ?? []).join(', '));
    setPhone(user.student_phone ?? '');
  }, [user]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.users.updateMe({
        programme: programme || undefined,
        yearOfStudy,
        interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
        techStack: techStack.split(',').map((s) => s.trim()).filter(Boolean),
        phone: phone || undefined,
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">Profile & Settings</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Manage your account and academic details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-yellow-400 text-white rounded-full flex items-center justify-center font-black text-3xl mb-4 border-4 border-neutral-100 outline outline-4 outline-yellow-400/20">
              {initialsOf(user.full_name)}
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-1">{user.full_name}</h2>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-6">Student{user.programme ? ` • ${user.programme}` : ''}</p>
          </div>

          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-6 space-y-4">
            <div className="flex items-center gap-3 text-neutral-400 mb-4">
              <Shield size={18} className="text-yellow-400" />
              <h3 className="font-black uppercase tracking-widest text-sm text-white">Account Status</h3>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Email</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">{user.status}</span>
              </div>
              <p className="text-xs text-white font-mono">{user.email}</p>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Institutional ID</span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">{user.institutional_id}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8">
            <h3 className="font-black uppercase tracking-widest text-lg text-white mb-6 flex items-center gap-2">
              <BookOpen size={20} className="text-yellow-400" /> Academic & Skills
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Programme</label>
                <input type="text" value={programme} onChange={(e) => setProgramme(e.target.value)} placeholder="e.g. B.Tech CSE" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Year of Study</label>
                <select value={yearOfStudy} onChange={(e) => setYearOfStudy(Number(e.target.value))} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none">
                  {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Domain Interests (Comma separated)</label>
                <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Web Development, AI/ML, Blockchain" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Preferred Tech Stack</label>
                <input type="text" value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="React, Node.js, Python" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors" />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest mt-4">{error}</p>}

            <div className="mt-8 flex justify-end items-center gap-4">
              {saved && <span className="text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={14} /> Saved</span>}
              <button onClick={save} disabled={saving} className="px-6 py-3 bg-neutral-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-neutral-700 transition-colors disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Save Profile
              </button>
            </div>
          </div>

          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8">
            <h3 className="font-black uppercase tracking-widest text-lg text-white mb-6 flex items-center gap-2">
              <Bell size={20} className="text-yellow-400" /> Notifications
            </h3>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest leading-relaxed">
              In-app notifications are always on — check the bell icon or the Notifications tab. Per-channel preferences (email/push opt-out) aren't configurable yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
