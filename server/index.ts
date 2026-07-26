import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { z } from 'zod';

const app = express();
const port = Number(process.env.API_PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? 'local-development-secret-change-me';
// Use IPv4 loopback explicitly: on some macOS setups `localhost` resolves to a separate local PostgreSQL service instead of Docker's published port.
const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://unihack:unihack_local_password@127.0.0.1:5433/unihack_ledger' });

type Role = 'student' | 'faculty' | 'admin';
type AuthRequest = Request & { user?: { id: string; role: Role } };

app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') ?? true }));
app.use(express.json({ limit: '1mb' }));

// Express 4 does not catch rejected promises thrown from async route handlers; without this,
// any failed query would crash the process instead of returning a 500.
function ah(fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => { fn(req, res, next).catch(next); };
}

function slugify(value: string) {
  return `${value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;
}

function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try { req.user = jwt.verify(token, jwtSecret) as { id: string; role: Role }; next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired token.' }); }
}

function allow(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission for this action.' });
    next();
  };
}

async function audit(actorId: string | undefined, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  await pool.query('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)', [actorId ?? null, action, entityType, entityId ?? null, metadata]);
}

app.get('/health', ah(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
}));

app.post('/auth/login', ah(async (req, res) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A valid email and password are required.' });
  const { rows } = await pool.query('SELECT id, email, password_hash, full_name, role, institutional_id, status FROM users WHERE lower(email) = lower($1)', [input.data.email]);
  const user = rows[0];
  if (!user || user.status !== 'active' || !user.password_hash || !(await bcrypt.compare(input.data.password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password.' });
  await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
  await audit(user.id, 'login', 'user', user.id);
  const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.full_name, role: user.role, institutionalId: user.institutional_id } });
}));

app.get('/auth/me', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT u.id, u.institutional_id, u.email, u.full_name, u.role, u.status, u.avatar_url,
    sp.programme, sp.year_of_study, sp.interests, sp.tech_stack, sp.phone AS student_phone,
    fp.designation, fp.phone AS faculty_phone
    FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.id LEFT JOIN faculty_profiles fp ON fp.user_id = u.id
    WHERE u.id = $1`, [req.user!.id]);
  res.json(rows[0]);
}));

const publicHackathonStatuses = ['published', 'registration_closed', 'ongoing', 'completed'];
const allHackathonStatuses = ['draft', 'pending_review', 'published', 'registration_closed', 'ongoing', 'completed', 'archived'];
const hackathonSelect = `SELECT h.*, d.code AS department_code, u.full_name AS coordinator_name,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'approved')::int AS registered_count,
    COUNT(DISTINCT hi.student_id)::int AS interested_count,
    COALESCE(bool_or(hi.student_id = $__viewer__), false) AS interested
    FROM hackathons h LEFT JOIN departments d ON d.id = h.organizer_department_id LEFT JOIN users u ON u.id = h.coordinator_id
    LEFT JOIN registrations r ON r.hackathon_id = h.id
    LEFT JOIN hackathon_interests hi ON hi.hackathon_id = h.id`;

app.get('/hackathons', authenticate, ah(async (req: AuthRequest, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const statuses = req.user!.role === 'student' ? publicHackathonStatuses : allHackathonStatuses;
  const { rows } = await pool.query(`${hackathonSelect.replace('$__viewer__', '$3')}
    WHERE h.status = ANY($2) AND (h.title ILIKE $1 OR h.organizer ILIKE $1)
    GROUP BY h.id, d.code, u.full_name ORDER BY h.registration_closes_at ASC`, [`%${search}%`, statuses, req.user!.id]);
  res.json(rows);
}));

app.get('/hackathons/:id', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`${hackathonSelect.replace('$__viewer__', '$2')}
    WHERE h.id = $1
    GROUP BY h.id, d.code, u.full_name`, [req.params.id, req.user!.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Hackathon not found.' });
  res.json(rows[0]);
}));

app.post('/hackathons', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(3), organizer: z.string().min(2), description: z.string().min(10), mode: z.enum(['online', 'offline', 'hybrid']), registrationClosesAt: z.string().datetime(), minTeamSize: z.number().int().min(1).default(1), maxTeamSize: z.number().int().min(1).default(4), soloAllowed: z.boolean().default(true), domains: z.array(z.string()).default([]), eligibleYears: z.array(z.number().int()).default([]), status: z.enum(['draft', 'published']).default('draft') }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  if (x.maxTeamSize < x.minTeamSize) return res.status(400).json({ error: 'Maximum team size must be at least the minimum.' });
  const { rows } = await pool.query(`INSERT INTO hackathons (title, slug, organizer, coordinator_id, description, mode, registration_closes_at, min_team_size, max_team_size, solo_allowed, domains, eligible_years, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`, [x.title, slugify(x.title), x.organizer, req.user!.id, x.description, x.mode, x.registrationClosesAt, x.minTeamSize, x.maxTeamSize, x.soloAllowed, x.domains, x.eligibleYears, x.status]);
  await audit(req.user!.id, 'create', 'hackathon', rows[0].id);
  res.status(201).json(rows[0]);
}));

