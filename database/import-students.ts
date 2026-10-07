import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import path from 'path';
import { Pool, PoolClient } from 'pg';
import { parseCsv } from './lib/csv';

// Idempotent importer for the real CSE 2024–2028 student master sheet. Replaces the synthetic
// student population that database/seed-institutional-users.ts used to generate.
//
// Usage:
//   tsx database/import-students.ts <path-to-csv> [--dry-run] [--retire-synthetic] [--password-scope=test|all]
//
// Rules this importer enforces:
//   - Reg. No., Student Name, Department, Batch Year and Section are real data: they are only
//     trimmed of surrounding whitespace, never rewritten. A row whose real fields are missing or
//     invalid is REJECTED and reported — never guessed at. A Reg. No. that appears on more than one
//     row rejects every occurrence, since the sheet itself doesn't say which one is right.
//   - Matching is by Reg. No. (users.institutional_id). Re-running updates existing students and
//     only touches roster-owned columns: full_name, email, department, status and the roster fields
//     on student_profiles. Interests, tech stack, phone, teams, registrations, projects, achievements
//     and notifications are never touched, and nothing is ever deleted by the import itself.
//   - Passwords are never shared defaults baked into code. A new account gets no password (it can't
//     log in) unless STUDENT_INITIAL_PASSWORD is set, and then only for --password-scope rows
//     (default: test accounts only). An existing password is never overwritten.
//   - Test Account / Test Scenario / Role / Faculty Assignment are stored as metadata only; no
//     teams, registrations or other participation records are created from them.
//
// --retire-synthetic removes the generated studentNNN@unihack.edu accounts: deleted when nothing
// but their own profile/notifications refer to them, otherwise deactivated and marked
// 'synthetic_retired' so history (e.g. audit logs) stays intact.

const ROSTER_SOURCE = 'cse_2024_master';
const TARGET_DEPARTMENT = 'CSE';
const TARGET_BATCH_YEAR = 2024;

const REQUIRED_COLUMNS = [
  'Reg. No.', 'Student Name', 'Department', 'Batch Year', 'Section', 'SDE Status',
  'Institutional Email', 'Account Status', 'Role', 'Faculty Assignment', 'Test Account', 'Test Scenario',
] as const;
type Column = (typeof REQUIRED_COLUMNS)[number];

const ACCOUNT_STATUS: Record<string, 'active' | 'inactive' | 'suspended'> = { active: 'active', inactive: 'inactive', suspended: 'suspended' };

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const retireSynthetic = args.includes('--retire-synthetic');
const passwordScope = (args.find((a) => a.startsWith('--password-scope='))?.split('=')[1] ?? 'test') as 'test' | 'all';
const csvArg = args.find((a) => !a.startsWith('--'));

interface StudentRow {
  line: number;
  regNo: string;
  name: string;
  email: string;
  batchYear: number;
  section: string;
  sdeStatus: 'SDE' | 'Non-SDE';
  status: 'active' | 'inactive' | 'suspended';
  rosterRole: string;
  facultyAssignment: string | null;
  isTestAccount: boolean;
  testScenario: string | null;
}

interface Rejection { line: number; regNo: string; name: string; reasons: string[] }

function fail(message: string): never {
  console.error(`FATAL: ${message}`);
  process.exit(1);
}

