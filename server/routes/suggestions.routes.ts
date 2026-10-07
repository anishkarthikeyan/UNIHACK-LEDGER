import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { audit } from '../lib/audit';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest } from '../middleware/auth';
import { isUuid } from '../lib/validation';
import { canAccessStudent, studentIdInScopeSql } from '../lib/scope';
import { services } from '../services';
import { notifyStaffCovering } from '../lib/staffNotify';
import { slugify } from '../lib/slugify';

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

  // The submitting student's own Faculty Advisor(s) review it.
  const student = (await pool.query(`SELECT u.full_name, u.institutional_id, sp.section FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.id WHERE u.id = $1`, [req.user!.id])).rows[0];
  await notifyStaffCovering([req.user!.id], ['faculty'], {
    type: 'suggestion_submitted', title: 'New hackathon suggestion',
    body: `${student?.full_name ?? 'A student'} (${student?.institutional_id ?? ''}${student?.section ? `, Section ${student.section}` : ''}) suggested "${x.title}" by ${x.organizer}. Review it under Review & Verify.`,
    actionUrl: '/review',
  });
  res.status(201).json(rows[0]);
}));

suggestionsRoutes.get('/suggestions', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : null;
  const { rows } = await pool.query(`SELECT s.*, u.full_name AS submitted_by_name, u.institutional_id AS submitted_by_reg_no, sp.section AS submitted_by_section
    FROM hackathon_suggestions s JOIN users u ON u.id = s.submitted_by LEFT JOIN student_profiles sp ON sp.user_id = u.id WHERE ($1::text IS NULL OR s.status::text = $1)
    AND ${studentIdInScopeSql(req.user!.role, '$2', 's.submitted_by')} ORDER BY s.created_at DESC`, [statusFilter, req.user!.id]);
  res.json(rows);
}));

suggestionsRoutes.patch('/suggestions/:id', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id.' });
  const target = (await pool.query('SELECT submitted_by FROM hackathon_suggestions WHERE id = $1', [req.params.id])).rows[0];
  if (!target || !(await canAccessStudent(req.user!, target.submitted_by))) return res.status(404).json({ error: 'Suggestion not found.' });
  const input = z.object({ status: z.enum(['under_review', 'approved', 'rejected']), reviewNotes: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const client = await pool.connect();
  let rows;
  let createdHackathonId: string | null = null;
  try {
    await client.query('BEGIN');
    ({ rows } = await client.query(`UPDATE hackathon_suggestions SET status = $2, reviewed_by = $3, reviewed_at = now(), review_notes = $4 WHERE id = $1 RETURNING *`,
      [req.params.id, input.data.status, req.user!.id, input.data.reviewNotes ?? null]));
    // Approving a suggestion adds it to the catalogue: a published hackathon every student,
    // faculty member and the HOD sees in Explore. Only once — re-approving reuses it.
    if (rows[0] && input.data.status === 'approved' && !rows[0].hackathon_id) {
      createdHackathonId = await createHackathonFromSuggestion(client, rows[0], req.user!.id);
      rows[0].hackathon_id = createdHackathonId;
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  if (!rows[0]) return res.status(404).json({ error: 'Suggestion not found.' });
  await audit(req.user!.id, 'review', 'hackathon_suggestion', req.params.id, { status: input.data.status });
  if (createdHackathonId) await audit(req.user!.id, 'create', 'hackathon', createdHackathonId, { fromSuggestion: req.params.id });

  await services.notifications.notify({
    recipientId: rows[0].submitted_by, type: 'suggestion_reviewed',
    title: `Suggested hackathon ${input.data.status.replace('_', ' ')}`,
    body: `Your suggestion "${rows[0].title}" was ${input.data.status.replace('_', ' ')}${input.data.reviewNotes ? `: ${input.data.reviewNotes}` : '.'}${createdHackathonId ? ' It is now listed in Explore Hackathons.' : ''}`,
    actionUrl: '/suggest',
  });

  res.json(rows[0]);
}));

const MODES = ['online', 'offline', 'hybrid'];

async function createHackathonFromSuggestion(client: import('pg').PoolClient, s: {
  id: string; title: string; organizer: string; official_url: string; description: string | null; registration_deadline: string | Date | null;
  domain: string | null; mode: string | null; tags: string[]; prize_pool: string | null;
}, reviewerId: string): Promise<string> {
  const mode = MODES.includes((s.mode ?? '').toLowerCase()) ? s.mode!.toLowerCase() : 'hybrid';
  const deadline = s.registration_deadline
    ? `${(s.registration_deadline instanceof Date ? s.registration_deadline.toISOString() : String(s.registration_deadline)).slice(0, 10)}T23:59:59+05:30`
    : null;
  const description = s.description && s.description.length >= 10 ? s.description : `${s.title} by ${s.organizer}. Suggested by a student and approved by faculty.`;
  const { rows } = await client.query(`INSERT INTO hackathons (title, slug, organizer, coordinator_id, description, mode, official_url, registration_url,
      registration_closes_at, min_team_size, max_team_size, solo_allowed, domains, prize_pool, status, source)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, 1, 4, true, $9, $10, 'published', 'student_suggestion') RETURNING id`,
    [s.title, `${slugify(s.title)}-${s.id.slice(0, 8)}`, s.organizer, reviewerId, description, mode, s.official_url, deadline,
      [s.domain, ...s.tags].filter((d): d is string => Boolean(d)), s.prize_pool]);
  await client.query('UPDATE hackathon_suggestions SET hackathon_id = $2 WHERE id = $1', [s.id, rows[0].id]);
  return rows[0].id;
}
