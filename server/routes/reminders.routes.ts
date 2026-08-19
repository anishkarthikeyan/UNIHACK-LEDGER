import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { ah } from '../middleware/asyncHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

// Behavior unchanged from the original monolithic server/index.ts — moved verbatim.
export const remindersRoutes = Router();

remindersRoutes.get('/reminders/mine', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT r.*, t.name AS team_name FROM reminders r LEFT JOIN teams t ON t.id = r.team_id
    WHERE r.created_by = $1 OR r.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1 AND status = 'active')
    ORDER BY r.starts_at ASC`, [req.user!.id]);
  res.json(rows);
}));

remindersRoutes.post('/reminders', authenticate, ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(2), startsAt: z.string().datetime(), teamId: z.string().uuid().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const { rows } = await pool.query(`INSERT INTO reminders (created_by, team_id, title, starts_at) VALUES ($1,$2,$3,$4) RETURNING *`, [req.user!.id, x.teamId ?? null, x.title, x.startsAt]);
  res.status(201).json(rows[0]);
}));

remindersRoutes.delete('/reminders/:id', authenticate, ah(async (req: AuthRequest, res) => {
  const result = await pool.query('DELETE FROM reminders WHERE id = $1 AND created_by = $2', [req.params.id, req.user!.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Reminder not found.' });
  res.status(204).end();
}));