function loadRows(csvPath: string): { rows: StudentRow[]; rejected: Rejection[]; totalDataRows: number } {
  const all = parseCsv(readFileSync(csvPath, 'utf8').replace(/^﻿/, '')).filter((r) => r.some((v) => v !== ''));
  const header = all[0] ?? [];
  const index = {} as Record<Column, number>;
  for (const column of REQUIRED_COLUMNS) {
    const i = header.indexOf(column);
    if (i === -1) fail(`CSV is missing the "${column}" column. Found: ${header.join(' | ')}`);
    index[column] = i;
  }

  const rows: StudentRow[] = [];
  const rejected: Rejection[] = [];
  const dataRows = all.slice(1);
  dataRows.forEach((f, i) => {
    const line = i + 2;
    const get = (c: Column) => (f[index[c]] ?? '').trim();
    const regNo = get('Reg. No.');
    const name = get('Student Name');
    const department = get('Department');
    const batch = get('Batch Year');
    const section = get('Section');
    const sde = get('SDE Status');
    const email = get('Institutional Email');
    const status = ACCOUNT_STATUS[get('Account Status').toLowerCase()];
    const testAccount = get('Test Account').toUpperCase();
    const reasons: string[] = [];

    if (!regNo) reasons.push('missing Reg. No.');
    else if (!/^[0-9]{2}[A-Z]{2,4}[0-9]{3,5}$/.test(regNo)) reasons.push(`Reg. No. "${regNo}" is not in the expected format`);
    if (!name) reasons.push('missing Student Name');
    if (department !== TARGET_DEPARTMENT) reasons.push(`Department "${department}" is not ${TARGET_DEPARTMENT}`);
    if (batch !== String(TARGET_BATCH_YEAR)) reasons.push(`Batch Year "${batch}" is not ${TARGET_BATCH_YEAR}`);
    if (!section) reasons.push('missing Section');
    else if (!/^[A-Z]{1,2}$/.test(section)) reasons.push(`Section "${section}" is not a section letter`);
    if (sde !== 'SDE' && sde !== 'Non-SDE') reasons.push(`SDE Status "${sde}" is not "SDE" or "Non-SDE"`);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reasons.push(`Institutional Email "${email}" is not a valid email`);
    if (!status) reasons.push(`Account Status "${get('Account Status')}" is not Active/Inactive/Suspended`);
    if (testAccount !== 'YES' && testAccount !== 'NO') reasons.push(`Test Account "${get('Test Account')}" is not YES/NO`);

    if (reasons.length) { rejected.push({ line, regNo, name, reasons }); return; }
    const scenario = get('Test Scenario');
    rows.push({
      line, regNo, name, email: email.toLowerCase(), batchYear: TARGET_BATCH_YEAR, section,
      sdeStatus: sde as StudentRow['sdeStatus'], status: status!, rosterRole: get('Role') || 'Student',
      // Metadata label only — internal whitespace runs collapsed ("Section    F Mentor").
      facultyAssignment: get('Faculty Assignment').replace(/\s+/g, ' ') || null,
      isTestAccount: testAccount === 'YES',
      testScenario: scenario && scenario.toUpperCase() !== 'NONE' ? scenario : null,
    });
  });

  // Duplicate Reg. No. / email inside the sheet: reject every occurrence, keep none.
  for (const key of ['regNo', 'email'] as const) {
    const seen = new Map<string, StudentRow[]>();
    for (const r of rows) {
      const k = r[key].toUpperCase();
      seen.set(k, [...(seen.get(k) ?? []), r]);
    }
    for (const [value, dupes] of seen) {
      if (dupes.length < 2) continue;
      for (const r of dupes) {
        rejected.push({ line: r.line, regNo: r.regNo, name: r.name, reasons: [`${key === 'regNo' ? 'Reg. No.' : 'email'} ${value} appears on ${dupes.length} rows (lines ${dupes.map((d) => d.line).join(', ')}) — cannot tell which is correct`] });
        rows.splice(rows.indexOf(r), 1);
      }
    }
  }
  // Rows rejected by validation for a different reason can also share a Reg. No. with a valid
  // row; that is still ambiguous, so the valid one is rejected too.
  const rejectedRegNos = new Set(rejected.map((r) => r.regNo.toUpperCase()).filter(Boolean));
  for (const r of [...rows]) {
    if (rejectedRegNos.has(r.regNo.toUpperCase())) {
      rejected.push({ line: r.line, regNo: r.regNo, name: r.name, reasons: ['Reg. No. also appears on a rejected row — cannot tell which is correct'] });
      rows.splice(rows.indexOf(r), 1);
    }
  }
  rejected.sort((a, b) => a.line - b.line);
  return { rows, rejected, totalDataRows: dataRows.length };
}

interface Summary {
  inserted: number;
  updated: number;
  unchanged: number;
  conflicts: Rejection[];
  passwordsSet: number;
  notInSheet: string[];
  syntheticDeleted: number;
  syntheticRetired: number;
}

