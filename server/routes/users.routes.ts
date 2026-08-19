import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { ah } from '../middleware/asyncHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

// Behavior unchanged from the original monolithic server/index.ts — moved verbatim.
export const usersRoutes = Router();

usersRoutes.patch('/users/me', authenticate, ah(async (req: AuthRequest, res) => {
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
    d.code AS department_code, d.name AS department_name,
    sp.programme, sp.year_of_study, sp.section, sp.interests, sp.tech_stack, sp.phone AS student_phone,
    fp.designation, fp.phone AS faculty_phone
    FROM users u LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN student_profiles sp ON sp.user_id = u.id LEFT JOIN faculty_profiles fp ON fp.user_id = u.id
    WHERE u.id = $1`, [req.user!.id]);
  res.json(rows[0]);
}));
