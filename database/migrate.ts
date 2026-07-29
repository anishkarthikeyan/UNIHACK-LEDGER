import 'dotenv/config';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal, framework-free migration runner consistent with this project's raw-SQL/pg
// approach (there is no Prisma/knex here). Applies every *.sql file in
// database/migrations, in filename order, that isn't already recorded in
// schema_migrations. Safe to run repeatedly.

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://unihack:unihack_local_password@127.0.0.1:5433/unihack_ledger' });
const migrationsDir = path.join(__dirname, 'migrations');

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const { rows: applied } = await pool.query('SELECT name FROM schema_migrations');
  const appliedNames = new Set(applied.map((r) => r.name as string));

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const pending = files.filter((f) => !appliedNames.has(f));

  if (!pending.length) {
    console.log('No pending migrations.');
    await pool.end();
    return;
  }

  for (const file of pending) {
    const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Applied ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Failed to apply ${file}:`, err);
      await pool.end();
      process.exit(1);
    } finally {
      client.release();
    }
  }

  await pool.end();
}

main();