app.patch('/hackathons/:id', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(3).optional(), description: z.string().min(10).optional(), mode: z.enum(['online', 'offline', 'hybrid']).optional(), registrationClosesAt: z.string().datetime().optional(), status: z.enum(allHackathonStatuses as [string, ...string[]]).optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const fields: Record<string, unknown> = { title: input.data.title, description: input.data.description, mode: input.data.mode, registration_closes_at: input.data.registrationClosesAt, status: input.data.status };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return res.status(400).json({ error: 'No fields to update.' });
  const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const { rows } = await pool.query(`UPDATE hackathons SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`, [req.params.id, ...entries.map(([, v]) => v)]);
  if (!rows[0]) return res.status(404).json({ error: 'Hackathon not found.' });
  await audit(req.user!.id, 'update', 'hackathon', req.params.id, { fields: Object.keys(Object.fromEntries(entries)) });
  res.json(rows[0]);
}));

app.get('/hackathons/:id/registrations', authenticate, allow('faculty', 'admin'), ah(async (req, res) => {
  const { rows } = await pool.query(`SELECT r.*, s.full_name AS student_name, s.email AS student_email, t.name AS team_name
    FROM registrations r LEFT JOIN users s ON s.id = r.student_id LEFT JOIN teams t ON t.id = r.team_id
    WHERE r.hackathon_id = $1 ORDER BY r.created_at DESC`, [req.params.id]);
  res.json(rows);
}));

app.post('/hackathons/:id/interest', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  await pool.query(`INSERT INTO hackathon_interests (hackathon_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [req.params.id, req.user!.id]);
  await pool.query(`INSERT INTO notifications (recipient_id, type, title, body, action_url) VALUES ($1, 'interest', 'Hackathon interest saved', 'We will keep you updated about this hackathon.', $2)`, [req.user!.id, `/hackathons/${req.params.id}`]);
  await audit(req.user!.id, 'express_interest', 'hackathon', req.params.id);
  res.status(204).end();
}));

app.delete('/hackathons/:id/interest', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  await pool.query('DELETE FROM hackathon_interests WHERE hackathon_id = $1 AND student_id = $2', [req.params.id, req.user!.id]);
  await audit(req.user!.id, 'remove_interest', 'hackathon', req.params.id);
  res.status(204).end();
}));

app.get('/teams/mine', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT t.*, tm.member_role, tm.status, COUNT(active.user_id)::int AS member_count FROM teams t
    JOIN team_members tm ON tm.team_id = t.id LEFT JOIN team_members active ON active.team_id = t.id AND active.status = 'active'
    WHERE tm.user_id = $1 GROUP BY t.id, tm.member_role, tm.status ORDER BY t.created_at DESC`, [req.user!.id]);
  res.json(rows);
}));

app.get('/teams', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT t.*, COUNT(tm.user_id) FILTER (WHERE tm.status = 'active')::int AS member_count FROM teams t
    LEFT JOIN team_members tm ON tm.team_id = t.id
    WHERE t.visibility = 'public' AND t.join_mode = 'open'
    AND NOT EXISTS (SELECT 1 FROM team_members me WHERE me.team_id = t.id AND me.user_id = $1)
    GROUP BY t.id HAVING COUNT(tm.user_id) FILTER (WHERE tm.status = 'active') < t.max_members
    ORDER BY t.created_at DESC`, [req.user!.id]);
  res.json(rows);
}));

app.get('/teams/all', authenticate, allow('faculty', 'admin'), ah(async (_req, res) => {
  const { rows } = await pool.query(`SELECT t.*, COUNT(tm.user_id) FILTER (WHERE tm.status = 'active')::int AS member_count
    FROM teams t LEFT JOIN team_members tm ON tm.team_id = t.id GROUP BY t.id ORDER BY t.created_at DESC`);
  res.json(rows);
}));

app.get('/teams/invites/mine', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT t.id AS team_id, t.name, t.description, t.max_members FROM team_members tm
    JOIN teams t ON t.id = tm.team_id WHERE tm.user_id = $1 AND tm.status = 'invited'`, [req.user!.id]);
  res.json(rows);
}));

