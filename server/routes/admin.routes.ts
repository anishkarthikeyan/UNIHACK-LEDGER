import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { audit } from '../lib/audit';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest, Role } from '../middleware/auth';

// Behavior unchanged from the original monolithic server/index.ts — moved verbatim.
export const adminRoutes = Router();

adminRoutes.get('/admin/audit-logs', authenticate, allow('admin'), ah(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const { rows } = await pool.query(`SELECT a.*, u.full_name AS actor_name, u.role AS actor_role FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
    WHERE ($1 = '' OR a.action ILIKE $2 OR a.entity_type ILIKE $2 OR u.full_name ILIKE $2) ORDER BY a.created_at DESC LIMIT 200`, [search, `%${search}%`]);
  res.json(rows);
}));

adminRoutes.get('/admin/dashboard', authenticate, allow('admin'), ah(async (_req, res) => {
  const usersByRole = await pool.query(`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`);
  const counts: Record<string, number> = { student: 0, faculty: 0, admin: 0 };
  for (const row of usersByRole.rows) counts[row.role] = row.count;
  const activeHackathons = await pool.query(`SELECT COUNT(*)::int AS n FROM hackathons WHERE status IN ('published','ongoing')`);
  const totalParticipations = await pool.query(`SELECT COUNT(*)::int AS n FROM registrations WHERE status = 'approved'`);
  const totalWins = await pool.query(`SELECT COUNT(*)::int AS n FROM achievements WHERE status = 'approved'`);
  const flagged = await pool.query(`SELECT COUNT(*)::int AS n FROM registrations WHERE status = 'rejected'`);
  // Platform-wide totals (distinct from the filtered counts above — e.g. activeHackathons is
  // published+ongoing only, totalHackathons is every hackathon regardless of status) for the
  // Admin dashboard's overview stat cards.
  const totalHackathons = await pool.query(`SELECT COUNT(*)::int AS n FROM hackathons`);
  const totalRegistrations = await pool.query(`SELECT COUNT(*)::int AS n FROM registrations`);
  const totalTeams = await pool.query(`SELECT COUNT(*)::int AS n FROM teams`);
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
    totalHackathons: totalHackathons.rows[0].n, totalRegistrations: totalRegistrations.rows[0].n, totalTeams: totalTeams.rows[0].n,
    departmentPerformance: deptPerf.rows, recentWinners: recentWinners.rows,
  });
}));

adminRoutes.get('/admin/users', authenticate, allow('admin'), ah(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const roleFilter = typeof req.query.role === 'string' ? req.query.role : null;
  const { rows } = await pool.query(`SELECT u.id, u.institutional_id, u.email, u.full_name, u.role, u.status, u.last_login_at, u.created_at,
    d.code AS department_code, sp.year_of_study
    FROM users u LEFT JOIN departments d ON d.id = u.department_id LEFT JOIN student_profiles sp ON sp.user_id = u.id
    WHERE (u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.institutional_id ILIKE $1) AND ($2::text IS NULL OR u.role::text = $2)
    ORDER BY u.created_at DESC LIMIT 500`, [`%${search}%`, roleFilter]);
  res.json(rows);
}));

adminRoutes.post('/admin/users', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
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

const roleRank: Record<Role, number> = { student: 0, faculty: 1, admin: 2 };

adminRoutes.patch('/admin/users/:id', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ fullName: z.string().min(2).optional(), status: z.enum(['active', 'inactive', 'suspended']).optional(), role: z.enum(['student', 'faculty', 'admin']).optional(), confirmed: z.boolean().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });

  if (input.data.role) {
    const target = (await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id])).rows[0];
    if (!target) return res.status(404).json({ error: 'User not found.' });
    const isEscalation = roleRank[input.data.role as Role] > roleRank[target.role as Role];
    if (isEscalation && !input.data.confirmed) {
      const setting = (await pool.query(`SELECT value FROM system_settings WHERE key = 'role_escalation_confirmation'`)).rows[0];
      const requireConfirmation = setting ? setting.value === true : true; // default on when unset
      if (requireConfirmation) {
        return res.status(409).json({ error: `This change grants ${target.role} → ${input.data.role} privileges. Resubmit with confirmation to proceed.` });
      }
    }
  }

  const fields: Record<string, unknown> = { full_name: input.data.fullName, status: input.data.status, role: input.data.role };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return res.status(400).json({ error: 'No fields to update.' });
  const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const { rows } = await pool.query(`UPDATE users SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING id, institutional_id, email, full_name, role, status`, [req.params.id, ...entries.map(([, v]) => v)]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
  await audit(req.user!.id, 'update', 'user', req.params.id, { fields: Object.keys(Object.fromEntries(entries)) });
  res.json(rows[0]);
}));

adminRoutes.get('/admin/departments', authenticate, allow('admin', 'faculty'), ah(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM departments ORDER BY code');
  res.json(rows);
}));

adminRoutes.post('/admin/departments', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ code: z.string().min(2), name: z.string().min(2) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const { rows } = await pool.query('INSERT INTO departments (code, name) VALUES ($1,$2) RETURNING *', [input.data.code, input.data.name]);
  await audit(req.user!.id, 'create', 'department', rows[0].id);
  res.status(201).json(rows[0]);
}));

adminRoutes.patch('/admin/departments/:id', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ code: z.string().min(2).optional(), name: z.string().min(2).optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const fields = { code: input.data.code, name: input.data.name };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return res.status(400).json({ error: 'No fields to update.' });
  const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const { rows } = await pool.query(`UPDATE departments SET ${setClause} WHERE id = $1 RETURNING *`, [req.params.id, ...entries.map(([, v]) => v)]);
  if (!rows[0]) return res.status(404).json({ error: 'Department not found.' });
  await audit(req.user!.id, 'update', 'department', req.params.id, { fields: Object.keys(Object.fromEntries(entries)) });
  res.json(rows[0]);
}));

adminRoutes.delete('/admin/departments/:id', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
  const result = await pool.query('DELETE FROM departments WHERE id = $1', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Department not found.' });
  await audit(req.user!.id, 'delete', 'department', req.params.id);
  res.status(204).end();
}));

adminRoutes.get('/admin/settings', authenticate, allow('admin'), ah(async (_req, res) => {
  const { rows } = await pool.query('SELECT key, value FROM system_settings');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));

adminRoutes.put('/admin/settings', authenticate, allow('admin'), ah(async (req: AuthRequest, res) => {
  const input = z.record(z.string(), z.unknown()).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  for (const [key, value] of Object.entries(input.data)) {
    await pool.query(`INSERT INTO system_settings (key, value, updated_by) VALUES ($1,$2,$3) ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = now()`, [key, JSON.stringify(value), req.user!.id]);
  }
  await audit(req.user!.id, 'update', 'system_settings', undefined, input.data);
  const { rows } = await pool.query('SELECT key, value FROM system_settings');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));
