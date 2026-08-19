import { Pool } from 'pg';
import { config } from '../config/env';
import { logger } from '../lib/logger';

// Single shared connection pool. Every route/service imports this instead of constructing its
// own Pool — that was already the case implicitly (one `pool` const in the old monolithic
// index.ts); this just gives that pool a stable home now that routes live in separate modules.
//
// SSL: Railway's managed Postgres (both the internal-network and public proxy connection
// strings) expects a TLS handshake; `rejectUnauthorized: false` is the standard pattern for it
// (and most other managed Postgres providers) because the server's cert isn't issued against a
// hostname `pg`'s default CA bundle trusts, not because verification is unimportant — the
// connection itself is still encrypted, and DATABASE_URL is only ever configured, never accepted
// from an untrusted source. Left undefined locally — a native Postgres install has no TLS
// listener configured at all, and forcing SSL there would just fail to connect.
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.isProduction ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  // Fires for errors on idle clients (e.g. the DB restarting) — without a handler here, an
  // unhandled 'error' event on the pool crashes the whole process.
  logger.error({ err }, 'Unexpected error on idle Postgres client');
});

export async function checkDatabaseConnection(): Promise<void> {
  await pool.query('SELECT 1');
}
