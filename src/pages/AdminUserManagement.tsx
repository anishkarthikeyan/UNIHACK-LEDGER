import React, { useEffect, useState } from 'react';
import { Search, UserCheck, UserX, Shield, X, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { AdminUser, Department } from '../types';

export default function AdminUserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ institutionalId: '', email: '', fullName: '', role: 'student' as 'student' | 'faculty' | 'admin', departmentCode: '' });
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.admin.users({ search: searchTerm, role: roleFilter || undefined }), api.admin.departments()])
      .then(([u, d]) => { setUsers(u); setDepartments(d); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [searchTerm, roleFilter]);

  const toggleStatus = async (u: AdminUser) => {
    setBusyId(u.id);
    try {
      await api.admin.updateUser(u.id, { status: u.status === 'active' ? 'suspended' : 'active' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update user.');
    } finally {
      setBusyId(null);
    }
  };

  const createUser = async () => {
    if (!newUser.institutionalId || !newUser.email || !newUser.fullName) { setError('Institutional ID, email, and name are required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.admin.createUser({ ...newUser, departmentCode: newUser.departmentCode || undefined });
      setNewUser({ institutionalId: '', email: '', fullName: '', role: 'student', departmentCode: '' });
      setShowAddModal(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">User Management</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Registry & Role Control</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-yellow-400 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform shrink-0">
          + Add User
        </button>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            className="w-full pl-10 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full text-sm font-bold focus:border-yellow-400 outline-none transition-colors text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none appearance-none">
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 overflow-hidden flex flex-col shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500"><Loader2 className="animate-spin" /></div>
        ) : users.length === 0 ? (
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">No users found.</p>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-900 border-b-2 border-neutral-800 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Name & ID</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-800 hover:bg-neutral-900 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-black text-white">{user.full_name}</p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{user.institutional_id} • {user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        user.role === 'faculty' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-yellow-400/20 text-yellow-500 border border-yellow-400/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{user.department_code ?? '—'}</p>
                      {user.year_of_study && <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Year {user.year_of_study}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${
                        user.status === 'active' ? 'text-green-500' : 'text-neutral-400'
                      }`}>
                        {user.status === 'active' ? <UserCheck size={14} /> : <UserX size={14} />}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-500 text-xs">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={busyId === user.id}
                        onClick={() => toggleStatus(user)}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors disabled:opacity-60 inline-flex items-center gap-1"
                      >
                        <Shield size={12} /> {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Showing {users.length} user{users.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Add User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <input value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} placeholder="Full name" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold" />
              <input value={newUser.institutionalId} onChange={(e) => setNewUser({ ...newUser, institutionalId: e.target.value })} placeholder="Institutional ID (e.g. ST-1234)" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold" />
              <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} type="email" placeholder="Email" className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold" />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as typeof newUser.role })} className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold appearance-none">
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              <select value={newUser.departmentCode} onChange={(e) => setNewUser({ ...newUser, departmentCode: e.target.value })} className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold appearance-none">
                <option value="">No department</option>
                {departments.map((d) => <option key={d.id} value={d.code}>{d.name}</option>)}
              </select>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">New accounts get the default password Demo@123.</p>
              <button onClick={createUser} disabled={submitting} className="w-full py-4 mt-2 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <Loader2 size={14} className="animate-spin" />} Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
