import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { audit } from '../lib/audit';
import { slugify } from '../lib/slugify';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest } from '../middleware/auth';
import { registrationOwnerSql, studentIdInScopeSql } from '../lib/scope';
import { services } from '../services';

// Behavior unchanged from the original monolithic server/index.ts — moved verbatim into its own
// module, with the notification INSERTs for hackathon interest routed through
// services.notifications.notify() instead of a raw query (see Phase 1.5 Part 2/5).
export const hackathonsRoutes = Router();

const publicHackathonStatuses = ['published', 'registration_closed', 'ongoing', 'completed'];
const allHackathonStatuses = ['draft', 'pending_review', 'published', 'registration_closed', 'ongoing', 'completed', 'archived'];
// Categories/organizers/eligibility/timeline are fetched via LATERAL subqueries (one index-backed
// lookup per outer row, planned as part of the same query) instead of N+1 follow-up queries per
// hackathon. bookmarked/interested reuse the existing bool_or-over-LEFT-JOIN pattern.
const hackathonSelect = `SELECT h.*, d.code AS department_code, u.full_name AS coordinator_name,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'approved')::int AS registered_count,
    COUNT(DISTINCT hi.student_id)::int AS interested_count,
    COALESCE(bool_or(hi.student_id = $__viewer__), false) AS interested,
    COALESCE(bool_or(hb.user_id = $__viewer__), false) AS bookmarked,
    COALESCE(cat.categories, '{}') AS categories,
    COALESCE(org.organizers, '{}') AS organizers,
    COALESCE(elig.eligibility, '[]'::jsonb) AS eligibility,
    COALESCE(rounds.timeline, '[]'::jsonb) AS timeline
    FROM hackathons h LEFT JOIN departments d ON d.id = h.organizer_department_id LEFT JOIN users u ON u.id = h.coordinator_id
    LEFT JOIN registrations r ON r.hackathon_id = h.id
    LEFT JOIN hackathon_interests hi ON hi.hackathon_id = h.id
    LEFT JOIN hackathon_bookmarks hb ON hb.hackathon_id = h.id
    LEFT JOIN LATERAL (
      SELECT array_agg(c.name ORDER BY c.name) AS categories
      FROM hackathon_category_links hcl JOIN hackathon_categories c ON c.id = hcl.category_id
      WHERE hcl.hackathon_id = h.id
    ) cat ON true
    LEFT JOIN LATERAL (
      SELECT array_agg(o.name ORDER BY o.name) AS organizers
      FROM hackathon_organizers ho JOIN organizers o ON o.id = ho.organizer_id
      WHERE ho.hackathon_id = h.id
    ) org ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object('year', he.year, 'label', he.label) ORDER BY he.year NULLS LAST, he.label) AS eligibility
      FROM hackathon_eligibility he WHERE he.hackathon_id = h.id
    ) elig ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object('id', hr.id, 'name', hr.name, 'sequence', hr.sequence, 'startsAt', hr.starts_at, 'endsAt', hr.ends_at, 'instructions', hr.instructions) ORDER BY hr.sequence) AS timeline
      FROM hackathon_rounds hr WHERE hr.hackathon_id = h.id
    ) rounds ON true`;
const hackathonGroupBy = `h.id, d.code, u.full_name, cat.categories, org.organizers, elig.eligibility, rounds.timeline`;

hackathonsRoutes.get('/hackathons', authenticate, ah(async (req: AuthRequest, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const statuses = req.user!.role === 'student' ? publicHackathonStatuses : allHackathonStatuses;
  const { rows } = await pool.query(`${hackathonSelect.replace(/\$__viewer__/g, '$3')}
    WHERE h.status = ANY($2) AND (h.title ILIKE $1 OR h.organizer ILIKE $1)
    GROUP BY ${hackathonGroupBy} ORDER BY h.registration_closes_at ASC NULLS LAST`, [`%${search}%`, statuses, req.user!.id]);
  res.json(rows);
}));

hackathonsRoutes.get('/hackathons/:id', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`${hackathonSelect.replace(/\$__viewer__/g, '$2')}
    WHERE h.id = $1
    GROUP BY ${hackathonGroupBy}`, [req.params.id, req.user!.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Hackathon not found.' });
  res.json(rows[0]);
}));

