import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Github, Globe, FileText, Image as ImageIcon, Save, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';

interface StudentProjectFormProps {
  onNavigate?: (route: string) => void;
}

export default function StudentProjectForm({ onNavigate }: StudentProjectFormProps) {
  const [visibility, setVisibility] = useState('draft');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => onNavigate?.('projects')} className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-2 flex items-center gap-1 transition-colors">
            <ChevronLeft size={14} /> Back to Repository
          </button>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Add Project Record</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Document your hackathon submission</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => onNavigate?.('projects')} className="px-6 py-4 bg-black border-2 border-neutral-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors flex items-center justify-center gap-2">
            <Save size={16} /> Save Draft
          </button>
          <button onClick={() => onNavigate?.('projects')} className="px-6 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg">
            <CheckCircle2 size={16} /> Submit for Review
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Overview Section */}
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-8 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-yellow-400" /> Basic Overview
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Project Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. HealthSync Dashboard"
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Linked Hackathon</label>
                  <select className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none">
                    <option>Select Hackathon...</option>
                    <option>Code for Good 2025</option>
                    <option>HealthHack 2024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Participation Type</label>
                  <select className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none">
                    <option>Team</option>
                    <option>Solo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Problem Statement</label>
                <input 
                  type="text" 
                  placeholder="What problem does this solve?"
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Short Description</label>
                <textarea 
                  rows={4}
                  placeholder="Briefly describe your solution..."
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white transition-colors resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Tech Stack (Comma separated)</label>
                <input 
                  type="text" 
                  placeholder="React, Node.js, MongoDB..."
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-8 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <LinkIcon size={18} className="text-yellow-400" /> Links & Resources
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">GitHub Repository</label>
                <div className="relative">
                  <Github size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="url" 
                    placeholder="https://github.com/username/repo"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Live Demo URL (Optional)</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="url" 
                    placeholder="https://my-project.app"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Uploads Section */}
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-8 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <Upload size={18} className="text-yellow-400" /> Media & Documents
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-neutral-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-yellow-400 hover:bg-black/50 transition-all cursor-pointer">
                <ImageIcon size={24} className="text-neutral-500 mb-3" />
                <p className="text-xs font-bold text-white mb-1">Project Poster / Cover</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">PNG, JPG up to 5MB</p>
              </div>

              <div className="border-2 border-dashed border-neutral-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-yellow-400 hover:bg-black/50 transition-all cursor-pointer">
                <FileText size={24} className="text-neutral-500 mb-3" />
                <p className="text-xs font-bold text-white mb-1">Presentation (PPT/PDF)</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">PDF up to 10MB</p>
              </div>

              <div className="border-2 border-dashed border-neutral-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-yellow-400 hover:bg-black/50 transition-all cursor-pointer md:col-span-2">
                <Upload size={24} className="text-neutral-500 mb-3" />
                <p className="text-xs font-bold text-white mb-1">Additional Screenshots / Certificate</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Drag & drop multiple files</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Visibility */}
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6">
            <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Visibility Settings</h3>
            <div className="space-y-3">
              {[
                { id: 'draft', label: 'Draft (Private)', desc: 'Only visible to you and your team.' },
                { id: 'internal', label: 'Internal Review', desc: 'Visible to faculty for grading.' },
                { id: 'public', label: 'Public Showcase', desc: 'Visible on the public gallery.' }
              ].map(opt => (
                <label key={opt.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  visibility === opt.id ? 'border-yellow-400 bg-yellow-400/5' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                }`}>
                  <input 
                    type="radio" 
                    name="visibility" 
                    value={opt.id}
                    checked={visibility === opt.id}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="mt-1 accent-yellow-400"
                  />
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${visibility === opt.id ? 'text-yellow-400' : 'text-white'}`}>{opt.label}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Completeness Checklist */}
          <div className="bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">Completeness</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'Basic details filled', done: true },
                { label: 'GitHub repository linked', done: true },
                { label: 'Tech stack defined', done: false },
                { label: 'Cover image uploaded', done: false },
                { label: 'Presentation attached', done: false }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 size={16} className="text-white" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30"></div>
                  )}
                  <span className={`text-xs font-bold uppercase tracking-widest ${item.done ? 'text-white' : 'text-white/50'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <AlertCircle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Profile is 40% complete</span>
              </div>
              <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
