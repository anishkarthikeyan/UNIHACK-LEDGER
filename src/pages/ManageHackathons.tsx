import React, { useEffect, useState } from 'react';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Hackathon } from '../types';
import type { NavigateFn } from '../App';

interface ManageHackathonsProps {
  onNavigate?: NavigateFn;
}

const STATUS_TABS = ['All', 'draft', 'published', 'registration_closed', 'ongoing', 'completed'];

export default function ManageHackathons({ onNavigate }: ManageHackathonsProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editClosesAt, setEditClosesAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    setLoading(true);
    api.hackathons.list(search)
      .then((rows) => { setHackathons(rows); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load hackathons.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const editingHackathon = hackathons.find((h) => h.id === editingId) ?? null;

  const startEdit = (h: Hackathon) => {
    setEditingId(h.id);
    setEditClosesAt(h.registration_closes_at ? new Date(h.registration_closes_at).toISOString().slice(0, 16) : '');
    setSaved(false);
  };

  const saveEdit = async () => {
    if (!editingHackathon) return;
    setSaving(true);
    try {
      await api.hackathons.update(editingHackathon.id, { registrationClosesAt: new Date(editClosesAt).toISOString() });
      setSaved(true);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const closeRegistration = async (h: Hackathon) => {
    try {
      await api.hackathons.update(h.id, { status: 'registration_closed' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to close registration.');
    }
  };

  const filtered = hackathons.filter((h) => activeStatus === 'All' || h.status === activeStatus);
  const countFor = (status: string) => status === 'All' ? hackathons.length : hackathons.filter((h) => h.status === status).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Manage Hackathons</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Manage draft, published, and archived events</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4 border-b border-neutral-800 overflow-x-auto pb-1 scrollbar-hide">
            {STATUS_TABS.map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap rounded-full ${
                  activeStatus === status ? 'bg-yellow-400 text-white' : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {status === 'All' ? 'All' : status.replace(/_/g, ' ')} ({countFor(status)})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hackathons..."
                className="w-full pl-11 pr-4 py-3 bg-black border border-neutral-800 rounded-full focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-sm outline-none text-white placeholder-neutral-500 transition-all"
              />
            </div>
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-neutral-500"><Loader2 className="animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">No hackathons found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/50 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 border-b border-neutral-800">Hackathon Name</th>
                      <th className="px-6 py-4 border-b border-neutral-800 text-center">Status</th>
                      <th className="px-6 py-4 border-b border-neutral-800">Reg. Close Date</th>
                      <th className="px-6 py-4 border-b border-neutral-800 text-center">Interested</th>
                      <th className="px-6 py-4 border-b border-neutral-800 text-center">Registered</th>
                      <th className="px-6 py-4 border-b border-neutral-800 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-white">
                    {filtered.map((h) => (
                      <tr key={h.id} className="hover:bg-neutral-700 transition-colors">
                        <td className="px-6 py-4 font-bold cursor-pointer hover:text-yellow-400" onClick={() => onNavigate?.('hackathons-detail', h.id)}>{h.title}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            h.status === 'published' ? 'bg-yellow-400 text-white' : 'bg-neutral-800 text-neutral-300'
                          }`}>
                            {h.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{h.registration_closes_at ? new Date(h.registration_closes_at).toLocaleDateString() : 'TBA'}</td>
                        <td className="px-6 py-4 text-center text-neutral-400 font-mono">{h.interested_count}</td>
                        <td className="px-6 py-4 text-center font-bold text-yellow-400 font-mono">{h.registered_count}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3 text-neutral-500">
                            <button onClick={() => startEdit(h)} className="text-[10px] font-bold uppercase tracking-widest hover:text-yellow-400 transition-colors">Edit</button>
                            {h.status === 'published' && (
                              <button onClick={() => closeRegistration(h)} className="text-[10px] font-bold uppercase tracking-widest hover:text-yellow-400 transition-colors">Close Reg.</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[360px] space-y-4">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 shadow-xl overflow-hidden flex flex-col text-white">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-black">
              <h3 className="font-black text-lg tracking-tight uppercase">Quick Edit</h3>
              {editingId && (
                <button onClick={() => setEditingId(null)} className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors">&times;</button>
              )}
            </div>

            {!editingHackathon ? (
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-12 px-6">Select "Edit" on a hackathon to update it here.</p>
            ) : (
              <div className="p-6 space-y-6">
                <p className="text-sm font-black text-yellow-400">{editingHackathon.title}</p>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Registration Closes</label>
                  <input type="datetime-local" value={editClosesAt} onChange={(e) => setEditClosesAt(e.target.value)} className="w-full px-4 py-3 bg-black border-2 border-neutral-800 rounded-xl text-sm font-mono font-bold outline-none focus:border-white transition-colors" />
                </div>
                <button onClick={saveEdit} disabled={saving} className="w-full py-4 bg-yellow-400 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : null}
                  {saved ? 'Saved' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
