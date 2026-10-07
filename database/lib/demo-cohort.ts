import { Pool, PoolClient } from 'pg';

// Shared by seed-demo.ts and reset-demo.ts: the CSE 2024 department-wide demo.
// 17 sections (A–Q), one Faculty Advisor each (test.faculty.<section>@unihack.edu), the HOD
// (test.hod@unihack.edu), and every active student. All demo logins use DEMO_PASSWORD.
//
// Per section one LIVE student is held back with no seeded activity, for the hand-run part of a
// demo: the section's existing test account if it has one, otherwise its lowest Reg. No.

export const DEMO_PASSWORD = 'Demo@123';
export const DEMO_BATCH = 2024;
export const DEMO_SECTIONS = 'ABCDEFGHIJKLMNOPQ'.split('');

export const facultyEmail = (section: string) => `test.faculty.${section.toLowerCase()}@unihack.edu`;
export const HOD_EMAIL = 'test.hod@unihack.edu';

export interface DemoStudent { id: string; email: string; institutionalId: string; name: string; section: string; sde: string; live: boolean }

export async function demoStudents(db: Pool | PoolClient): Promise<DemoStudent[]> {
  const { rows } = await db.query(
    `SELECT u.id, u.email, u.institutional_id, u.full_name, sp.section, sp.sde_status,
       row_number() OVER (PARTITION BY sp.section ORDER BY sp.is_test_account DESC, u.institutional_id) = 1 AS live
     FROM users u JOIN student_profiles sp ON sp.user_id = u.id JOIN departments d ON d.id = u.department_id
     WHERE u.role = 'student' AND u.status = 'active' AND d.code = 'CSE' AND sp.batch_year = $1 AND sp.section = ANY($2)
     ORDER BY sp.section, u.institutional_id`,
    [DEMO_BATCH, DEMO_SECTIONS],
  );
  return rows.map((r) => ({ id: r.id, email: r.email, institutionalId: r.institutional_id, name: r.full_name, section: r.section, sde: r.sde_status, live: r.live }));
}
