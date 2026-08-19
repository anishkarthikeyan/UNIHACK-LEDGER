import React, { useEffect, useState } from 'react';
import { Bell, Clock, CheckCircle2, Calendar, CheckCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Notification } from '../types';
import type { NavigateFn } from '../App';

interface StudentNotificationsProps {
  onNavigate?: NavigateFn;
}

// action_url is stored as a server-side logical path (see services.notifications.notify() call
// sites), not a browser route — this app navigates by tab id, not URL, so map the handful of
// values actually produced (teams.routes.ts, registrations.routes.ts) to their tab.
function actionUrlToTab(actionUrl: string | null): string {
  if (actionUrl === '/teams') return 'teams';
  if (actionUrl === '/pipeline') return 'pipeline';
  return 'explore';
}

const TYPE_ICON: Record<string, typeof Bell> = {
  interest: Clock,
  deadline: Clock,
  verification: ShieldAlert,
  general: Calendar,
  update: CheckCircle2,
  registration_submitted: Clock,
  registration_reviewed: CheckCircle2,
  team_invite: Bell,
  team_join_request: Bell,
};

export default function StudentNotifications({ onNavigate }: StudentNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    api.notifications.list()
      .then((rows) => { setNotifications(rows); if (rows[0]) setSelectedId(rows[0].id); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.read_at;
    return n.type === activeTab;
  });

  const selectedNotification = filteredNotifications.find((n) => n.id === selectedId) ?? filteredNotifications[0];

  const select = async (n: Notification) => {
    setSelectedId(n.id);
    if (!n.read_at) {
      try {
        await api.notifications.markRead(n.id);
        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
      } catch { /* non-critical */ }
    }
  };

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">Notifications</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Stay updated on your hackathons and deadlines</p>
        </div>
        <div className="flex gap-4">
          <button onClick={markAllRead} className="px-6 py-4 bg-black border-2 border-neutral-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors flex items-center justify-center gap-2">
            <CheckCheck size={16} /> Mark All Read
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="flex-1 min-h-0 bg-black border-4 border-neutral-800 rounded-[32px] overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800">
          <div className="p-6 border-b border-neutral-800">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {['All', 'Unread'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap rounded-full shrink-0 ${
                    activeTab === tab ? 'bg-neutral-900 text-white' : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">Nothing here.</p>
            ) : filteredNotifications.map((notif) => {
              const Icon = TYPE_ICON[notif.type] ?? Bell;
              return (
                <div
                  key={notif.id}
                  onClick={() => select(notif)}
                  className={`p-6 border-b border-neutral-800 cursor-pointer transition-all hover:bg-neutral-700 ${
                    selectedId === notif.id ? 'bg-neutral-800/50' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1 shrink-0">
                      {!notif.read_at ? <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2"></div> : <div className="w-2 h-2 rounded-full bg-transparent mt-2"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h3 className={`text-sm font-bold leading-tight break-words min-w-0 ${!notif.read_at ? 'text-white' : 'text-neutral-300'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest whitespace-nowrap shrink-0">{new Date(notif.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[9px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                          <Icon size={10} /> {notif.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col bg-black/20">
          {selectedNotification ? (
            <>
              <div className="p-8 border-b border-neutral-800 flex justify-between items-start gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 bg-black border-neutral-800 text-neutral-400 shrink-0">
                    {React.createElement(TYPE_ICON[selectedNotification.type] ?? Bell, { size: 24 })}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-white break-words">{selectedNotification.title}</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-1">{new Date(selectedNotification.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-neutral-300 leading-relaxed text-sm">
                    {selectedNotification.body ?? 'No additional details.'}
                  </p>
                </div>
                {selectedNotification.action_url && (
                  <div className="mt-8 p-6 bg-yellow-400 rounded-2xl text-white border-4 border-yellow-500">
                    <h4 className="font-black uppercase tracking-widest text-sm mb-2">Related Link</h4>
                    <button
                      onClick={() => onNavigate?.(actionUrlToTab(selectedNotification.action_url))}
                      className="px-6 py-3 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-[0.98] transition-transform"
                    >
                      View
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
              <Bell size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">Select a notification to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