async function writeRoster(client: PoolClient, rows: StudentRow[], summary: Summary): Promise<void> {
  const dept = (await client.query(`INSERT INTO departments (code, name) VALUES ($1, 'Computer Science and Engineering')
    ON CONFLICT (code) DO UPDATE SET code = EXCLUDED.code RETURNING id`, [TARGET_DEPARTMENT])).rows[0].id as string;

  // Existing accounts that would collide: a Reg. No. owned by a non-student, or an email already
  // used by a different Reg. No. Those rows are reported, not forced through.
  const { rows: existing } = await client.query<{ institutional_id: string; email: string; role: string }>(
    `SELECT institutional_id, email, role FROM users WHERE upper(institutional_id) = ANY($1::text[]) OR lower(email) = ANY($2::text[])`,
    [rows.map((r) => r.regNo.toUpperCase()), rows.map((r) => r.email)],
  );
  const byRegNo = new Map(existing.map((u) => [u.institutional_id.toUpperCase(), u]));
  const byEmail = new Map(existing.map((u) => [u.email.toLowerCase(), u]));
  const accepted = rows.filter((r) => {
    const owner = byRegNo.get(r.regNo.toUpperCase());
    if (owner && owner.role !== 'student') {
      summary.conflicts.push({ line: r.line, regNo: r.regNo, name: r.name, reasons: [`Reg. No. belongs to an existing ${owner.role} account`] });
      return false;
    }
    if (owner && owner.institutional_id !== r.regNo) {
      summary.conflicts.push({ line: r.line, regNo: r.regNo, name: r.name, reasons: [`Reg. No. exists in different letter case as ${owner.institutional_id}`] });
      return false;
    }
    const emailOwner = byEmail.get(r.email);
    if (emailOwner && emailOwner.institutional_id.toUpperCase() !== r.regNo.toUpperCase()) {
      summary.conflicts.push({ line: r.line, regNo: r.regNo, name: r.name, reasons: [`email ${r.email} already belongs to ${emailOwner.institutional_id}`] });
      return false;
    }
    return true;
  });

  const initialPassword = process.env.STUDENT_INITIAL_PASSWORD;
  if (initialPassword !== undefined && initialPassword.length < 8) fail('STUDENT_INITIAL_PASSWORD must be at least 8 characters.');
  const passwordHash = initialPassword ? await bcrypt.hash(initialPassword, 10) : null;
  const wantsPassword = (r: StudentRow) => passwordScope === 'all' || r.isTestAccount;

  // One set-based upsert; the WHERE on the UPDATE side skips rows whose roster fields are already
  // identical, so an unchanged re-import touches nothing (not even updated_at).
  const users = await client.query<{ id: string; institutional_id: string; inserted: boolean }>(
    `INSERT INTO users (institutional_id, email, full_name, role, department_id, status, password_hash)
     SELECT reg, email, name, 'student', $4::uuid, status::account_status, NULL
     FROM unnest($1::text[], $2::text[], $3::text[], $5::text[]) AS t(reg, email, name, status)
     ON CONFLICT (institutional_id) DO UPDATE SET
       email = EXCLUDED.email, full_name = EXCLUDED.full_name, department_id = EXCLUDED.department_id,
       status = EXCLUDED.status, updated_at = now()
     WHERE users.role = 'student' AND (users.email, users.full_name, users.department_id, users.status)
       IS DISTINCT FROM (EXCLUDED.email, EXCLUDED.full_name, EXCLUDED.department_id, EXCLUDED.status)
     RETURNING id, institutional_id, (xmax = 0) AS inserted`,
    [accepted.map((r) => r.regNo), accepted.map((r) => r.email), accepted.map((r) => r.name), dept, accepted.map((r) => r.status)],
  );
  const insertedIds = new Set(users.rows.filter((u) => u.inserted).map((u) => u.institutional_id));
  const userChanged = new Set(users.rows.filter((u) => !u.inserted).map((u) => u.institutional_id));

  const { rows: ids } = await client.query<{ id: string; institutional_id: string }>(
    'SELECT id, institutional_id FROM users WHERE institutional_id = ANY($1::text[])', [accepted.map((r) => r.regNo)],
  );
  const idByRegNo = new Map(ids.map((u) => [u.institutional_id, u.id]));

  // Initial password only where the account has none — never overwrites a password set later.
  if (passwordHash) {
    const targets = accepted.filter(wantsPassword).map((r) => idByRegNo.get(r.regNo)!);
    const res = await client.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = ANY($1::uuid[]) AND password_hash IS NULL', [targets, passwordHash]);
    summary.passwordsSet = res.rowCount ?? 0;
  }

  const profiles = await client.query<{ user_id: string }>(
    `INSERT INTO student_profiles (user_id, batch_year, section, sde_status, faculty_assignment, roster_role, is_test_account, test_scenario, roster_source, roster_updated_at)
     SELECT uid, batch, section, sde, fa, role, test, scenario, $9, now()
     FROM unnest($1::uuid[], $2::smallint[], $3::text[], $4::text[], $5::text[], $6::text[], $7::boolean[], $8::text[])
       AS t(uid, batch, section, sde, fa, role, test, scenario)
     ON CONFLICT (user_id) DO UPDATE SET
       batch_year = EXCLUDED.batch_year, section = EXCLUDED.section, sde_status = EXCLUDED.sde_status,
       faculty_assignment = EXCLUDED.faculty_assignment, roster_role = EXCLUDED.roster_role,
       is_test_account = EXCLUDED.is_test_account, test_scenario = EXCLUDED.test_scenario,
       roster_source = EXCLUDED.roster_source, roster_updated_at = now()
     WHERE (student_profiles.batch_year, student_profiles.section, student_profiles.sde_status, student_profiles.faculty_assignment,
            student_profiles.roster_role, student_profiles.is_test_account, student_profiles.test_scenario, student_profiles.roster_source)
       IS DISTINCT FROM (EXCLUDED.batch_year, EXCLUDED.section, EXCLUDED.sde_status, EXCLUDED.faculty_assignment,
            EXCLUDED.roster_role, EXCLUDED.is_test_account, EXCLUDED.test_scenario, EXCLUDED.roster_source)
     RETURNING user_id`,
    [
      accepted.map((r) => idByRegNo.get(r.regNo)!), accepted.map((r) => r.batchYear), accepted.map((r) => r.section),
      accepted.map((r) => r.sdeStatus), accepted.map((r) => r.facultyAssignment), accepted.map((r) => r.rosterRole),
      accepted.map((r) => r.isTestAccount), accepted.map((r) => r.testScenario), ROSTER_SOURCE,
    ],
  );
  const regNoById = new Map(ids.map((u) => [u.id, u.institutional_id]));
  const profileChanged = new Set(profiles.rows.map((p) => regNoById.get(p.user_id)!));

  for (const r of accepted) {
    if (insertedIds.has(r.regNo)) summary.inserted++;
    else if (userChanged.has(r.regNo) || profileChanged.has(r.regNo)) summary.updated++;
    else summary.unchanged++;
  }

  // Students a previous run imported but this sheet no longer lists: reported only. Removing a
  // real student is an administrative decision, not something a re-import should do silently.
  const { rows: missing } = await client.query<{ institutional_id: string }>(
    `SELECT u.institutional_id FROM users u JOIN student_profiles sp ON sp.user_id = u.id
     WHERE sp.roster_source = $1 AND NOT (u.institutional_id = ANY($2::text[])) ORDER BY 1`,
    [ROSTER_SOURCE, accepted.map((r) => r.regNo)],
  );
  summary.notInSheet = missing.map((m) => m.institutional_id);
}

