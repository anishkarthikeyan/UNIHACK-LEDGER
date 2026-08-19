import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { config } from '../config/env';

// General API rate limit — generous, just a backstop against runaway clients/scripts.
export const apiRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit on login specifically — this is the brute-force-protection gap flagged in the
// earlier project audit ("no rate limiting/lockout on /auth/login"). Keyed by IP + attempted
// email so one slow/shared IP (e.g. a campus NAT) can't lock out unrelated accounts.
export const authRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  // Must go through express-rate-limit's own ipKeyGenerator helper rather than raw req.ip —
  // it normalizes IPv6 addresses to a /56 subnet so one user can't bypass the limit by cycling
  // through addresses in their own /64, and without it express-rate-limit refuses to start.
  keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}:${typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''}`,
  message: { error: 'Too many login attempts. Please wait a few minutes and try again.' },
});
