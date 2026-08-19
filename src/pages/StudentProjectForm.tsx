import React, { useEffect, useState } from 'react';
import { Link as LinkIcon, Github, Globe, FileText, Image as ImageIcon, Save, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Hackathon, Team } from '../types';
import type { NavigateFn } from '../App';

interface StudentProjectFormProps {
  onNavigate?: NavigateFn;
}

export default function StudentProjectForm({ onNavigate }: StudentProjectFormProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [title, setTitle] = useState('');
  const [hackathonId, setHackathonId] = useState('');
  const [participationMode, setParticipationMode] = useState<'solo' | 'team'>('solo');
  const [teamId, setTeamId] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'institution' | 'public'>('private');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.hackathons.list(), api.teams.mine()])
      .then(([h, t]) => { setHackathons(h); setTeams(t); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load form data.'));
  }, []);

  const complete = {
    basics: title.trim().length > 1 && problemStatement.trim().length > 5 && description.trim().length > 5,
    github: Boolean(githubUrl),
    tech: techStack.trim().length > 0,
    poster: Boolean(posterUrl),
    presentation: Boolean(presentationUrl),
  };
  const completePct = Math.round((Object.values(complete).filter(Boolean).length / Object.keys(complete).length) * 100);

  // Takes the target visibility as a parameter rather than reading the `visibility` state,
  // because the Save Draft / Submit for Review buttons below call setVisibility(...) and this
  // function in the same click handler — React state updates aren't synchronous, so reading
  // `visibility` here would still see the value from the previous render, not the one just set.
  const submit = async (targetVisibility: 'private' | 'institution' | 'public') => {
    if (!title.trim() || problemStatement.trim().length < 10 || description.trim().length < 10) {
      setError('Title, problem statement (min 10 chars), and description (min 10 chars) are required.');
      return;
    }
    if (participationMode === 'team' && !teamId) {
      setError('Select a team, or switch to solo participation.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setVisibility(targetVisibility);
    try {
      await api.projects.create({
        title: title.trim(),
        problemStatement: problemStatement.trim(),
        description: description.trim(),
        participationMode,
        hackathonId: hackathonId || undefined,
        teamId: participationMode === 'team' ? teamId : undefined,
        techStack: techStack.split(',').map((t) => t.trim()).filter(Boolean),
        githubUrl: githubUrl || undefined,
        demoUrl: demoUrl || undefined,
        posterUrl: posterUrl || undefined,
        presentationUrl: presentationUrl || undefined,
        visibility: targetVisibility,
      });
      onNavigate?.('projects');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => onNavigate?.('projects')} className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-2 flex items-center gap-1 transition-colors">
            <ChevronLeft size={14} /> Back to Repository
          </button>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white break-words">Add Project Record</h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Document your hackathon submission</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => submit('private')} disabled={submitting} className="px-6 py-4 bg-black border-2 border-neutral-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            <Save size={16} /> Save Draft
          </button>
          <button onClick={() => submit('public')} disabled={submitting} className="px-6 py-4 bg-yellow-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg disabled:opacity-60">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Submit for Review
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-8 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-yellow-400" /> Basic Overview
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Project Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HealthSync Dashboard" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Linked Hackathon</label>
                  <select value={hackathonId} onChange={(e) => setHackathonId(e.target.value)} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none">
                    <option value="">No linked hackathon</option>
                    {hackathons.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Participation Type</label>
                  <select value={participationMode} onChange={(e) => setParticipationMode(e.target.value as 'solo' | 'team')} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none">
                    <option value="solo">Solo</option>
                    <option value="team">Team</option>
                  </select>
                </div>
              </div>

              {participationMode === 'team' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Team</label>
                  <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors appearance-none">
                    <option value="">Choose a team...</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Problem Statement</label>
                <input type="text" value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="What problem does this solve?" className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Short Description</label>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe your solution..." className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white transition-colors resize-none"></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Tech Stack (Comma separated)</label>
                <input type="text" value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="React, Node.js, MongoDB..." className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-8 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <LinkIcon size={18} className="text-yellow-400" /> Links & Resources
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">GitHub Repository</label>
                <div className="relative">
                  <Github size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username/repo" className="w-full pl-12 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Live Demo URL (Optional)</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://my-project.app" className="w-full pl-12 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Poster / Cover Image URL (Optional)</label>
                <div className="relative">
                  <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input type="url" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="https://drive.google.com/..." className="w-full pl-12 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Presentation URL (Optional)</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input type="url" value={presentationUrl} onChange={(e) => setPresentationUrl(e.target.value)} placeholder="https://drive.google.com/..." className="w-full pl-12 pr-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl focus:border-yellow-400 outline-none text-sm text-white font-bold transition-colors font-mono" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6">
            <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Visibility Settings</h3>
            <div className="space-y-3">
              {[
                { id: 'private', label: 'Draft (Private)', desc: 'Only visible to you and your team.' },
                { id: 'institution', label: 'Internal Review', desc: 'Visible to faculty for grading.' },
                { id: 'public', label: 'Public Showcase', desc: 'Visible on the public gallery.' },
              ].map((opt) => (
                <label key={opt.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  visibility === opt.id ? 'border-yellow-400 bg-yellow-400/5' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                }`}>
                  <input type="radio" name="visibility" value={opt.id} checked={visibility === opt.id} onChange={(e) => setVisibility(e.target.value as 'private' | 'institution' | 'public')} className="mt-1 accent-yellow-400" />
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${visibility === opt.id ? 'text-yellow-400' : 'text-white'}`}>{opt.label}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">Completeness</h3>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Basic details filled', done: complete.basics },
                { label: 'GitHub repository linked', done: complete.github },
                { label: 'Tech stack defined', done: complete.tech },
                { label: 'Cover image linked', done: complete.poster },
                { label: 'Presentation linked', done: complete.presentation },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.done ? <CheckCircle2 size={16} className="text-white" /> : <div className="w-4 h-4 rounded-full border-2 border-white/30"></div>}
                  <span className={`text-xs font-bold uppercase tracking-widest ${item.done ? 'text-white' : 'text-white/50'}`}>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest">Profile is {completePct}% complete</span>
              </div>
              <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${completePct}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