hackathonsRoutes.get('/bookmarks/mine', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`${hackathonSelect.replace(/\$__viewer__/g, '$1')}
    WHERE h.id IN (SELECT hackathon_id FROM hackathon_bookmarks WHERE user_id = $1)
    GROUP BY ${hackathonGroupBy} ORDER BY h.registration_closes_at ASC NULLS LAST`, [req.user!.id]);
  res.json(rows);
}));

hackathonsRoutes.post('/hackathons/:id/bookmark', authenticate, ah(async (req: AuthRequest, res) => {
  await pool.query(`INSERT INTO hackathon_bookmarks (user_id, hackathon_id) VALUES ($1, $2) ON CONFLICT (user_id, hackathon_id) DO NOTHING`, [req.user!.id, req.params.id]);
  await audit(req.user!.id, 'bookmark', 'hackathon', req.params.id);
  res.status(204).end();
}));

hackathonsRoutes.delete('/hackathons/:id/bookmark', authenticate, ah(async (req: AuthRequest, res) => {
  await pool.query('DELETE FROM hackathon_bookmarks WHERE user_id = $1 AND hackathon_id = $2', [req.user!.id, req.params.id]);
  await audit(req.user!.id, 'remove_bookmark', 'hackathon', req.params.id);
  res.status(204).end();
}));

hackathonsRoutes.post('/hackathons', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(3), organizer: z.string().min(2), description: z.string().min(10), mode: z.enum(['online', 'offline', 'hybrid']), registrationClosesAt: z.string().datetime(), minTeamSize: z.number().int().min(1).default(1), maxTeamSize: z.number().int().min(1).default(4), soloAllowed: z.boolean().default(true), domains: z.array(z.string()).default([]), eligibleYears: z.array(z.number().int()).default([]), status: z.enum(['draft', 'published']).default('draft') }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  if (x.maxTeamSize < x.minTeamSize) return res.status(400).json({ error: 'Maximum team size must be at least the minimum.' });
  const { rows } = await pool.query(`INSERT INTO hackathons (title, slug, organizer, coordinator_id, description, mode, registration_closes_at, min_team_size, max_team_size, solo_allowed, domains, eligible_years, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`, [x.title, slugify(x.title), x.organizer, req.user!.id, x.description, x.mode, x.registrationClosesAt, x.minTeamSize, x.maxTeamSize, x.soloAllowed, x.domains, x.eligibleYears, x.status]);
  await audit(req.user!.id, 'create', 'hackathon', rows[0].id);
  res.status(201).json(rows[0]);
}));

