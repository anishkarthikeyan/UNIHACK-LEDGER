import { pool } from '../../db/pool';
import { studentScopeSql, Viewer } from '../../lib/scope';

// Reusable cohort analytics over Department → Batch → Section → SDE/Non-SDE → Student.
// Every query is computed ONLY over the students the viewer may see (server/lib/scope.ts), so the
// same function serves a section's Faculty Advisor, an SDE Coordinator and the HOD with
// correctly different numbers. Only active student accounts count.
//
// Participation: a student participates in a registration they made solo, or one made by a team
// they are an active member of. "participating" = submitted / pending verification / approved;
// "verified" = approved. Rejected, withdrawn and draft registrations don't count.
//
// Wins: an approved achievement with result winner or runner_up. A team achievement credits
// every active member of the team, so a student "has a win" if they logged one or their team did.

export interface CohortFilters { batchYear?: number; section?: string; sdeStatus?: 'SDE' | 'Non-SDE' }

const PARTICIPATING = `('submitted', 'pending_verification', 'approved')`;

// $1 viewer id, $2 batch, $3 section, $4 sde status — shared by every query below.
function scopedCte(viewer: Viewer): string {
  return `scoped AS (
    SELECT u.id, u.full_name, u.email, u.institutional_id, d.code AS department_code, sp.batch_year, sp.section, sp.sde_status
    FROM users u JOIN student_profiles sp ON sp.user_id = u.id LEFT JOIN departments d ON d.id = u.department_id
    WHERE u.role = 'student' AND u.status = 'active' AND ${studentScopeSql(viewer.role, '$1')}
      AND ($2::smallint IS NULL OR sp.batch_year = $2) AND ($3::text IS NULL OR sp.section = $3) AND ($4::text IS NULL OR sp.sde_status = $4)
  ),
  participation AS (
    SELECT s.id AS student_id, r.id AS registration_id, r.status, r.hackathon_id, r.team_id
    FROM scoped s JOIN registrations r ON r.student_id = s.id
    UNION
    SELECT s.id, r.id, r.status, r.hackathon_id, r.team_id
    FROM scoped s JOIN team_members tm ON tm.user_id = s.id AND tm.status = 'active' JOIN registrations r ON r.team_id = tm.team_id
  ),
  student_wins AS (
    SELECT s.id AS student_id, a.id AS achievement_id, a.hackathon_id, a.result
    FROM scoped s JOIN achievements a ON a.status = 'approved' AND a.result IN ('winner', 'runner_up')
      AND (a.student_id = s.id OR a.team_id IN (SELECT team_id FROM team_members WHERE user_id = s.id AND status = 'active'))
  )`;
}

function params(viewer: Viewer, f: CohortFilters): unknown[] {
  return [viewer.id, f.batchYear ?? null, f.section ?? null, f.sdeStatus ?? null];
}

/** 1 + 3: total students and SDE vs Non-SDE totals. */
export async function cohortTotals(viewer: Viewer, f: CohortFilters = {}) {
  const { rows } = await pool.query(`WITH ${scopedCte(viewer)}
    SELECT COUNT(*)::int AS total_students,
      COUNT(*) FILTER (WHERE sde_status = 'SDE')::int AS sde,
      COUNT(*) FILTER (WHERE sde_status = 'Non-SDE')::int AS non_sde,
      COUNT(DISTINCT section)::int AS sections,
      (SELECT COUNT(DISTINCT student_id) FROM participation WHERE status IN ${PARTICIPATING})::int AS participating_students,
      (SELECT COUNT(DISTINCT student_id) FROM student_wins)::int AS winning_students,
      (SELECT COUNT(DISTINCT achievement_id) FROM student_wins)::int AS wins,
      (SELECT COUNT(DISTINCT team_id) FROM participation WHERE team_id IS NOT NULL AND status IN ${PARTICIPATING})::int AS teams
    FROM scoped`, params(viewer, f));
  return rows[0];
}

/** 2 + 4: per department/batch/section totals with the SDE breakdown. */
export async function sectionBreakdown(viewer: Viewer, f: CohortFilters = {}) {
  const { rows } = await pool.query(`WITH ${scopedCte(viewer)}
    SELECT department_code, batch_year, section, COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE sde_status = 'SDE')::int AS sde,
      COUNT(*) FILTER (WHERE sde_status = 'Non-SDE')::int AS non_sde
    FROM scoped GROUP BY department_code, batch_year, section ORDER BY department_code, batch_year, section`, params(viewer, f));
  return rows;
}

/** 6: participation by section. */
export async function participationBySection(viewer: Viewer, f: CohortFilters = {}) {
  const { rows } = await pool.query(`WITH ${scopedCte(viewer)}
    SELECT s.section, COUNT(DISTINCT s.id)::int AS students,
      COUNT(DISTINCT p.student_id) FILTER (WHERE p.status IN ${PARTICIPATING})::int AS participating_students,
      COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'approved')::int AS verified_students,
      COUNT(DISTINCT p.registration_id) FILTER (WHERE p.status = 'pending_verification')::int AS pending_registrations,
      COUNT(DISTINCT p.team_id) FILTER (WHERE p.status IN ${PARTICIPATING})::int AS teams,
      (SELECT COUNT(DISTINCT w.student_id) FROM student_wins w JOIN scoped x ON x.id = w.student_id WHERE x.section = s.section)::int AS winning_students,
      (SELECT COUNT(DISTINCT w.achievement_id) FROM student_wins w JOIN scoped x ON x.id = w.student_id WHERE x.section = s.section)::int AS wins
    FROM scoped s LEFT JOIN participation p ON p.student_id = s.id
    GROUP BY s.section ORDER BY s.section`, params(viewer, f));
  return rows;
}