// Tables (and columns) whose rows make a user more than a disposable generated account. Rows in
// student_profiles and notifications are the only ones allowed to cascade away with a deletion.
const USER_REFERENCES: [string, string][] = [
  ['audit_logs', 'actor_id'], ['team_members', 'user_id'], ['team_members', 'invited_by'], ['teams', 'created_by'],
  ['registrations', 'student_id'], ['registrations', 'reviewed_by'], ['projects', 'owner_id'], ['project_reviews', 'reviewer_id'],
  ['achievements', 'student_id'], ['achievements', 'verified_by'], ['files', 'uploaded_by'], ['hackathon_suggestions', 'submitted_by'],
  ['hackathon_suggestions', 'reviewed_by'], ['reminders', 'created_by'], ['announcements', 'author_id'], ['hackathons', 'coordinator_id'],
  ['system_settings', 'updated_by'], ['hackathon_interests', 'student_id'], ['hackathon_bookmarks', 'user_id'], ['push_tokens', 'user_id'],
  ['password_resets', 'user_id'],
];

async function retireSyntheticStudents(client: PoolClient, summary: Summary): Promise<void> {
  // Exactly the accounts database/seed-institutional-users.ts generated: role student, email
  // studentNNN@unihack.edu, roll number <DEPT><year 1-4><A|B><NNN>.
  const { rows: synthetic } = await client.query<{ id: string }>(
    `SELECT id FROM users WHERE role = 'student' AND email ~ '^student[0-9]{3}@unihack\\.edu$' AND institutional_id ~ '^[A-Z]+[1-4][AB][0-9]{3}$'`,
  );
  if (!synthetic.length) return;
  const ids = synthetic.map((s) => s.id);
  const referenced = new Set<string>();
  for (const [table, column] of USER_REFERENCES) {
    const { rows } = await client.query<{ id: string }>(`SELECT DISTINCT ${column} AS id FROM ${table} WHERE ${column} = ANY($1::uuid[])`, [ids]);
    rows.forEach((r) => referenced.add(r.id));
  }
  const deletable = ids.filter((id) => !referenced.has(id));
  const retire = ids.filter((id) => referenced.has(id));
  if (deletable.length) {
    summary.syntheticDeleted = (await client.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [deletable])).rowCount ?? 0;
  }
  if (retire.length) {
    const res = await client.query(`UPDATE users SET status = 'inactive', updated_at = now() WHERE id = ANY($1::uuid[]) AND status <> 'inactive'`, [retire]);
    await client.query(`UPDATE student_profiles SET roster_source = 'synthetic_retired', roster_updated_at = now() WHERE user_id = ANY($1::uuid[]) AND roster_source IS DISTINCT FROM 'synthetic_retired'`, [retire]);
    summary.syntheticRetired = res.rowCount ?? 0;
  }
}