hackathonsRoutes.patch('/hackathons/:id', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({
    title: z.string().min(3).optional(),
    organizer: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    shortDescription: z.string().optional(),
    mode: z.enum(['online', 'offline', 'hybrid']).optional(),
    venue: z.string().optional(),
    officialUrl: z.string().url().optional(),
    registrationUrl: z.string().url().optional(),
    communityUrl: z.string().url().optional(),
    bannerImageUrl: z.string().url().optional(),
    brochureUrl: z.string().url().optional(),
    prizePool: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    faq: z.string().optional(),
    rules: z.string().optional(),
    judgingCriteria: z.string().optional(),
    problemStatements: z.string().optional(),
    domains: z.array(z.string()).optional(),
    eligibleYears: z.array(z.number().int()).optional(),
    minTeamSize: z.number().int().min(1).optional(),
    maxTeamSize: z.number().int().min(1).optional(),
    soloAllowed: z.boolean().optional(),
    registrationOpensAt: z.string().datetime().optional(),
    registrationClosesAt: z.string().datetime().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    status: z.enum(allHackathonStatuses as [string, ...string[]]).optional(),
  }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const d = input.data;
  const fields: Record<string, unknown> = {
    title: d.title, organizer: d.organizer, description: d.description, short_description: d.shortDescription,
    mode: d.mode, venue: d.venue, official_url: d.officialUrl, registration_url: d.registrationUrl,
    community_url: d.communityUrl, banner_image_url: d.bannerImageUrl, brochure_url: d.brochureUrl,
    prize_pool: d.prizePool, city: d.city, state: d.state, country: d.country, contact_name: d.contactName,
    contact_email: d.contactEmail, contact_phone: d.contactPhone, faq: d.faq, rules: d.rules,
    judging_criteria: d.judgingCriteria, problem_statements: d.problemStatements, domains: d.domains,
    eligible_years: d.eligibleYears, min_team_size: d.minTeamSize, max_team_size: d.maxTeamSize,
    solo_allowed: d.soloAllowed, registration_opens_at: d.registrationOpensAt, registration_closes_at: d.registrationClosesAt,
    starts_at: d.startsAt, ends_at: d.endsAt, status: d.status,
  };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return res.status(400).json({ error: 'No fields to update.' });
  if ((fields.min_team_size !== undefined || fields.max_team_size !== undefined)) {
    const current = (await pool.query('SELECT min_team_size, max_team_size FROM hackathons WHERE id = $1', [req.params.id])).rows[0];
    if (!current) return res.status(404).json({ error: 'Hackathon not found.' });
    const nextMin = (fields.min_team_size as number | undefined) ?? current.min_team_size;
    const nextMax = (fields.max_team_size as number | undefined) ?? current.max_team_size;
    if (nextMax < nextMin) return res.status(400).json({ error: 'Maximum team size must be at least the minimum.' });
  }
  const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const { rows } = await pool.query(`UPDATE hackathons SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`, [req.params.id, ...entries.map(([, v]) => v)]);
  if (!rows[0]) return res.status(404).json({ error: 'Hackathon not found.' });
  await audit(req.user!.id, 'update', 'hackathon', req.params.id, { fields: Object.keys(Object.fromEntries(entries)) });
  res.json(rows[0]);
}));

// --- Hackathon rounds (timeline) ---
hackathonsRoutes.post('/hackathons/:id/rounds', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ name: z.string().min(1), sequence: z.number().int().min(1), startsAt: z.string().datetime(), endsAt: z.string().datetime().optional(), instructions: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const { rows } = await pool.query(`INSERT INTO hackathon_rounds (hackathon_id, name, sequence, starts_at, ends_at, instructions) VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (hackathon_id, sequence) DO UPDATE SET name = $2, starts_at = $4, ends_at = $5, instructions = $6 RETURNING *`,
    [req.params.id, x.name, x.sequence, x.startsAt, x.endsAt ?? null, x.instructions ?? null]);
  await audit(req.user!.id, 'upsert', 'hackathon_round', rows[0].id, { hackathonId: req.params.id });
  res.status(201).json(rows[0]);
}));

hackathonsRoutes.patch('/hackathons/:id/rounds/:roundId', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ name: z.string().min(1).optional(), sequence: z.number().int().min(1).optional(), startsAt: z.string().datetime().optional(), endsAt: z.string().datetime().nullable().optional(), instructions: z.string().nullable().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const fields: Record<string, unknown> = { name: input.data.name, sequence: input.data.sequence, starts_at: input.data.startsAt, ends_at: input.data.endsAt, instructions: input.data.instructions };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return res.status(400).json({ error: 'No fields to update.' });
  const setClause = entries.map(([key], i) => `${key} = $${i + 3}`).join(', ');
  const { rows } = await pool.query(`UPDATE hackathon_rounds SET ${setClause} WHERE id = $1 AND hackathon_id = $2 RETURNING *`, [req.params.roundId, req.params.id, ...entries.map(([, v]) => v)]);
  if (!rows[0]) return res.status(404).json({ error: 'Round not found.' });
  await audit(req.user!.id, 'update', 'hackathon_round', req.params.roundId, { hackathonId: req.params.id });
  res.json(rows[0]);
}));

hackathonsRoutes.delete('/hackathons/:id/rounds/:roundId', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const result = await pool.query('DELETE FROM hackathon_rounds WHERE id = $1 AND hackathon_id = $2', [req.params.roundId, req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Round not found.' });
  await audit(req.user!.id, 'delete', 'hackathon_round', req.params.roundId, { hackathonId: req.params.id });
  res.status(204).end();
}));

// --- Categories & organizers: shared taxonomy tables, linked per hackathon ---
hackathonsRoutes.get('/categories', authenticate, ah(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM hackathon_categories ORDER BY name');
  res.json(rows);
}));

