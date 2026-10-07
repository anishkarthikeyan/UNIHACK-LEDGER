import { pool } from '../db/pool';
import { isStaff, Role } from '../middleware/auth';

// The one place that decides which students a viewer may see. Every route that returns or acts
// on student data composes these SQL fragments instead of writing its own role checks.
//
//   admin            → every student (system role)
//   hod              → students covered by their staff_scope_assignments (department-wide)
//   coordinator      → students covered by their assignments (department + batch)
//   sde_coordinator  → students covered by their assignments AND sde_status = 'SDE'
//   faculty          → students covered by their assignments (assigned sections)
//   student          → only themselves
//
// `viewerParam` is the bind placeholder (e.g. '$1') holding the viewer's user id. The fragments
// never interpolate user input — only fixed aliases chosen by the caller.

export interface Viewer { id: string; role: Role }

// Every branch references viewerParam: Postgres rejects a query whose bind parameter is never used
// ("could not determine data type of parameter"), so admin's "everything" is spelled as a
// tautology over the parameter rather than a bare TRUE.
const everyone = (viewerParam: string) => `(${viewerParam}::uuid IS NOT NULL)`;

/** Boolean SQL restricting a student row (aliases: users `u`, student_profiles `sp`) to the viewer's scope. */
export function studentScopeSql(role: Role, viewerParam: string, u = 'u', sp = 'sp'): string {
  if (role === 'admin') return everyone(viewerParam);
  if (role === 'student') return `${u}.id = ${viewerParam}`;
  if (!isStaff(role)) return `(${viewerParam}::uuid IS NULL)`;
  const covered = `EXISTS (SELECT 1 FROM staff_scope_assignments ssa WHERE ssa.user_id = ${viewerParam}
      AND ssa.department_id = ${u}.department_id
      AND (ssa.batch_year IS NULL OR ssa.batch_year = ${sp}.batch_year)
      AND (ssa.section IS NULL OR ssa.section = ${sp}.section))`;
  return role === 'sde_coordinator' ? `(${covered} AND ${sp}.sde_status = 'SDE')` : covered;
}

/** Boolean SQL: is the student whose id is `studentIdExpr` within the viewer's scope? */
export function studentIdInScopeSql(role: Role, viewerParam: string, studentIdExpr: string): string {
  if (role === 'admin') return everyone(viewerParam);
  return `EXISTS (SELECT 1 FROM users u_s LEFT JOIN student_profiles sp_s ON sp_s.user_id = u_s.id
      WHERE u_s.id = ${studentIdExpr} AND u_s.role = 'student' AND ${studentScopeSql(role, viewerParam, 'u_s', 'sp_s')})`;
}

/** The student a registration belongs to: the solo registrant, or the team's leader. */
export function registrationOwnerSql(r = 'r'): string {
  return `COALESCE(${r}.student_id, (SELECT tm_o.user_id FROM team_members tm_o WHERE tm_o.team_id = ${r}.team_id AND tm_o.member_role = 'leader' LIMIT 1))`;
}

/** Boolean SQL: does team `teamIdExpr` have at least one active member inside the viewer's scope? */
export function teamInScopeSql(role: Role, viewerParam: string, teamIdExpr: string): string {
  if (role === 'admin') return everyone(viewerParam);
  return `EXISTS (SELECT 1 FROM team_members tm_s WHERE tm_s.team_id = ${teamIdExpr} AND tm_s.status = 'active'
      AND ${studentIdInScopeSql(role, viewerParam, 'tm_s.user_id')})`;
}

export async function canAccessStudent(viewer: Viewer, studentId: string): Promise<boolean> {
  // The existence check keeps $2 referenced (and typed) for admin too.
  const { rowCount } = await pool.query(`SELECT 1 FROM users WHERE id = $2::uuid AND role = 'student' AND ${studentIdInScopeSql(viewer.role, '$1', '$2::uuid')}`, [viewer.id, studentId]);
  return Boolean(rowCount);
}

export async function canAccessTeam(viewer: Viewer, teamId: string): Promise<boolean> {
  const { rowCount } = await pool.query(`SELECT 1 FROM teams WHERE id = $2::uuid AND ${teamInScopeSql(viewer.role, '$1', '$2::uuid')}`, [viewer.id, teamId]);
  return Boolean(rowCount);
}

/** The viewer's scope assignments, for showing "what can I see" in the UI. */
export async function scopeAssignmentsOf(userId: string) {
  const { rows } = await pool.query(`SELECT a.id, d.code AS department_code, d.name AS department_name, a.batch_year, a.section
    FROM staff_scope_assignments a JOIN departments d ON d.id = a.department_id
    WHERE a.user_id = $1 ORDER BY d.code, a.batch_year NULLS FIRST, a.section NULLS FIRST`, [userId]);
  return rows;
}
