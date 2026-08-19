import { Router } from 'express';
import { pool } from '../db/pool';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate } from '../middleware/auth';

// Behavior unchanged from the original monolithic server/index.ts — moved verbatim.
export const reportsRoutes = Router();

reportsRoutes.get('/reports/summary', authenticate, allow('faculty', 'admin'), ah(async (_req, res) => {
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
