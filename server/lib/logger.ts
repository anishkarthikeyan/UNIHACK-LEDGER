import pino from 'pino';
import { config } from '../config/env';

// Single structured logger for the whole server. Replaces ad hoc console.log/console.error
// scattered across route handlers with leveled, consistent output (debug/info/warn/error),
// pretty-printed in development and plain JSON (log-aggregator friendly) in production.
export const logger = pino({
  level: config.logLevel,
  transport: config.isDevelopment
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
    : undefined,
});

export type Logger = typeof logger;
