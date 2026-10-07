import React, { useEffect, useState } from 'react';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { ROLE_LABEL } from '../types';
import type { AdminScopeAssignment, AdminUser, Department } from '../types';

// Admin → Scope Assignments: which part of Department → Batch → Section each staff member covers.
// The server enforces the shape per role (faculty = a section, coordinator/SDE coordinator = a
// batch, HOD = a department); this form just collects the fields and shows the server's error.

const STAFF = ['faculty', 'coordinator', 'sde_coordinator', 'hod'];
const input = 'w-full p-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-sm text-white outline-none focus:border-yellow-400';

export default function AdminScopeAssignments() {
  const [assignments, setAssignments] = useState<AdminScopeAssignment[]>([]);
  const [staff, setStaff] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ userId: '', departmentCode: 'CSE', batchYear: '2024', section: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    // One query per staff role: the user list is capped, and students would otherwise crowd staff out.
    Promise.all([api.admin.scopeAssignments(), Promise.all(STAFF.map((role) => api.admin.users({ role }))), api.admin.departments()])
      .then(([a, perRole, depts]) => {
        setAssignments(a);
        setStaff(perRole.flat());
        setDepartments(depts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load scope assignments.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const selected = staff.find((u) => u.id === form.userId);

  const create = async () => {
    if (!selected) { setError('Choose a staff member.'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.admin.createScopeAssignment({
        userId: selected.id,
        departmentCode: form.departmentCode,
        batchYear: selected.role === 'hod' ? null : Number(form.batchYear) || null,
        section: selected.role === 'faculty' ? form.section.trim().toUpperCase() || null : null,
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create assignment.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remove this scope assignment? The staff member immediately loses access to those students.')) return;
    try { await api.admin.deleteScopeAssignment(id); load(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to remove assignment.'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white">Scope Assignments</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Which students each Faculty Advisor, Coordinator, SDE Coordinator and HOD can see</p>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Staff member</label>
          <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className={input}>
            <option value="">Choose…</option>
            {staff.map((u) => <option key={u.id} value={u.id}>{u.full_name} — {ROLE_LABEL[u.role]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Department</label>
          <select value={form.departmentCode} onChange={(e) => setForm({ ...form, departmentCode: e.target.value })} className={input}>
            {departments.map((d) => <option key={d.id} value={d.code}>{d.code}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Batch {selected?.role === 'hod' ? '(n/a)' : ''}</label>
          <input value={form.batchYear} disabled={selected?.role === 'hod'} onChange={(e) => setForm({ ...form, batchYear: e.target.value })} className={input} placeholder="2024" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Section {selected && selected.role !== 'faculty' ? '(n/a)' : ''}</label>
          <div className="flex gap-2">
            <input value={form.section} disabled={!!selected && selected.role !== 'faculty'} onChange={(e) => setForm({ ...form, section: e.target.value })} className={input} placeholder="A" maxLength={2} />
            <button onClick={create} disabled={saving} className="px-4 bg-yellow-400 text-black rounded-xl font-black disabled:opacity-50" title="Add assignment">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 overflow-x-auto">
        {assignments.length === 0 ? (
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No scope assignments yet — staff without one see no students.</p>
        ) : (
          <table className="w-full text-left min-w-[560px]">
            <thead><tr className="border-b border-neutral-800">
              {['Staff', 'Role', 'Department', 'Batch', 'Section', ''].map((h) => <th key={h} className="pb-3 px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">{h}</th>)}
            </tr></thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-b border-neutral-900 text-white text-sm">
                  <td className="py-3 px-3"><p className="font-bold">{a.full_name}</p><p className="text-[10px] text-neutral-500">{a.email}</p></td>
                  <td className="py-3 px-3">{ROLE_LABEL[a.role]}</td>
                  <td className="py-3 px-3">{a.department_code}</td>
                  <td className="py-3 px-3">{a.batch_year ?? 'All'}</td>
                  <td className="py-3 px-3">{a.section ?? 'All'}{a.role === 'sde_coordinator' ? ' (SDE only)' : ''}</td>
                  <td className="py-3 px-3 text-right">
                    <button onClick={() => remove(a.id)} className="text-neutral-500 hover:text-red-400"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