app.get('/teams/:id', authenticate, ah(async (req, res) => {
  const team = (await pool.query('SELECT * FROM teams WHERE id = $1', [req.params.id])).rows[0];
  if (!team) return res.status(404).json({ error: 'Team not found.' });
  const { rows: members } = await pool.query(`SELECT tm.user_id, tm.member_role, tm.status, tm.joined_at, u.full_name, u.email
    FROM team_members tm JOIN users u ON u.id = tm.user_id WHERE tm.team_id = $1 ORDER BY tm.member_role DESC, tm.joined_at ASC`, [req.params.id]);
  res.json({ ...team, members });
}));

app.post('/teams/:id/join', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const team = (await client.query('SELECT * FROM teams WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
    if (!team || team.join_mode !== 'open') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'This team is not open to join.' }); }
    const { rows: count } = await client.query(`SELECT COUNT(*)::int AS n FROM team_members WHERE team_id = $1 AND status = 'active'`, [team.id]);
    if (count[0].n >= team.max_members) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'This team is already full.' }); }
    await client.query(`INSERT INTO team_members (team_id, user_id, member_role, status, joined_at) VALUES ($1,$2,'member','active',now())
      ON CONFLICT (team_id, user_id) DO UPDATE SET status = 'active', joined_at = now()`, [team.id, req.user!.id]);
    await client.query('COMMIT');
    await audit(req.user!.id, 'join', 'team', team.id);
    res.status(204).end();
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

app.post('/teams/:id/invite', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ institutionalId: z.string().min(1) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const team = (await pool.query('SELECT * FROM teams WHERE id = $1', [req.params.id])).rows[0];
  if (!team) return res.status(404).json({ error: 'Team not found.' });
  const isLeader = (await pool.query(`SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND member_role = 'leader'`, [req.params.id, req.user!.id])).rowCount;
  if (!isLeader) return res.status(403).json({ error: 'Only the team leader can invite members.' });
  const invitee = (await pool.query(`SELECT id FROM users WHERE institutional_id = $1 AND role = 'student'`, [input.data.institutionalId])).rows[0];
  if (!invitee) return res.status(404).json({ error: 'No student found with that institutional ID.' });
  await pool.query(`INSERT INTO team_members (team_id, user_id, member_role, status, invited_by) VALUES ($1,$2,'member','invited',$3)
    ON CONFLICT (team_id, user_id) DO UPDATE SET status = 'invited', invited_by = $3`, [req.params.id, invitee.id, req.user!.id]);
  await pool.query(`INSERT INTO notifications (recipient_id, type, title, body, action_url) VALUES ($1, 'team_invite', 'Team invitation', $2, '/teams')`,
    [invitee.id, `You've been invited to join ${team.name}.`]);
  await audit(req.user!.id, 'invite', 'team', team.id, { invitee: invitee.id });
  res.status(204).end();
}));

