import { Router } from 'express';
import { pool } from '../db/pool';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate } from '../middleware/auth';

// Behavior unchanged from the original monolithic server/index.ts — moved verbatim.
export const studentsRoutes = Router();

studentsRoutes.get('/students', authenticate, allow('faculty', 'admin'), ah(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const { rows } = await pool.query(`SELECT u.id, u.full_name, u.email, u.institutional_id, d.code AS department_code, sp.year_of_study,
    COUNT(DISTINCT p.id)::int AS project_count, COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'approved')::int AS hackathon_count
    FROM users u LEFT JOIN departments d ON d.id = u.department_id LEFT JOIN student_profiles sp ON sp.user_id = u.id
    LEFT JOIN projects p ON p.owner_id = u.id LEFT JOIN registrations r ON r.student_id = u.id
    WHERE u.role = 'student' AND (u.full_name ILIKE $1 OR u.institutional_id ILIKE $1)
    GROUP BY u.id, d.code, sp.year_of_study ORDER BY u.full_name ASC`, [`%${search}%`]);
  res.json(rows);
}));
