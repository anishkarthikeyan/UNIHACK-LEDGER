import React, { useEffect, useState } from 'react';
import { Bell, AlertCircle, FileText, CheckCircle2, Loader2, CheckCheck } from 'lucide-react';
import { api } from '../lib/api';
import type { Notification } from '../types';

const TYPE_ICON: Record<string, typeof Bell> = {
  interest: AlertCircle,
  verification: FileText,
  update: CheckCircle2,
};

export default function FacultyNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    api.notifications.list()
      .then(setNotifications)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = notifications.filter((n) => activeTab === 'All' || (activeTab === 'Unread' && !n.read_at));

  const select = async (n: Notification) => {
    if (n.read_at) return;
    try {
      await api.notifications.markRead(n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
    } catch { /* non-critical */ }
  };

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Notifications</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Activity and Alerts</p>
        </div>
        <button onClick={markAllRead} className="px-6 py-3 bg-black border-2 border-neutral-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors flex items-center justify-center gap-2">
          <CheckCheck size={16} /> Mark All Read
        </button>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 p-8 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 border-b border-neutral-800 pb-2 flex-1">
            {['All', 'Unread'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors ${activeTab === tab ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500"><Loader2 className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">Nothing here.</p>
        ) : (
          <div className="space-y-4 overflow-auto flex-1">
            {filtered.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              return (
                <div key={n.id} onClick={() => select(n)} className={`p-6 border-2 rounded-2xl flex items-start gap-4 transition-colors cursor-pointer ${
                  !n.read_at ? 'bg-neutral-900 border-white shadow-lg' : 'bg-transparent border-neutral-800 hover:bg-neutral-900'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    !n.read_at ? 'bg-yellow-400 text-white' : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-black text-white">{n.title}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    {n.body && <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-1">{n.body}</p>}
                  </div>
                  {!n.read_at && <div className="w-3 h-3 bg-red-500 rounded-full shrink-0"></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