/** 7: participation by SDE / Non-SDE. */
export async function participationBySde(viewer: Viewer, f: CohortFilters = {}) {
  const { rows } = await pool.query(`WITH ${scopedCte(viewer)}
    SELECT s.sde_status, COUNT(DISTINCT s.id)::int AS students,
      COUNT(DISTINCT p.student_id) FILTER (WHERE p.status IN ${PARTICIPATING})::int AS participating_students,
      COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'approved')::int AS verified_students,
      (SELECT COUNT(DISTINCT w.student_id) FROM student_wins w JOIN scoped x ON x.id = w.student_id WHERE x.sde_status = s.sde_status)::int AS winning_students,
      (SELECT COUNT(DISTINCT w.achievement_id) FROM student_wins w JOIN scoped x ON x.id = w.student_id WHERE x.sde_status = s.sde_status)::int AS wins
    FROM scoped s LEFT JOIN participation p ON p.student_id = s.id
    GROUP BY s.sde_status ORDER BY s.sde_status`, params(viewer, f));
  return rows;
}

/** Hackathon participation overview: how many in-scope students each hackathon involves. */
export async function hackathonParticipation(viewer: Viewer, f: CohortFilters = {}) {
  const { rows } = await pool.query(`WITH ${scopedCte(viewer)}
    SELECT h.id AS hackathon_id, h.title, h.status AS hackathon_status,
      COUNT(DISTINCT p.student_id) FILTER (WHERE p.status IN ${PARTICIPATING})::int AS participating_students,
      COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'approved')::int AS verified_students,
      COUNT(DISTINCT p.registration_id) FILTER (WHERE p.status = 'pending_verification')::int AS pending_registrations,
      COUNT(DISTINCT p.team_id) FILTER (WHERE p.status IN ${PARTICIPATING})::int AS teams,
      (SELECT COUNT(DISTINCT w.achievement_id) FROM student_wins w WHERE w.hackathon_id = h.id)::int AS wins,
      (SELECT COUNT(DISTINCT w.student_id) FROM student_wins w WHERE w.hackathon_id = h.id)::int AS winning_students
    FROM participation p JOIN hackathons h ON h.id = p.hackathon_id
    GROUP BY h.id ORDER BY participating_students DESC, h.title`, params(viewer, f));
  return rows;
}

/** 5: student lookup inside the viewer's scope, with per-student participation counts. */
export async function studentLookup(viewer: Viewer, f: CohortFilters & { search?: string } = {}) {
  const { rows } = await pool.query(`WITH ${scopedCte(viewer)}
    SELECT s.id, s.full_name, s.email, s.institutional_id, s.department_code, s.batch_year, s.section, s.sde_status,
      student_year_of_study(s.batch_year) AS year_of_study,
      (SELECT COUNT(*)::int FROM projects pr WHERE pr.owner_id = s.id) AS project_count,
      COUNT(DISTINCT p.registration_id) FILTER (WHERE p.status = 'approved')::int AS hackathon_count,
      COUNT(DISTINCT p.registration_id) FILTER (WHERE p.status IN ${PARTICIPATING})::int AS participating_count
    FROM scoped s LEFT JOIN participation p ON p.student_id = s.id
    WHERE ($5::text = '' OR s.full_name ILIKE '%' || $5 || '%' OR s.institutional_id ILIKE '%' || $5 || '%')
    GROUP BY s.id, s.full_name, s.email, s.institutional_id, s.department_code, s.batch_year, s.section, s.sde_status
    ORDER BY s.section, s.institutional_id`, [...params(viewer, f), f.search ?? '']);
  return rows;
}

/** One student's profile + participation, or null when outside the viewer's scope. */
export async function studentDetail(viewer: Viewer, studentId: string) {
  const { rows } = await pool.query(`WITH ${scopedCte(viewer)} SELECT *, student_year_of_study(batch_year) AS year_of_study FROM scoped WHERE id = $5`, [...params(viewer, {}), studentId]);
  const student = rows[0];
  if (!student) return null;
  const [registrations, teams, achievements] = await Promise.all([
    pool.query(`SELECT r.id, r.status, r.participation_mode, r.submitted_at, r.reviewed_at, r.rejection_reason, h.id AS hackathon_id, h.title AS hackathon_title, t.name AS team_name
      FROM registrations r JOIN hackathons h ON h.id = r.hackathon_id LEFT JOIN teams t ON t.id = r.team_id
      WHERE r.student_id = $1 OR r.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1 AND status = 'active')
      ORDER BY r.created_at DESC`, [studentId]),
    pool.query(`SELECT t.id, t.name, tm.member_role, tm.status FROM team_members tm JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = $1 ORDER BY t.created_at DESC`, [studentId]),
    pool.query(`SELECT a.id, a.title, a.outcome, a.status, a.achieved_on FROM achievements a WHERE a.student_id = $1 ORDER BY a.created_at DESC`, [studentId]),
  ]);
  return { ...student, registrations: registrations.rows, teams: teams.rows, achievements: achievements.rows };
}