app.post('/teams/:id/respond', authenticate, ah(async (req: AuthRequest, res) => {
  const input = z.object({ accept: z.boolean() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const status = input.data.accept ? 'active' : 'declined';
  const result = await pool.query(`UPDATE team_members SET status = $3, joined_at = CASE WHEN $3 = 'active' THEN now() ELSE joined_at END
    WHERE team_id = $1 AND user_id = $2 AND status = 'invited'`, [req.params.id, req.user!.id, status]);
  if (!result.rowCount) return res.status(404).json({ error: 'Invitation not found.' });
  res.status(204).end();
}));

app.post('/teams', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ name: z.string().min(2), description: z.string().max(2000).optional(), maxMembers: z.number().int().min(2).max(20), visibility: z.enum(['public', 'private']).default('public'), joinMode: z.enum(['invite', 'request', 'open']).default('invite'), domains: z.array(z.string()).default([]), techStack: z.array(z.string()).default([]) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const client = await pool.connect();
  try { await client.query('BEGIN'); const x = input.data;
    const team = (await client.query('INSERT INTO teams (name, description, max_members, visibility, join_mode, domains, tech_stack, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [x.name, x.description ?? null, x.maxMembers, x.visibility, x.joinMode, x.domains, x.techStack, req.user!.id])).rows[0];
    await client.query("INSERT INTO team_members (team_id, user_id, member_role, status, joined_at) VALUES ($1,$2,'leader','active',now())", [team.id, req.user!.id]);
    await client.query('COMMIT'); await audit(req.user!.id, 'create', 'team', team.id); res.status(201).json(team);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

app.get('/registrations/mine', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT r.*, h.title AS hackathon_title, h.status AS hackathon_status, h.registration_closes_at, h.starts_at, h.ends_at, t.name AS team_name
    FROM registrations r JOIN hackathons h ON h.id = r.hackathon_id LEFT JOIN teams t ON t.id = r.team_id
    WHERE r.student_id = $1 OR r.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1 AND status = 'active')
    ORDER BY r.created_at DESC`, [req.user!.id]);
  res.json(rows);
}));

app.post('/registrations', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ hackathonId: z.string().uuid(), participationMode: z.enum(['solo', 'team']), teamId: z.string().uuid().optional(), externalRegistrationUrl: z.string().url().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  if ((x.participationMode === 'team') !== Boolean(x.teamId)) return res.status(400).json({ error: 'A team is required only for team registration.' });
  const { rows } = await pool.query(`INSERT INTO registrations (hackathon_id, student_id, team_id, participation_mode, external_registration_url, status, submitted_at)
    VALUES ($1,$2,$3,$4,$5,'pending_verification',now()) RETURNING *`, [x.hackathonId, x.participationMode === 'solo' ? req.user!.id : null, x.teamId ?? null, x.participationMode, x.externalRegistrationUrl ?? null]);
  await audit(req.user!.id, 'submit', 'registration', rows[0].id);
  res.status(201).json(rows[0]);
}));

app.get('/registrations', authenticate, allow('faculty', 'admin'), ah(async (req, res) => {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : null;
  const { rows } = await pool.query(`SELECT r.*, h.title AS hackathon_title, s.full_name AS student_name, t.name AS team_name
    FROM registrations r JOIN hackathons h ON h.id = r.hackathon_id LEFT JOIN users s ON s.id = r.student_id LEFT JOIN teams t ON t.id = r.team_id
    WHERE ($1::text IS NULL OR r.status::text = $1) ORDER BY r.created_at DESC LIMIT 200`, [statusFilter]);
  res.json(rows);
}));

app.patch('/registrations/:id', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ status: z.enum(['approved', 'rejected']), rejectionReason: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const { rows } = await pool.query(`UPDATE registrations SET status = $2, reviewed_by = $3, reviewed_at = now(), rejection_reason = $4 WHERE id = $1 RETURNING *`,
    [req.params.id, input.data.status, req.user!.id, input.data.rejectionReason ?? null]);
  if (!rows[0]) return res.status(404).json({ error: 'Registration not found.' });
  await audit(req.user!.id, 'review', 'registration', req.params.id, { status: input.data.status });
  res.json(rows[0]);
}));

app.get('/projects/mine', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT p.*, h.title AS hackathon_title, t.name AS team_name FROM projects p
    LEFT JOIN hackathons h ON h.id = p.hackathon_id LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.owner_id = $1 OR p.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1 AND status = 'active')
    ORDER BY p.updated_at DESC`, [req.user!.id]);
  res.json(rows);
}));

app.get('/projects/showcase', authenticate, ah(async (_req, res) => {
  const { rows } = await pool.query(`SELECT p.*, h.title AS hackathon_title, t.name AS team_name FROM projects p
    LEFT JOIN hackathons h ON h.id = p.hackathon_id LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.visibility = 'public' ORDER BY p.showcase_featured DESC, p.created_at DESC LIMIT 60`);
  res.json(rows);
}));

app.get('/projects/all', authenticate, allow('faculty', 'admin'), ah(async (_req, res) => {
  const { rows } = await pool.query(`SELECT p.*, h.title AS hackathon_title, t.name AS team_name, u.full_name AS owner_name,
    (SELECT status FROM project_reviews WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1) AS review_status
    FROM projects p LEFT JOIN hackathons h ON h.id = p.hackathon_id LEFT JOIN teams t ON t.id = p.team_id JOIN users u ON u.id = p.owner_id
    ORDER BY p.updated_at DESC`);
  res.json(rows);
}));

app.get('/projects/:id', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT p.*, h.title AS hackathon_title, t.name AS team_name,
    (SELECT row_to_json(review) FROM (
      SELECT pr.status, pr.feedback, pr.score, pr.created_at, u.full_name AS reviewer_name
      FROM project_reviews pr JOIN users u ON u.id = pr.reviewer_id
      WHERE pr.project_id = p.id ORDER BY pr.created_at DESC LIMIT 1
    ) review) AS latest_review
    FROM projects p
    LEFT JOIN hackathons h ON h.id = p.hackathon_id LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.id = $1 AND (p.owner_id = $2 OR p.visibility != 'private' OR p.team_id IN (SELECT team_id FROM team_members WHERE user_id = $2 AND status = 'active'))`, [req.params.id, req.user!.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Project not found.' });
  res.json(rows[0]);
}));

app.post('/projects/:id/review', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ status: z.enum(['approved', 'changes_requested', 'rejected']), feedback: z.string().optional(), score: z.number().min(0).max(100).optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const { rows } = await pool.query(`INSERT INTO project_reviews (project_id, reviewer_id, score, feedback, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.id, req.user!.id, x.score ?? null, x.feedback ?? null, x.status]);
  await audit(req.user!.id, 'review', 'project', req.params.id, { status: x.status });
  res.status(201).json(rows[0]);
}));

