import React, { useEffect, useState } from 'react';
import { User, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function FacultySettings() {
  const { user, refresh } = useAuth();
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setDesignation(user.designation ?? '');
    setPhone(user.faculty_phone ?? '');
  }, [user]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.users.updateMe({ designation: designation || undefined, phone: phone || undefined });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Settings</h1>
        <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Manage Profile and Preferences</p>
      </div>

      <div className="flex-1 bg-black border-4 border-neutral-800 rounded-[32px] p-8 max-w-4xl">
        <div className="space-y-8">
          <div className="flex items-center gap-6 pb-8 border-b border-neutral-800">
            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-white text-3xl font-black">
              {initialsOf(user.full_name)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{user.full_name}</h2>
              <p className="text-sm font-bold uppercase tracking-widest text-neutral-500 mt-1">{user.designation ?? 'Faculty'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
              <User size={20} className="text-yellow-400" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Email Address</label>
                <input type="email" value={user.email} disabled className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-neutral-500 outline-none font-bold cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Designation</label>
                <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Associate Professor" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Contact Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 font-bold" />
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

          <div className="pt-8 border-t border-neutral-800 flex items-center gap-4">
            {saved && <span className="text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={14} /> Saved</span>}
            <button onClick={save} disabled={saving} className="px-8 py-4 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-95 transition-transform flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
