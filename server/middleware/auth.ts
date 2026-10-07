import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { pool } from '../db/pool';

// 'faculty' is the Faculty Advisor role (enum value kept from before the hierarchy existed).
export type Role = 'student' | 'faculty' | 'coordinator' | 'sde_coordinator' | 'hod' | 'admin';
export type AuthRequest = Request & { user?: { id: string; role: Role } };

// Staff roles: institutional staff whose student visibility is limited by
// staff_scope_assignments (see server/lib/scope.ts). Admin is the system role, not staff.
export const STAFF_ROLES: Role[] = ['faculty', 'coordinator', 'sde_coordinator', 'hod'];
// Roles that may approve/reject student submissions (within their scope, for faculty).
export const REVIEWER_ROLES: Role[] = ['faculty', 'admin'];
// Roles that may read student/cohort data at all (each one scoped server-side).
export const STUDENT_DATA_ROLES: Role[] = [...STAFF_ROLES, 'admin'];

export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

// The JWT only proves who the caller is. Role and account status are re-read from the database
// on every request, so suspending, deactivating or demoting a user takes effect immediately
// instead of when their token expires.
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  let claims: { id: string };
  try { claims = jwt.verify(token, config.jwtSecret) as { id: string }; }
  catch { return res.status(401).json({ error: 'Invalid or expired token.' }); }
  try {
    const current = (await pool.query<{ role: Role; status: string }>('SELECT role, status FROM users WHERE id = $1', [claims.id])).rows[0];
    if (!current || current.status !== 'active') return res.status(401).json({ error: 'This account is no longer active.' });
    req.user = { id: claims.id, role: current.role };
    next();
  } catch (err) {
    next(err);
  }
}

export function allow(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission for this action.' });
    next();
  };
}
