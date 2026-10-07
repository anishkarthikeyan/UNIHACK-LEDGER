import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Pool, PoolClient } from 'pg';

// Stage 2A: deterministic synthetic FACULTY + admin dataset (40 faculty, 1 admin). Every name is
// an obvious, literal placeholder ("Faculty 003", ...), not a fabricated human identity.
//
// Students are NOT seeded here any more: the real CSE 2024–2028 roster is loaded by
// database/import-students.ts (npm run db:import:students). The synthetic studentNNN@unihack.edu
// accounts this script used to generate are removed by that importer's --retire-synthetic flag.
//
// Idempotent by design, matching database/import-competitions.ts's pattern: upserts keyed on
// `email` (the natural key), safe to run repeatedly, never touches unrelated data (competitions,
// teams, registrations, audit logs, ...). password_hash is deliberately excluded from the
// UPDATE side of the upsert — re-running this script must not silently reset a password that
// was since changed through the app (e.g. via /auth/reset-password).
//
// Usage: tsx database/seed-institutional-users.ts [--dry-run]

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science and Engineering' },
  { code: 'IT', name: 'Information Technology' },
  { code: 'AIDS', name: 'Artificial Intelligence and Data Science' },
  { code: 'ECE', name: 'Electronics and Communication Engineering' },
  { code: 'EEE', name: 'Electrical and Electronics Engineering' },
  { code: 'MECH', name: 'Mechanical Engineering' },
  { code: 'CIVIL', name: 'Civil Engineering' },
  { code: 'CYBER', name: 'Cyber Security' },
  { code: 'IOT', name: 'Internet of Things' },
  { code: 'EIE', name: 'Electronics and Instrumentation Engineering' },
] as const;

const FACULTY_PER_DEPARTMENT = 4; // 10 depts × 4 = 40

const OLD_DEMO_EMAILS = ['student@demo.edu', 'faculty@demo.edu', 'admin@demo.edu'];

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

interface FacultySeed {
  email: string;
  fullName: string;
  institutionalId: string;
  deptCode: string;
}

function buildFaculty(): FacultySeed[] {
  const faculty: FacultySeed[] = [];
  let seq = 0;
  for (const dept of DEPARTMENTS) {
    for (let i = 1; i <= FACULTY_PER_DEPARTMENT; i++) {
      seq += 1;
      faculty.push({
        email: `faculty${pad(seq, 3)}@unihack.edu`,
        fullName: `Faculty ${pad(seq, 3)}`,
        institutionalId: `FAC-${dept.code}-${pad(i, 2)}`,
        deptCode: dept.code,
      });
    }
  }
  return faculty;
}

async function upsertDepartments(client: PoolClient): Promise<Map<string, string>> {
  const idByCode = new Map<string, string>();
  for (const dept of DEPARTMENTS) {
    const { rows } = await client.query(
      `INSERT INTO departments (code, name) VALUES ($1,$2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [dept.code, dept.name],
    );
    idByCode.set(dept.code, rows[0].id);
  }
  return idByCode;
}

async function upsertUser(
  client: PoolClient,
  input: { institutionalId: string; email: string; passwordHash: string; fullName: string; role: 'student' | 'faculty' | 'admin'; departmentId: string | null },
): Promise<{ id: string; inserted: boolean }> {
  const { rows } = await client.query(
    `INSERT INTO users (institutional_id, email, password_hash, full_name, role, department_id, status)
     VALUES ($1,$2,$3,$4,$5,$6,'active')
     ON CONFLICT (email) DO UPDATE SET
       institutional_id = EXCLUDED.institutional_id,
       full_name = EXCLUDED.full_name,
       role = EXCLUDED.role,
       department_id = EXCLUDED.department_id,
       status = 'active',
       updated_at = now()
     RETURNING id, (xmax = 0) AS inserted`,
    [input.institutionalId, input.email, input.passwordHash, input.fullName, input.role, input.departmentId],
  );
  return { id: rows[0].id, inserted: rows[0].inserted };
}

async function main() {
  const faculty = buildFaculty();

  // Sanity-check the deterministic generation itself before touching the database — catches a
  // logic bug in this script rather than a bad partial write.
  const dupEmails = new Set<string>();
  const seenEmails = new Set<string>();
  const seenRolls = new Set<string>();
  for (const s of faculty) {
    if (seenEmails.has(s.email)) dupEmails.add(s.email); else seenEmails.add(s.email);
    if (seenRolls.has(s.institutionalId)) throw new Error(`Duplicate institutional_id generated: ${s.institutionalId}`);
    seenRolls.add(s.institutionalId);
  }
  if (dupEmails.size) throw new Error(`Duplicate emails generated: ${[...dupEmails].join(', ')}`);
  if (faculty.length !== 40) throw new Error(`Expected 40 faculty, generated ${faculty.length}`);

  console.log(`Generated ${faculty.length} faculty, 1 admin (all deterministic, all synthetic). Students come from import-students.ts.`);

  if (dryRun) {
    console.log('[DRY RUN] No database changes made.');
    console.log('Sample faculty:', faculty.slice(0, 2), '...', faculty.slice(-1));
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://unihack:unihack_local_password@127.0.0.1:5432/unihack_ledger' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const deptIdByCode = await upsertDepartments(client);

    const facultyPasswordHash = await bcrypt.hash('Demo@123', 10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

    let facultyInserted = 0;
    let facultyUpdated = 0;
    for (const f of faculty) {
      const deptId = deptIdByCode.get(f.deptCode) ?? null;
      const { id, inserted } = await upsertUser(client, {
        institutionalId: f.institutionalId, email: f.email, passwordHash: facultyPasswordHash,
        fullName: f.fullName, role: 'faculty', departmentId: deptId,
      });
      inserted ? facultyInserted++ : facultyUpdated++;
      await client.query(
        `INSERT INTO faculty_profiles (user_id, designation, can_manage_all_hackathons)
         VALUES ($1,'Assistant Professor', FALSE)
         ON CONFLICT (user_id) DO UPDATE SET designation = EXCLUDED.designation`,
        [id],
      );
    }

    const adminResult = await upsertUser(client, {
      institutionalId: 'ADMIN-001', email: 'admin@unihack.edu', passwordHash: adminPasswordHash,
      fullName: 'System Administrator', role: 'admin', departmentId: null,
    });

    // Old demo accounts: deactivated, never deleted — all three have real referencing rows
    // (audit_logs at minimum; student@demo.edu also has team memberships and notifications).
    // `status = 'inactive'` already blocks login (see server/routes/auth.routes.ts) without
    // touching a single foreign key or audit record.
    const deactivated = await client.query(
      `UPDATE users SET status = 'inactive', updated_at = now()
       WHERE email = ANY($1) AND status = 'active'
       RETURNING email`,
      [OLD_DEMO_EMAILS],
    );

    await client.query('COMMIT');

    console.log('\nSeed summary');
    console.log('------------');
    console.log(`Departments upserted: ${DEPARTMENTS.length}`);
    console.log(`Faculty — inserted: ${facultyInserted}, updated: ${facultyUpdated}`);
    console.log(`Admin — ${adminResult.inserted ? 'inserted' : 'updated'}: admin@unihack.edu`);
    console.log(`Old demo accounts deactivated this run: ${deactivated.rows.map((r) => r.email).join(', ') || '(none — already inactive)'}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
