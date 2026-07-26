import React, { useEffect, useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Project } from '../types';

export default function FacultyProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'changes_requested' | 'rejected'>('approved');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewScore, setReviewScore] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.projects.all()
      .then((rows) => { setProjects(rows); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load projects.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = projects.filter((p) =>
    !searchTerm ||
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.hackathon_title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.team_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openReview = (id: string) => {
    setReviewingId(id);
    setReviewStatus('approved');
    setReviewFeedback('');
    setReviewScore('');
  };

  const submitReview = async () => {
    if (!reviewingId) return;
    setSubmitting(true);
    try {
      await api.projects.review(reviewingId, { status: reviewStatus, feedback: reviewFeedback || undefined, score: reviewScore ? Number(reviewScore) : undefined });
      setReviewingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Projects</h1>
          <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold mt-2">Review submitted hackathon projects</p>
        </div>
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-black border-2 border-neutral-800 rounded-full text-sm font-bold focus:border-yellow-400 outline-none transition-colors text-white"
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>}

      {filtered.length === 0 ? (
        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center py-16">No projects found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((proj) => (
            <div key={proj.id} className="bg-black border-4 border-neutral-800 rounded-3xl p-6 relative flex flex-col group hover:border-yellow-400 transition-colors">
              <h3 className="text-xl font-black text-white mb-1">{proj.title}</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">{proj.hackathon_title ?? 'Independent'}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Team / Owner</p>
                  <p className="text-sm font-bold text-white">{proj.team_name ?? proj.owner_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Updated</p>
                  <p className="text-sm font-bold text-white">{new Date(proj.updated_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-neutral-800 flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  proj.review_status === 'approved' ? 'bg-yellow-400/20 text-yellow-500 border border-yellow-400/20' :
                  proj.review_status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  proj.review_status === 'changes_requested' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  'bg-neutral-700/50 text-neutral-400'
                }`}>
                  {proj.review_status ? proj.review_status.replace(/_/g, ' ') : 'Not reviewed'}
                </span>
                <button onClick={() => openReview(proj.id)} className="px-4 py-2 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-95 transition-transform">
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border-4 border-neutral-800 rounded-[32px] p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Submit Review</h2>
              <button onClick={() => setReviewingId(null)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Decision</label>
                <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as typeof reviewStatus)} className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors appearance-none">
                  <option value="approved">Approve</option>
                  <option value="changes_requested">Request Changes</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Score (Optional, 0-100)</label>
                <input value={reviewScore} onChange={(e) => setReviewScore(e.target.value)} type="number" min={0} max={100} className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-bold transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Feedback</label>
                <textarea value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} rows={4} className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-white outline-none focus:border-yellow-400 text-sm font-medium transition-colors resize-none" placeholder="Feedback for the student..."></textarea>
              </div>
              <button onClick={submitReview} disabled={submitting} className="w-full py-4 mt-2 bg-yellow-400 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <Loader2 size={14} className="animate-spin" />} Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