hackathonsRoutes.post('/categories', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ name: z.string().min(2) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const { rows } = await pool.query(`INSERT INTO hackathon_categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING *`, [input.data.name]);
  await audit(req.user!.id, 'create', 'hackathon_category', rows[0].id);
  res.status(201).json(rows[0]);
}));

hackathonsRoutes.put('/hackathons/:id/categories', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ categoryIds: z.array(z.string().uuid()) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM hackathon_category_links WHERE hackathon_id = $1', [req.params.id]);
    for (const categoryId of input.data.categoryIds) {
      await client.query('INSERT INTO hackathon_category_links (hackathon_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, categoryId]);
    }
    await client.query('COMMIT');
    await audit(req.user!.id, 'update', 'hackathon_categories', req.params.id, { categoryIds: input.data.categoryIds });
    res.status(204).end();
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

hackathonsRoutes.get('/organizers', authenticate, ah(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM organizers ORDER BY name');
  res.json(rows);
}));

hackathonsRoutes.post('/organizers', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ name: z.string().min(2) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const { rows } = await pool.query(`INSERT INTO organizers (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING *`, [input.data.name]);
  await audit(req.user!.id, 'create', 'organizer', rows[0].id);
  res.status(201).json(rows[0]);
}));

hackathonsRoutes.put('/hackathons/:id/organizers', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ organizerIds: z.array(z.string().uuid()) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM hackathon_organizers WHERE hackathon_id = $1', [req.params.id]);
    for (const organizerId of input.data.organizerIds) {
      await client.query('INSERT INTO hackathon_organizers (hackathon_id, organizer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, organizerId]);
    }
    await client.query('COMMIT');
    await audit(req.user!.id, 'update', 'hackathon_organizers', req.params.id, { organizerIds: input.data.organizerIds });
    res.status(204).end();
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

// --- Eligibility: replace-the-set semantics match a multi-select edit form directly. ---
hackathonsRoutes.put('/hackathons/:id/eligibility', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ years: z.array(z.number().int().min(1).max(8)).default([]), labels: z.array(z.string().min(1)).default([]) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM hackathon_eligibility WHERE hackathon_id = $1', [req.params.id]);
    for (const year of input.data.years) {
      await client.query('INSERT INTO hackathon_eligibility (hackathon_id, year) VALUES ($1, $2)', [req.params.id, year]);
    }
    for (const label of input.data.labels) {
      await client.query('INSERT INTO hackathon_eligibility (hackathon_id, label) VALUES ($1, $2)', [req.params.id, label]);
    }
    await client.query('COMMIT');
    await audit(req.user!.id, 'update', 'hackathon_eligibility', req.params.id, { years: input.data.years, labels: input.data.labels });
    res.status(204).end();
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

hackathonsRoutes.get('/hackathons/:id/registrations', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT r.*, s.full_name AS student_name, s.email AS student_email, t.name AS team_name
    FROM registrations r LEFT JOIN users s ON s.id = r.student_id LEFT JOIN teams t ON t.id = r.team_id
    WHERE r.hackathon_id = $1 AND ${studentIdInScopeSql(req.user!.role, '$2', registrationOwnerSql('r'))}
    ORDER BY r.created_at DESC`, [req.params.id, req.user!.id]);
  res.json(rows);
}));

hackathonsRoutes.post('/hackathons/:id/interest', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  await pool.query(`INSERT INTO hackathon_interests (hackathon_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [req.params.id, req.user!.id]);
  await services.notifications.notify({ recipientId: req.user!.id, type: 'interest', title: 'Hackathon interest saved', body: 'We will keep you updated about this hackathon.', actionUrl: `/hackathons/${req.params.id}` });
  await audit(req.user!.id, 'express_interest', 'hackathon', req.params.id);
  res.status(204).end();
}));

hackathonsRoutes.delete('/hackathons/:id/interest', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  await pool.query('DELETE FROM hackathon_interests WHERE hackathon_id = $1 AND student_id = $2', [req.params.id, req.user!.id]);
  await audit(req.user!.id, 'remove_interest', 'hackathon', req.params.id);
  res.status(204).end();
}));
