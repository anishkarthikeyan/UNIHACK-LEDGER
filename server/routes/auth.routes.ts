import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/env';
import { pool } from '../db/pool';
import { audit } from '../lib/audit';
import { ah } from '../middleware/asyncHandler';
import { authenticate, AuthRequest, isStaff } from '../middleware/auth';
import { scopeAssignmentsOf } from '../lib/scope';
import { authRateLimit } from '../middleware/rateLimit';
import { services } from '../services';
import { passwordResetEmail } from '../services/email/templates';

// Behavior unchanged from the original monolithic server/index.ts — only the module boundary
// and the extraction of jwtSecret/expiry into config.ts are new — plus the forgot/reset-password
// flow below (previously nonexistent: no route, no schema, even though passwordResetEmail()
// already existed in server/services/email/templates with no caller).
export const authRoutes = Router();

const RESET_TOKEN_TTL_MINUTES = 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

authRoutes.post('/auth/login', authRateLimit, ah(async (req, res) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A valid email and password are required.' });
  const { rows } = await pool.query('SELECT id, email, password_hash, full_name, role, institutional_id, status FROM users WHERE lower(email) = lower($1)', [input.data.email]);
  const user = rows[0];
  if (!user || user.status !== 'active' || !user.password_hash || !(await bcrypt.compare(input.data.password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password.' });
  await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
  await audit(user.id, 'login', 'user', user.id);
  const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
  res.json({ token, user: { id: user.id, email: user.email, name: user.full_name, role: user.role, institutionalId: user.institutional_id } });
}));

authRoutes.post('/auth/forgot-password', authRateLimit, ah(async (req, res) => {
  const input = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A valid email is required.' });

  // Always respond 204 regardless of whether the account exists — a different response would
  // let this endpoint be used to enumerate registered emails.
  const user = (await pool.query('SELECT id, full_name, email FROM users WHERE lower(email) = lower($1) AND status = $2', [input.data.email, 'active'])).rows[0];
  if (user) {
    const token = randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '${RESET_TOKEN_TTL_MINUTES} minutes')`,
      [user.id, hashToken(token)],
    );
    const resetUrl = `${config.appUrl}${config.appUrl.includes('?') ? '&' : '?'}reset_token=${encodeURIComponent(token)}`;
    await services.email.send(passwordResetEmail(user.email, { recipientName: user.full_name, resetUrl, expiresInMinutes: RESET_TOKEN_TTL_MINUTES }));
    await audit(user.id, 'request_password_reset', 'user', user.id);
  }
  res.status(204).end();
}));

authRoutes.post('/auth/reset-password', authRateLimit, ah(async (req, res) => {
  const input = z.object({ token: z.string().min(1), newPassword: z.string().min(8) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const record = (await client.query(
      `SELECT id, user_id FROM password_resets WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE`,
      [hashToken(input.data.token)],
    )).rows[0];
    if (!record) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' }); }

    const passwordHash = await bcrypt.hash(input.data.newPassword, 10);
    await client.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [record.user_id, passwordHash]);
    await client.query('UPDATE password_resets SET used_at = now() WHERE id = $1', [record.id]);
    // Any other outstanding reset links for this user are invalidated too — a stale, unused
    // link should stop working the moment the password actually changes.
    await client.query(`UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL AND id != $2`, [record.user_id, record.id]);
    await client.query('COMMIT');
    await audit(record.user_id, 'reset_password', 'user', record.user_id);
    res.status(204).end();
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

authRoutes.get('/auth/me', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT u.id, u.institutional_id, u.email, u.full_name, u.role, u.status, u.avatar_url,
    d.code AS department_code, d.name AS department_name,
    sp.programme, COALESCE(student_year_of_study(sp.batch_year), sp.year_of_study) AS year_of_study, sp.section, sp.batch_year, sp.sde_status, sp.interests, sp.tech_stack, sp.phone AS student_phone,
    fp.designation, fp.phone AS faculty_phone
    FROM users u LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN student_profiles sp ON sp.user_id = u.id LEFT JOIN faculty_profiles fp ON fp.user_id = u.id
    WHERE u.id = $1`, [req.user!.id]);
  // Staff see which part of the hierarchy they cover (empty = no students visible yet).
  res.json({ ...rows[0], scope: isStaff(req.user!.role) ? await scopeAssignmentsOf(req.user!.id) : undefined });
}));
