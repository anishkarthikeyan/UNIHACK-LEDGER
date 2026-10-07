import { Router } from 'express';
import { pool } from '../db/pool';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest } from '../middleware/auth';
import { registrationOwnerSql, studentIdInScopeSql } from '../lib/scope';

// Participation/win counts cover only the caller's student scope (server/lib/scope.ts); the
// domain breakdown is about hackathons, not students, so it stays global.
export const reportsRoutes = Router();

reportsRoutes.get('/reports/summary', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const { role, id } = req.user!;
  const participation = await pool.query(`SELECT COUNT(*)::int AS n FROM registrations r WHERE r.status = 'approved' AND ${studentIdInScopeSql(role, '$1', registrationOwnerSql('r'))}`, [id]);
  const totalSubmitted = await pool.query(`SELECT COUNT(*)::int AS n FROM registrations r WHERE ${studentIdInScopeSql(role, '$1', registrationOwnerSql('r'))}`, [id]);
  const wins = await pool.query(`SELECT COUNT(*)::int AS n FROM achievements a WHERE a.status = 'approved' AND ${studentIdInScopeSql(role, '$1', 'a.student_id')}`, [id]);
  const domainBreakdown = await pool.query(`SELECT unnest(domains) AS domain, COUNT(*)::int AS n FROM hackathons GROUP BY domain ORDER BY n DESC LIMIT 5`);
  res.json({
    totalParticipants: participation.rows[0].n,
    winRate: totalSubmitted.rows[0].n ? Math.round((wins.rows[0].n / totalSubmitted.rows[0].n) * 100) : 0,
    topDomain: domainBreakdown.rows[0]?.domain ?? null,
    domainBreakdown: domainBreakdown.rows,
  });
}));
