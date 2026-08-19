import React, { useEffect, useState } from 'react';
import { Save, Shield, Calendar, Briefcase, Loader2, CheckCircle2, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Department } from '../types';

export default function AdminSystemSettings() {
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [defaultSemester, setDefaultSemester] = useState('even');
  const [roleEscalationConfirmation, setRoleEscalationConfirmation] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.admin.settings(), api.admin.departments()])
      .then(([settings, depts]) => {
        if (typeof settings.academic_year === 'string') setAcademicYear(settings.academic_year);
        if (typeof settings.default_semester === 'string') setDefaultSemester(settings.default_semester);
        if (typeof settings.role_escalation_confirmation === 'boolean') setRoleEscalationConfirmation(settings.role_escalation_confirmation);
        setDepartments(depts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load settings.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.admin.updateSettings({
        academic_year: academicYear,
        default_semester: defaultSemester,
        role_escalation_confirmation: roleEscalationConfirmation,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const addDepartment = async () => {
    if (!newDeptCode.trim() || !newDeptName.trim()) return;
    try {
      await api.admin.createDepartment(newDeptCode.trim().toUpperCase(), newDeptName.trim());
      setNewDeptCode(''); setNewDeptName(''); setShowAddDept(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add department.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">System Settings</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Platform-Wide Configuration & Policies</p>
        </div>
        <div className="flex items-center gap-4">
          {saved && <span className="text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={14} /> Saved</span>}
          <button onClick={save} disabled={saving} className="px-8 py-4 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-95 transition-transform flex items-center gap-2 shadow-lg disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 p-8 overflow-y-auto shadow-xl">
        <div className="max-w-4xl space-y-12">
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2 border-b-2 border-neutral-800 pb-4">
              <Calendar size={24} className="text-neutral-400" /> Academic Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Current Academic Year</label>
                <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 font-bold appearance-none">
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Default Semester</label>
                <select value={defaultSemester} onChange={(e) => setDefaultSemester(e.target.value)} className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 font-bold appearance-none">
                  <option value="odd">Odd Semester</option>
                  <option value="even">Even Semester</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2 border-b-2 border-neutral-800 pb-4">
              <Shield size={24} className="text-neutral-400" /> Governance & Security
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl cursor-pointer hover:border-yellow-400 transition-colors">
                <input type="checkbox" checked={roleEscalationConfirmation} onChange={(e) => setRoleEscalationConfirmation(e.target.checked)} className="w-5 h-5 accent-yellow-400" />
                <div>
                  <p className="font-bold text-white">Require confirmation for role escalation</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mt-1">When on, promoting a user to Faculty or Admin in User Management requires an extra confirmation step</p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2 border-b-2 border-neutral-800 pb-4">
              <Briefcase size={24} className="text-neutral-400" /> Department Master List
            </h2>
            <div className="space-y-3">
              {departments.map((dept) => (
                <div key={dept.id} className="flex justify-between items-center p-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl">
                  <p className="font-bold text-white">{dept.name} ({dept.code})</p>
                </div>
              ))}
              {showAddDept ? (
                <div className="p-4 bg-neutral-900 border-2 border-yellow-400 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">New Department</span>
                    <button onClick={() => setShowAddDept(false)} className="text-neutral-500 hover:text-white"><X size={16} /></button>
                  </div>
                  <input value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} placeholder="Code (e.g. MECH)" className="w-full p-3 bg-black border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold" />
                  <input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="Full name" className="w-full p-3 bg-black border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold" />
                  <button onClick={addDepartment} className="w-full py-3 bg-yellow-400 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform">Add Department</button>
                </div>
              ) : (
                <button onClick={() => setShowAddDept(true)} className="w-full p-4 bg-transparent border-2 border-dashed border-neutral-700 rounded-2xl text-neutral-500 font-bold uppercase tracking-widest text-[10px] hover:border-white hover:text-white transition-colors">
                  + Add New Department
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
