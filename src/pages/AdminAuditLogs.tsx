import React, { useEffect, useState } from 'react';
import { Search, Shield, User, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { AuditLog } from '../types';

export default function AdminAuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      api.admin.auditLogs(searchTerm)
        .then((rows) => { setLogs(rows); setError(null); })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load audit logs.'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Audit Logs</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">System Accountability & Investigation</p>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder="Search logs by actor, action, entity..."
            className="w-full pl-10 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full text-sm font-bold focus:border-yellow-400 outline-none transition-colors text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 overflow-hidden flex flex-col shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500"><Loader2 className="animate-spin" /></div>
        ) : logs.length === 0 ? (
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">No matching logs.</p>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-900 border-b-2 border-neutral-800 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action & Entity</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-neutral-800 hover:bg-neutral-900 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{new Date(log.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                          {log.actor_role === 'admin' ? <Shield size={10} className="text-white" /> : <User size={10} className="text-neutral-500" />}
                        </div>
                        <div>
                          <p className="font-black text-white">{log.actor_name ?? 'System'}</p>
                          <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{log.actor_role ?? 'system'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{log.action}</p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{log.entity_type}{log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ''}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-neutral-400 max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                      {Object.keys(log.metadata ?? {}).length > 0 ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Showing recent {logs.length} logs</p>
        </div>
      </div>
    </div>
  );
}
