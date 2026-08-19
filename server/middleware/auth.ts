import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export type Role = 'student' | 'faculty' | 'admin';
export type AuthRequest = Request & { user?: { id: string; role: Role } };

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try { req.user = jwt.verify(token, config.jwtSecret) as { id: string; role: Role }; next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired token.' }); }
}

export function allow(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission for this action.' });
    next();
  };
}