app.post('/projects', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(2), problemStatement: z.string().min(10), description: z.string().min(10), participationMode: z.enum(['solo', 'team']), hackathonId: z.string().uuid().optional(), teamId: z.string().uuid().optional(), techStack: z.array(z.string()).default([]), githubUrl: z.string().url().optional(), demoUrl: z.string().url().optional(), posterUrl: z.string().url().optional(), presentationUrl: z.string().url().optional(), visibility: z.enum(['private', 'institution', 'public']).default('private') }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const { rows } = await pool.query(`INSERT INTO projects (title, slug, owner_id, hackathon_id, team_id, participation_mode, problem_statement, description, tech_stack, github_url, demo_url, poster_url, presentation_url, visibility)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, [x.title, slugify(x.title), req.user!.id, x.hackathonId ?? null, x.teamId ?? null, x.participationMode, x.problemStatement, x.description, x.techStack, x.githubUrl ?? null, x.demoUrl ?? null, x.posterUrl ?? null, x.presentationUrl ?? null, x.visibility]);
  await audit(req.user!.id, 'create', 'project', rows[0].id);
  res.status(201).json(rows[0]);
}));

app.post('/suggestions', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(2), organizer: z.string().min(2), officialUrl: z.string().url(), description: z.string().min(10), registrationDeadline: z.string().date().optional(), eventDateText: z.string().optional(), domain: z.string().optional(), mode: z.string().optional(), tags: z.array(z.string()).default([]) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const { rows } = await pool.query('INSERT INTO hackathon_suggestions (submitted_by, title, organizer, official_url, description, registration_deadline, event_date_text, domain, mode, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *', [req.user!.id, x.title, x.organizer, x.officialUrl, x.description, x.registrationDeadline ?? null, x.eventDateText ?? null, x.domain ?? null, x.mode ?? null, x.tags]);
  await audit(req.user!.id, 'create', 'hackathon_suggestion', rows[0].id);
  res.status(201).json(rows[0]);
}));

app.get('/suggestions', authenticate, allow('faculty', 'admin'), ah(async (req, res) => {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : null;
  const { rows } = await pool.query(`SELECT s.*, u.full_name AS submitted_by_name FROM hackathon_suggestions s
    JOIN users u ON u.id = s.submitted_by WHERE ($1::text IS NULL OR s.status::text = $1) ORDER BY s.created_at DESC`, [statusFilter]);
  res.json(rows);
}));

app.patch('/suggestions/:id', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ status: z.enum(['under_review', 'approved', 'rejected']), reviewNotes: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const { rows } = await pool.query(`UPDATE hackathon_suggestions SET status = $2, reviewed_by = $3, reviewed_at = now(), review_notes = $4 WHERE id = $1 RETURNING *`,
    [req.params.id, input.data.status, req.user!.id, input.data.reviewNotes ?? null]);
  if (!rows[0]) return res.status(404).json({ error: 'Suggestion not found.' });
  await audit(req.user!.id, 'review', 'hackathon_suggestion', req.params.id, { status: input.data.status });
  res.json(rows[0]);
}));

app.get('/students', authenticate, allow('faculty', 'admin'), ah(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const { rows } = await pool.query(`SELECT u.id, u.full_name, u.email, u.institutional_id, d.code AS department_code, sp.year_of_study,
    COUNT(DISTINCT p.id)::int AS project_count, COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'approved')::int AS hackathon_count
    FROM users u LEFT JOIN departments d ON d.id = u.department_id LEFT JOIN student_profiles sp ON sp.user_id = u.id
    LEFT JOIN projects p ON p.owner_id = u.id LEFT JOIN registrations r ON r.student_id = u.id
    WHERE u.role = 'student' AND (u.full_name ILIKE $1 OR u.institutional_id ILIKE $1)
    GROUP BY u.id, d.code, sp.year_of_study ORDER BY u.full_name ASC`, [`%${search}%`]);
  res.json(rows);
}));

app.get('/notifications', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query('SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT 100', [req.user!.id]);
  res.json(rows);
}));
app.patch('/notifications/read-all', authenticate, ah(async (req: AuthRequest, res) => {
  await pool.query('UPDATE notifications SET read_at = now() WHERE recipient_id = $1 AND read_at IS NULL', [req.user!.id]);
  res.status(204).end();
}));
app.patch('/notifications/:id/read', authenticate, ah(async (req: AuthRequest, res) => {
  const result = await pool.query('UPDATE notifications SET read_at = now() WHERE id = $1 AND recipient_id = $2 RETURNING *', [req.params.id, req.user!.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Notification not found.' });
  res.json(result.rows[0]);
}));
app.delete('/notifications/:id', authenticate, ah(async (req: AuthRequest, res) => {
  const result = await pool.query('DELETE FROM notifications WHERE id = $1 AND recipient_id = $2', [req.params.id, req.user!.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Notification not found.' });
  res.status(204).end();
}));

app.patch('/users/me', authenticate, ah(async (req: AuthRequest, res) => {
  const input = z.object({ fullName: z.string().min(2).optional(), phone: z.string().max(30).optional(), programme: z.string().max(120).optional(), yearOfStudy: z.number().int().min(1).max(8).optional(), interests: z.array(z.string()).optional(), techStack: z.array(z.string()).optional(), designation: z.string().max(120).optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (x.fullName !== undefined) await client.query('UPDATE users SET full_name = $2, updated_at = now() WHERE id = $1', [req.user!.id, x.fullName]);
    if (req.user!.role === 'student') {
      const fields: Record<string, unknown> = { phone: x.phone, programme: x.programme, year_of_study: x.yearOfStudy, interests: x.interests, tech_stack: x.techStack };
      const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
      if (entries.length) {
        const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
        await client.query(`UPDATE student_profiles SET ${setClause} WHERE user_id = $1`, [req.user!.id, ...entries.map(([, v]) => v)]);
      }
    } else if (req.user!.role === 'faculty') {
      const fields: Record<string, unknown> = { phone: x.phone, designation: x.designation };
      const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
      if (entries.length) {
        const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
        await client.query(`UPDATE faculty_profiles SET ${setClause} WHERE user_id = $1`, [req.user!.id, ...entries.map(([, v]) => v)]);
      }
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  const { rows } = await pool.query(`SELECT u.id, u.institutional_id, u.email, u.full_name, u.role, u.status, u.avatar_url,
    sp.programme, sp.year_of_study, sp.interests, sp.tech_stack, sp.phone AS student_phone,
    fp.designation, fp.phone AS faculty_phone
    FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.id LEFT JOIN faculty_profiles fp ON fp.user_id = u.id
    WHERE u.id = $1`, [req.user!.id]);
  res.json(rows[0]);
}));

app.get('/admin/audit-logs', authenticate, allow('admin'), ah(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const { rows } = await pool.query(`SELECT a.*, u.full_name AS actor_name, u.role AS actor_role FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
    WHERE ($1 = '' OR a.action ILIKE $2 OR a.entity_type ILIKE $2 OR u.full_name ILIKE $2) ORDER BY a.created_at DESC LIMIT 200`, [search, `%${search}%`]);
  res.json(rows);
}));

app.get('/achievements/mine', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT a.*, h.title AS hackathon_title, p.title AS project_title
    FROM achievements a LEFT JOIN hackathons h ON h.id = a.hackathon_id LEFT JOIN projects p ON p.id = a.project_id
    WHERE a.student_id = $1 ORDER BY a.created_at DESC`, [req.user!.id]);
  res.json(rows);
}));

