import 'dotenv/config';
import { Pool } from 'pg';

// Wipes ALL student activity so the demo can be seeded again: teams, registrations, projects,
// achievements, suggestions (and the hackathons created from them), interests, bookmarks,
// reminders and notifications. Accounts, passwords, scope assignments, the imported competitions
// and the audit log are kept.
//
// This is for the local demo database only — it does not distinguish seeded from real activity.
// Usage: tsx database/reset-demo.ts --yes
const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://unihack:unihack_local_password@127.0.0.1:5432/unihack_ledger' });

async function main() {
  if (!process.argv.includes('--yes')) {
    console.error('This deletes every team, registration, project, achievement, suggestion and notification. Re-run with --yes to confirm.');
    process.exitCode = 1;
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const del = async (label: string, sql: string) => console.log(`${label.padEnd(22)} ${(await client.query(sql)).rowCount}`);
    await del('registrations', 'DELETE FROM registrations');
    await del('project reviews/projects', 'DELETE FROM projects');
    await del('achievements', 'DELETE FROM achievements');
    await del('teams', 'DELETE FROM teams');
    await del('interests', 'DELETE FROM hackathon_interests');
    await del('bookmarks', 'DELETE FROM hackathon_bookmarks');
    await del('reminders', 'DELETE FROM reminders');
    await del('notifications', 'DELETE FROM notifications');
    await del('suggestions', 'DELETE FROM hackathon_suggestions');
    await del('suggested hackathons', `DELETE FROM hackathons WHERE source = 'student_suggestion'`);
    await client.query('COMMIT');
    console.log('Demo activity reset. Run `npm run db:seed:demo` to seed again.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

main().catch((err) => { console.error(err); process.exitCode = 1; }).finally(() => pool.end());
