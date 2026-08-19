import { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

// Centralized error handler — must be registered last, after every route. Logs the full error
// server-side (structured, with stack) but never leaks internals to the client.
export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error({ err: error, method: req.method, path: req.path }, 'Unhandled request error');
  res.status(500).json({ error: 'An unexpected server error occurred.' });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Not found.' });
}
