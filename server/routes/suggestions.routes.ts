import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { audit } from '../lib/audit';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest } from '../middleware/auth';
import { services } from '../services';

// Behavior unchanged from the original monolithic server/index.ts — moved verbatim, plus an
// in-app notification to the submitter on review (Phase 7). No email here — suggestion review
// isn't in the required email trigger list (registration/approval/reminder/password-reset).
export const suggestionsRoutes = Router();

suggestionsRoutes.post('/suggestions', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(2), organizer: z.string().min(2), officialUrl: z.string().url(), description: z.string().min(10), registrationDeadline: z.string().date().optional(), eventDateText: z.string().optional(), domain: z.string().optional(), mode: z.string().optional(), tags: z.array(z.string()).default([]) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const { rows } = await pool.query('INSERT INTO hackathon_suggestions (submitted_by, title, organizer, official_url, description, registration_deadline, event_date_text, domain, mode, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *', [req.user!.id, x.title, x.organizer, x.officialUrl, x.description, x.registrationDeadline ?? null, x.eventDateText ?? null, x.domain ?? null, x.mode ?? null, x.tags]);
  await audit(req.user!.id, 'create', 'hackathon_suggestion', rows[0].id);
  res.status(201).json(rows[0]);
}));

suggestionsRoutes.get('/suggestions', authenticate, allow('faculty', 'admin'), ah(async (req, res) => {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : null;
  const { rows } = await pool.query(`SELECT s.*, u.full_name AS submitted_by_name FROM hackathon_suggestions s
    JOIN users u ON u.id = s.submitted_by WHERE ($1::text IS NULL OR s.status::text = $1) ORDER BY s.created_at DESC`, [statusFilter]);
  res.json(rows);
}));

suggestionsRoutes.patch('/suggestions/:id', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ status: z.enum(['under_review', 'approved', 'rejected']), reviewNotes: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const { rows } = await pool.query(`UPDATE hackathon_suggestions SET status = $2, reviewed_by = $3, reviewed_at = now(), review_notes = $4 WHERE id = $1 RETURNING *`,
    [req.params.id, input.data.status, req.user!.id, input.data.reviewNotes ?? null]);
  if (!rows[0]) return res.status(404).json({ error: 'Suggestion not found.' });
  await audit(req.user!.id, 'review', 'hackathon_suggestion', req.params.id, { status: input.data.status });

  await services.notifications.notify({
    recipientId: rows[0].submitted_by, type: 'suggestion_reviewed',
    title: `Suggested hackathon ${input.data.status.replace('_', ' ')}`,
    body: `Your suggestion "${rows[0].title}" was ${input.data.status.replace('_', ' ')}${input.data.reviewNotes ? `: ${input.data.reviewNotes}` : '.'}`,
    actionUrl: '/suggest',
  });

  res.json(rows[0]);
}));