function printSummary(rows: StudentRow[], rejected: Rejection[], totalDataRows: number, summary: Summary | null) {
  const count = (pick: (r: StudentRow) => string) => rows.reduce<Record<string, number>>((acc, r) => { acc[pick(r)] = (acc[pick(r)] ?? 0) + 1; return acc; }, {});
  console.log(`\n${summary ? '' : '[DRY RUN] '}Student roster import summary`);
  console.log('------------------------------');
  console.log(`Data rows read:         ${totalDataRows}`);
  console.log(`Valid rows:             ${rows.length}`);
  console.log(`Rejected rows:          ${rejected.length}`);
  console.log(`Sections:               ${Object.entries(count((r) => r.section)).sort().map(([k, v]) => `${k}=${v}`).join(' ')}`);
  console.log(`SDE status:             ${Object.entries(count((r) => r.sdeStatus)).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  console.log(`Test accounts:          ${rows.filter((r) => r.isTestAccount).length}`);
  if (summary) {
    console.log(`Inserted:               ${summary.inserted}`);
    console.log(`Updated:                ${summary.updated}`);
    console.log(`Unchanged:              ${summary.unchanged}`);
    console.log(`Conflicts (not written): ${summary.conflicts.length}`);
    console.log(`Initial passwords set:  ${summary.passwordsSet}${process.env.STUDENT_INITIAL_PASSWORD ? ` (scope: ${passwordScope})` : ' (STUDENT_INITIAL_PASSWORD not set — new accounts cannot log in yet)'}`);
    console.log(`Imported earlier, not in this sheet: ${summary.notInSheet.length}${summary.notInSheet.length ? ` (${summary.notInSheet.join(', ')})` : ''}`);
    if (retireSynthetic) console.log(`Synthetic students:     ${summary.syntheticDeleted} deleted, ${summary.syntheticRetired} deactivated (referenced elsewhere)`);
  }
  const problems = [...rejected, ...(summary?.conflicts ?? [])];
  if (problems.length) {
    console.log('\nRows NOT imported (fix in the sheet and re-run):');
    for (const p of problems) console.log(`  line ${p.line} — ${p.regNo || '(no Reg. No.)'} ${p.name}: ${p.reasons.join('; ')}`);
  }
}

async function main() {
  if (!csvArg) fail('Pass the path to the student master CSV: tsx database/import-students.ts <path-to-csv> [--dry-run] [--retire-synthetic]');
  if (passwordScope !== 'test' && passwordScope !== 'all') fail('--password-scope must be "test" or "all".');
  const { rows, rejected, totalDataRows } = loadRows(path.resolve(csvArg));

  if (dryRun) { printSummary(rows, rejected, totalDataRows, null); return; }

  const summary: Summary = { inserted: 0, updated: 0, unchanged: 0, conflicts: [], passwordsSet: 0, notInSheet: [], syntheticDeleted: 0, syntheticRetired: 0 };
  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://unihack:unihack_local_password@127.0.0.1:5432/unihack_ledger' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await writeRoster(client, rows, summary);
    if (retireSynthetic) await retireSyntheticStudents(client, summary);
    await client.query(`INSERT INTO audit_logs (actor_id, action, entity_type, metadata) VALUES (NULL, 'import', 'student_roster', $1)`, [{
      source: path.basename(csvArg), rowsRead: totalDataRows, inserted: summary.inserted, updated: summary.updated, unchanged: summary.unchanged,
      rejected: rejected.length + summary.conflicts.length, syntheticDeleted: summary.syntheticDeleted, syntheticRetired: summary.syntheticRetired,
    }]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
  printSummary(rows, rejected, totalDataRows, summary);
}

main().catch((err) => { console.error(err); process.exit(1); });