app.post('/achievements', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(2), outcome: z.string().min(2), hackathonId: z.string().uuid().optional(), projectId: z.string().uuid().optional(), achievedOn: z.string().date().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const { rows } = await pool.query(`INSERT INTO achievements (student_id, hackathon_id, project_id, title, outcome, achieved_on) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user!.id, x.hackathonId ?? null, x.projectId ?? null, x.title, x.outcome, x.achievedOn ?? null]);
  await audit(req.user!.id, 'create', 'achievement', rows[0].id);
  res.status(201).json(rows[0]);
}));

app.get('/achievements', authenticate, allow('faculty', 'admin'), ah(async (req, res) => {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : null;
  const { rows } = await pool.query(`SELECT a.*, u.full_name AS student_name, h.title AS hackathon_title, p.title AS project_title
    FROM achievements a JOIN users u ON u.id = a.student_id LEFT JOIN hackathons h ON h.id = a.hackathon_id LEFT JOIN projects p ON p.id = a.project_id
    WHERE ($1::text IS NULL OR a.status::text = $1) ORDER BY a.created_at DESC`, [statusFilter]);
  res.json(rows);
}));

app.patch('/achievements/:id', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ status: z.enum(['approved', 'rejected', 'changes_requested']) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const { rows } = await pool.query(`UPDATE achievements SET status = $2, verified_by = $3, verified_at = now() WHERE id = $1 RETURNING *`, [req.params.id, input.data.status, req.user!.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Achievement not found.' });
  await audit(req.user!.id, 'verify', 'achievement', req.params.id, { status: input.data.status });
  res.json(rows[0]);
}));

app.get('/reminders/mine', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT r.*, t.name AS team_name FROM reminders r LEFT JOIN teams t ON t.id = r.team_id
    WHERE r.created_by = $1 OR r.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1 AND status = 'active')
    ORDER BY r.starts_at ASC`, [req.user!.id]);
  res.json(rows);
}));

