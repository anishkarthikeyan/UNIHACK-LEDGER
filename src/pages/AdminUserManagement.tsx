import React, { useState } from 'react';
import { Search, Filter, UserCheck, UserX, Shield, FileEdit, MoreVertical } from 'lucide-react';

export default function AdminUserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const users = [
    { id: '1', name: 'Anish K.', uid: 'ST-4091', email: 'anish.k@univ.edu', role: 'Student', dept: 'CSE', year: '3rd Year', status: 'Active', lastLogin: '2 hrs ago' },
    { id: '2', name: 'Dr. Meena R.', uid: 'FA-102', email: 'meena.r@univ.edu', role: 'Faculty', dept: 'CSE', year: 'Associate Prof', status: 'Active', lastLogin: '5 hrs ago' },
    { id: '3', name: 'Rahul M.', uid: 'ST-4102', email: 'rahul.m@univ.edu', role: 'Student', dept: 'IT', year: '2nd Year', status: 'Active', lastLogin: '1 day ago' },
    { id: '4', name: 'Priya R.', uid: 'ST-3921', email: 'priya.r@univ.edu', role: 'Student', dept: 'ECE', year: '4th Year', status: 'Inactive', lastLogin: '2 weeks ago' },
    { id: '5', name: 'Dr. Suresh V.', uid: 'FA-105', email: 'suresh.v@univ.edu', role: 'Faculty', dept: 'IT', year: 'Professor', status: 'Active', lastLogin: '3 days ago' },
    { id: '6', name: 'Admin One', uid: 'AD-001', email: 'admin@univ.edu', role: 'Admin', dept: 'Central', year: 'System', status: 'Active', lastLogin: 'Just now' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">User Management</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Registry & Role Control</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="px-6 py-3 bg-neutral-900 border-2 border-neutral-800 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:border-yellow-400 transition-colors shrink-0">
            Bulk Import CSV
          </button>
          <button className="px-6 py-3 bg-neutral-900 text-white-TMP rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-95 transition-transform shrink-0">
            + Add User
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
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
        <button className="px-6 py-3 bg-neutral-900 border-2 border-neutral-800 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:border-yellow-400 transition-colors flex items-center gap-2">
          <Filter size={14} /> Filters
        </button>
      </div>

      <div className="flex-1 bg-black rounded-[32px] border-4 border-neutral-800 overflow-hidden flex flex-col shadow-xl">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-900 border-b-2 border-neutral-800 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Name & ID</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department & Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-900 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-black text-white">{user.name}</p>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{user.uid} • {user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      user.role === 'Admin' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                      user.role === 'Faculty' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                      'bg-yellow-400/20 text-yellow-600 border border-yellow-400/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{user.dept}</p>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{user.year}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${
                      user.status === 'Active' ? 'text-green-500' : 'text-neutral-400'
                    }`}>
                      {user.status === 'Active' ? <UserCheck size={14} /> : <UserX size={14} />}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-neutral-500 text-xs">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors" title="Edit Account">
                        <FileEdit size={16} />
                      </button>
                      <button className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors" title="Change Role">
                        <Shield size={16} />
                      </button>
                      <button className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Showing 1-6 of 1,420 users</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">Previous</button>
            <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
