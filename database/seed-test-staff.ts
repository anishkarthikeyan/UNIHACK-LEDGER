import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

// Controlled-testing staff accounts for the CSE hierarchy (Phase 2 RBAC). These are NOT real
// people: every name starts with "TEST" and every email with "test.". Real staff are created by an
// admin (Admin → Users) and given scope via Admin → Scope Assignments.
//
// Idempotent: upserts by email, re-syncs role/department, and adds each scope row only if missing.
// Passwords: TEST_STAFF_PASSWORD (>= 8 chars) is applied only to accounts that have no password
// yet — an existing password is never overwritten. Without it, new accounts cannot log in.
//
// Usage: tsx database/seed-test-staff.ts

const BATCH = 2024;
// One Faculty Advisor per CSE 2024 section (A–Q).
const SECTIONS = 'ABCDEFGHIJKLMNOPQ'.split('');
const ACCOUNTS: { email: string; institutionalId: string; fullName: string; role: 'faculty' | 'coordinator' | 'sde_coordinator' | 'hod'; scopes: { batch: number | null; section: string | null }[] }[] = [
  ...SECTIONS.map((sec) => ({
    email: `test.faculty.${sec.toLowerCase()}@unihack.edu`, institutionalId: `TEST-FA-CSE-${sec}`, fullName: `TEST Faculty Advisor (Section ${sec})`,
    role: 'faculty' as const, scopes: [{ batch: BATCH, section: sec }],
  })),
  { email: 'test.coordinator@unihack.edu', institutionalId: 'TEST-CO-CSE', fullName: 'TEST Coordinator (CSE 2024)', role: 'coordinator', scopes: [{ batch: BATCH, section: null }] },
  { email: 'test.sdecoordinator@unihack.edu', institutionalId: 'TEST-SDE-CSE', fullName: 'TEST SDE Coordinator (CSE 2024)', role: 'sde_coordinator', scopes: [{ batch: BATCH, section: null }] },
  { email: 'test.hod@unihack.edu', institutionalId: 'TEST-HOD-CSE', fullName: 'TEST HOD (CSE)', role: 'hod', scopes: [{ batch: null, section: null }] },
];

async function main() {
  const password = process.env.TEST_STAFF_PASSWORD;
  if (password !== undefined && password.length < 8) throw new Error('TEST_STAFF_PASSWORD must be at least 8 characters.');
  const hash = password ? await bcrypt.hash(password, 10) : null;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://unihack:unihack_local_password@127.0.0.1:5432/unihack_ledger' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dept = (await client.query(`SELECT id FROM departments WHERE code = 'CSE'`)).rows[0];
    if (!dept) throw new Error('Department CSE not found — run the student import first.');
    for (const a of ACCOUNTS) {
      const { rows } = await client.query(
        `INSERT INTO users (institutional_id, email, full_name, role, department_id, status, password_hash)
         VALUES ($1,$2,$3,$4,$5,'active',$6)
         ON CONFLICT (email) DO UPDATE SET institutional_id = EXCLUDED.institutional_id, full_name = EXCLUDED.full_name,
           role = EXCLUDED.role, department_id = EXCLUDED.department_id,
           password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash), updated_at = now()
         RETURNING id, (xmax = 0) AS inserted`,
        [a.institutionalId, a.email, a.fullName, a.role, dept.id, hash],
      );
      const id = rows[0].id;
      await client.query(`INSERT INTO faculty_profiles (user_id, designation) VALUES ($1, 'Test account') ON CONFLICT (user_id) DO NOTHING`, [id]);
      // The account's scope is exactly what's listed here — stale rows from an earlier run are removed.
      await client.query('DELETE FROM staff_scope_assignments WHERE user_id = $1', [id]);
      for (const s of a.scopes) {
        await client.query('INSERT INTO staff_scope_assignments (user_id, department_id, batch_year, section) VALUES ($1,$2,$3,$4)', [id, dept.id, s.batch, s.section]);
      }
      console.log(`${rows[0].inserted ? 'created' : 'updated'}  ${a.role.padEnd(16)} ${a.email}  scope: CSE ${a.scopes.map((s) => `${s.batch ?? 'all batches'}${s.section ? ` / ${s.section}` : ''}`).join(', ')}`);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
  console.log(password ? 'Initial passwords applied where missing.' : 'TEST_STAFF_PASSWORD not set — new accounts have no password and cannot log in.');
}

main().catch((err) => { console.error(err); process.exit(1); });