app.post('/reminders', authenticate, ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(2), startsAt: z.string().datetime(), teamId: z.string().uuid().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const { rows } = await pool.query(`INSERT INTO reminders (created_by, team_id, title, starts_at) VALUES ($1,$2,$3,$4) RETURNING *`, [req.user!.id, x.teamId ?? null, x.title, x.startsAt]);
  res.status(201).json(rows[0]);
}));

app.delete('/reminders/:id', authenticate, ah(async (req: AuthRequest, res) => {
  const result = await pool.query('DELETE FROM reminders WHERE id = $1 AND created_by = $2', [req.params.id, req.user!.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Reminder not found.' });
  res.status(204).end();
}));

app.get('/reports/summary', authenticate, allow('faculty', 'admin'), ah(async (_req, res) => {
  const participation = await pool.query(`SELECT COUNT(*)::int AS n FROM registrations WHERE status = 'approved'`);
  const totalSubmitted = await pool.query(`SELECT COUNT(*)::int AS n FROM registrations`);
  const wins = await pool.query(`SELECT COUNT(*)::int AS n FROM achievements WHERE status = 'approved'`);
  const domainBreakdown = await pool.query(`SELECT unnest(domains) AS domain, COUNT(*)::int AS n FROM hackathons GROUP BY domain ORDER BY n DESC LIMIT 5`);
  res.json({
    totalParticipants: participation.rows[0].n,
    winRate: totalSubmitted.rows[0].n ? Math.round((wins.rows[0].n / totalSubmitted.rows[0].n) * 100) : 0,
    topDomain: domainBreakdown.rows[0]?.domain ?? null,
    domainBreakdown: domainBreakdown.rows,
  });
}));

app.get('/admin/dashboard', authenticate, allow('admin'), ah(async (_req, res) => {
  const usersByRole = await pool.query(`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`);
  const counts: Record<string, number> = { student: 0, faculty: 0, admin: 0 };
  for (const row of usersByRole.rows) counts[row.role] = row.count;
  const activeHackathons = await pool.query(`SELECT COUNT(*)::int AS n FROM hackathons WHERE status IN ('published','ongoing')`);
  const totalParticipations = await pool.query(`SELECT COUNT(*)::int AS n FROM registrations WHERE status = 'approved'`);
  const totalWins = await pool.query(`SELECT COUNT(*)::int AS n FROM achievements WHERE status = 'approved'`);
  const flagged = await pool.query(`SELECT COUNT(*)::int AS n FROM registrations WHERE status = 'rejected'`);
  const deptPerf = await pool.query(`SELECT d.code AS dept, COUNT(DISTINCT u.id)::int AS students,
      COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'approved')::int AS participations,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'approved')::int AS wins
    FROM departments d LEFT JOIN users u ON u.department_id = d.id AND u.role = 'student'
    LEFT JOIN registrations r ON r.student_id = u.id LEFT JOIN achievements a ON a.student_id = u.id
    GROUP BY d.code ORDER BY d.code`);
  const recentWinners = await pool.query(`SELECT a.title, a.outcome, a.achieved_on, u.full_name AS student_name, d.code AS department_code
    FROM achievements a JOIN users u ON u.id = a.student_id LEFT JOIN departments d ON d.id = u.department_id
    WHERE a.status = 'approved' ORDER BY a.achieved_on DESC NULLS LAST, a.created_at DESC LIMIT 10`);
  res.json({
    totalUsers: counts.student + counts.faculty + counts.admin,
    students: counts.student, faculty: counts.faculty, admins: counts.admin,
    activeHackathons: activeHackathons.rows[0].n, totalParticipations: totalParticipations.rows[0].n,
    totalWins: totalWins.rows[0].n, flaggedActions: flagged.rows[0].n,
    departmentPerformance: deptPerf.rows, recentWinners: recentWinners.rows,
  });
}));

app.get('/admin/users', authenticate, allow('admin'), ah(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const roleFilter = typeof req.query.role === 'string' ? req.query.role : null;
  const { rows } = await pool.query(`SELECT u.id, u.institutional_id, u.email, u.full_name, u.role, u.status, u.last_login_at, u.created_at,
    d.code AS department_code, sp.year_of_study
    FROM users u LEFT JOIN departments d ON d.id = u.department_id LEFT JOIN student_profiles sp ON sp.user_id = u.id
    WHERE (u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.institutional_id ILIKE $1) AND ($2::text IS NULL OR u.role::text = $2)
    ORDER BY u.created_at DESC LIMIT 500`, [`%${search}%`, roleFilter]);
  res.json(rows);
}));

app.post('/admin/users', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ institutionalId: z.string().min(1), email: z.string().email(), fullName: z.string().min(2), role: z.enum(['student', 'faculty', 'admin']), departmentCode: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const dept = x.departmentCode ? (await pool.query('SELECT id FROM departments WHERE code = $1', [x.departmentCode])).rows[0] : null;
  const passwordHash = await bcrypt.hash('Demo@123', 10);
  const { rows } = await pool.query(`INSERT INTO users (institutional_id, email, password_hash, full_name, role, department_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, institutional_id, email, full_name, role, status`,
    [x.institutionalId, x.email, passwordHash, x.fullName, x.role, dept?.id ?? null]);
  if (x.role === 'student') await pool.query('INSERT INTO student_profiles (user_id) VALUES ($1)', [rows[0].id]);
  if (x.role === 'faculty') await pool.query('INSERT INTO faculty_profiles (user_id) VALUES ($1)', [rows[0].id]);
  await audit(req.user!.id, 'create', 'user', rows[0].id);
  res.status(201).json(rows[0]);
}));

