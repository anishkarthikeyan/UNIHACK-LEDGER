import { NextFunction, Response, RequestHandler } from 'express';

// Express 4 does not catch rejected promises thrown from async route handlers; without this,
// any failed query would crash the process instead of returning a 500. (Moved verbatim from the
// original monolithic server/index.ts — behavior is unchanged.)
export function ah(fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => { fn(req, res, next).catch(next); };
}
