import React, { useEffect, useState } from 'react';
import { Search, Mail, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Student } from '../types';

export default function FacultyParticipants() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      api.students.list(searchTerm)
        .then((rows) => { setStudents(rows); setError(null); })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load participants.'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Participants</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Manage and view student profiles</p>
        </div>
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-3 bg-black border-2 border-neutral-800 rounded-full text-sm font-bold focus:border-yellow-400 outline-none transition-colors text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500"><Loader2 className="animate-spin" /></div>
        ) : students.length === 0 ? (
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-800/50 text-neutral-500 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-b border-neutral-800">Student Name</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Department</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Hackathons</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-center">Projects</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-right">Contact</th>
                </tr>
              </thead>
              <tbody>
                {students.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-800 hover:bg-neutral-900 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-white">{p.full_name}</p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">{p.year_of_study ? `Year ${p.year_of_study}` : ''} {p.institutional_id}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-400">{p.department_code ?? '—'}</td>
                    <td className="px-6 py-4 text-center font-black text-white">{p.hackathon_count}</td>
                    <td className="px-6 py-4 text-center font-black text-white">{p.project_count}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a href={`mailto:${p.email}`} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors inline-flex">
                          <Mail size={16} />
                        </a>
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
  );
}