app.patch('/admin/users/:id', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ fullName: z.string().min(2).optional(), status: z.enum(['active', 'inactive', 'suspended']).optional(), role: z.enum(['student', 'faculty', 'admin']).optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const fields: Record<string, unknown> = { full_name: input.data.fullName, status: input.data.status, role: input.data.role };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return res.status(400).json({ error: 'No fields to update.' });
  const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const { rows } = await pool.query(`UPDATE users SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING id, institutional_id, email, full_name, role, status`, [req.params.id, ...entries.map(([, v]) => v)]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
  await audit(req.user!.id, 'update', 'user', req.params.id, { fields: Object.keys(Object.fromEntries(entries)) });
  res.json(rows[0]);
}));

app.get('/admin/departments', authenticate, allow('admin', 'faculty'), ah(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM departments ORDER BY code');
  res.json(rows);
}));

app.post('/admin/departments', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ code: z.string().min(2), name: z.string().min(2) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const { rows } = await pool.query('INSERT INTO departments (code, name) VALUES ($1,$2) RETURNING *', [input.data.code, input.data.name]);
  await audit(req.user!.id, 'create', 'department', rows[0].id);
  res.status(201).json(rows[0]);
}));

app.patch('/admin/departments/:id', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ code: z.string().min(2).optional(), name: z.string().min(2).optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const fields = { code: input.data.code, name: input.data.name };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return res.status(400).json({ error: 'No fields to update.' });
  const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const { rows } = await pool.query(`UPDATE departments SET ${setClause} WHERE id = $1 RETURNING *`, [req.params.id, ...entries.map(([, v]) => v)]);
  if (!rows[0]) return res.status(404).json({ error: 'Department not found.' });
  res.json(rows[0]);
}));

app.delete('/admin/departments/:id', authenticate, allow('admin'), ah(async (req, res) => {
  const result = await pool.query('DELETE FROM departments WHERE id = $1', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Department not found.' });
  res.status(204).end();
}));

app.get('/admin/settings', authenticate, allow('admin'), ah(async (_req, res) => {
  const { rows } = await pool.query('SELECT key, value FROM system_settings');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));

app.put('/admin/settings', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
  const input = z.record(z.string(), z.unknown()).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  for (const [key, value] of Object.entries(input.data)) {
    await pool.query(`INSERT INTO system_settings (key, value, updated_by) VALUES ($1,$2,$3) ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = now()`, [key, JSON.stringify(value), req.user!.id]);
  }
  await audit(req.user!.id, 'update', 'system_settings', undefined, input.data);
  const { rows } = await pool.query('SELECT key, value FROM system_settings');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => { console.error(error); res.status(500).json({ error: 'An unexpected server error occurred.' }); });
app.listen(port, () => console.log(`UniHack Ledger API listening on http://localhost:${port}`));
