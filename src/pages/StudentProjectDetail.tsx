import React, { useEffect, useState } from 'react';
import { ChevronLeft, FileEdit, Github, Globe, FileText, Image as ImageIcon, MessageSquare, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Project } from '../types';
import type { NavigateFn } from '../App';

interface StudentProjectDetailProps {
  onNavigate?: NavigateFn;
  projectId?: string;
}

export default function StudentProjectDetail({ onNavigate, projectId }: StudentProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    api.projects.get(projectId)
      .then(setProject)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load project.'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <button onClick={() => onNavigate?.('projects')} className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 flex items-center gap-1 transition-colors">
          <ChevronLeft size={14} /> Back to Repository
        </button>
        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">{error ?? 'Project not found.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-neutral-800 pb-8">
        <div>
          <button
            onClick={() => onNavigate?.('projects')}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Repository
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white">{project.title}</h1>
            <span className="px-3 py-1 bg-yellow-400 text-white font-bold uppercase tracking-widest text-[10px] rounded-full border border-yellow-500">
              {project.visibility}
            </span>
            <span className="px-3 py-1 bg-neutral-800 text-white font-bold uppercase tracking-widest text-[10px] rounded-full border border-neutral-700">
              {project.participation_mode} Project
            </span>
          </div>
          <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest">{project.hackathon_title ?? project.team_name ?? 'Independent project'}</p>
        </div>

        <div className="flex gap-3">
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noreferrer" className="px-6 py-3 bg-black border-2 border-neutral-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:border-yellow-400 transition-colors flex items-center justify-center gap-2">
              <ExternalLink size={16} /> View Public
            </a>
          )}
          <button
            onClick={() => onNavigate?.('project-add')}
            className="px-6 py-3 bg-neutral-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
          >
            <FileEdit size={16} /> Edit Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {project.poster_url ? (
            <div className="w-full h-64 md:h-80 bg-black border-4 border-neutral-800 rounded-[32px] overflow-hidden relative">
              <img src={project.poster_url} alt={project.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-40 bg-black border-4 border-neutral-800 rounded-[32px] flex items-center justify-center text-neutral-700">
              <ImageIcon size={40} />
            </div>
          )}

          <div className="space-y-6 text-white">
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Problem Statement</h2>
              <p className="text-sm leading-relaxed bg-black p-6 rounded-2xl border-l-4 border-yellow-400">{project.problem_statement}</p>
            </section>

            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Solution Description</h2>
              <p className="text-sm leading-relaxed text-neutral-300">{project.description}</p>
            </section>

            {project.tech_stack.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-3">Tech Stack</h2>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((tech) => (
                    <span key={tech} className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-yellow-400 rounded-[32px] p-6 text-white border-4 border-yellow-500 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">Faculty Review</h3>
            </div>
            {project.latest_review ? (
              <div className="bg-black/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className={project.latest_review.status === 'approved' ? 'text-green-700' : project.latest_review.status === 'rejected' ? 'text-red-700' : 'text-neutral-700'} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{project.latest_review.status.replace(/_/g, ' ')}</span>
                  {project.latest_review.score != null && <span className="text-[10px] font-black uppercase tracking-widest ml-auto">{project.latest_review.score}/100</span>}
                </div>
                {project.latest_review.feedback && (
                  <p className="text-sm font-medium leading-relaxed">"{project.latest_review.feedback}"</p>
                )}
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-4">
                  — {project.latest_review.reviewer_name} ({new Date(project.latest_review.created_at).toLocaleDateString()})
                </p>
              </div>
            ) : (
              <div className="bg-black/5 rounded-2xl p-4 border border-white/10">
                <p className="text-sm font-medium leading-relaxed text-white/80">No faculty feedback yet.</p>
              </div>
            )}
          </div>

          <div className="bg-black rounded-[32px] border-4 border-neutral-800 p-6 space-y-6">
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm text-white mb-4">Project Links</h3>
              <div className="space-y-3">
                {project.github_url && (
                  <a href={project.github_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-yellow-400 transition-colors group">
                    <div className="flex items-center gap-3 text-white">
                      <Github size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
                      <span className="text-xs font-bold font-mono truncate max-w-[180px]">{project.github_url}</span>
                    </div>
                    <ExternalLink size={14} className="text-neutral-500" />
                  </a>
                )}
                {project.demo_url && (
                  <a href={project.demo_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-yellow-400 transition-colors group">
                    <div className="flex items-center gap-3 text-white">
                      <Globe size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
                      <span className="text-xs font-bold font-mono truncate max-w-[180px]">{project.demo_url}</span>
                    </div>
                    <ExternalLink size={14} className="text-neutral-500" />
                  </a>
                )}
                {project.presentation_url && (
                  <a href={project.presentation_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-yellow-400 transition-colors group">
                    <div className="flex items-center gap-3 text-white">
                      <FileText size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
                      <span className="text-xs font-bold font-mono truncate max-w-[180px]">{project.presentation_url}</span>
                    </div>
                    <ExternalLink size={14} className="text-neutral-500" />
                  </a>
                )}
                {!project.github_url && !project.demo_url && !project.presentation_url && (
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No links added yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-6">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-neutral-500">Created</span>
              <span className="text-white">{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-neutral-500">Last Updated</span>
              <span className="text-white">{new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-neutral-500">Visibility</span>
              <span className="text-yellow-400 flex items-center gap-1"><Globe size={12} /> {project.visibility}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
