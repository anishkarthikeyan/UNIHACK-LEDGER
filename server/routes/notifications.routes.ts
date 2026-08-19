import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { ah } from '../middleware/asyncHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { services } from '../services';

// Behavior unchanged from the original monolithic server/index.ts, moved verbatim, plus one new
// endpoint (push-token registration — Phase 1.5 Part 5 foundation, unused by the app until
// Phase 6 wires the Capacitor client to call it).
export const notificationsRoutes = Router();

notificationsRoutes.get('/notifications', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query('SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT 100', [req.user!.id]);
  res.json(rows);
}));

notificationsRoutes.patch('/notifications/read-all', authenticate, ah(async (req: AuthRequest, res) => {
  await pool.query('UPDATE notifications SET read_at = now() WHERE recipient_id = $1 AND read_at IS NULL', [req.user!.id]);
  res.status(204).end();
}));

notificationsRoutes.patch('/notifications/:id/read', authenticate, ah(async (req: AuthRequest, res) => {
  const result = await pool.query('UPDATE notifications SET read_at = now() WHERE id = $1 AND recipient_id = $2 RETURNING *', [req.params.id, req.user!.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Notification not found.' });
  res.json(result.rows[0]);
}));

notificationsRoutes.delete('/notifications/:id', authenticate, ah(async (req: AuthRequest, res) => {
  const result = await pool.query('DELETE FROM notifications WHERE id = $1 AND recipient_id = $2', [req.params.id, req.user!.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Notification not found.' });
  res.status(204).end();
}));

notificationsRoutes.post('/notifications/push-token', authenticate, ah(async (req: AuthRequest, res) => {
  const input = z.object({ token: z.string().min(1), platform: z.enum(['android', 'ios', 'web']) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  await services.notifications.registerPushToken(req.user!.id, input.data.token, input.data.platform);
  res.status(204).end();
}));

notificationsRoutes.delete('/notifications/push-token/:token', authenticate, ah(async (req, res) => {
  await services.notifications.removePushToken(req.params.token);
  res.status(204).end();
}));
