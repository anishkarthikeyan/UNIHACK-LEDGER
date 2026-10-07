import { pool } from '../db/pool';
import { Role } from '../middleware/auth';
import { NotificationPayload } from '../services/notifications/models';
import { services } from '../services';

// The inverse of server/lib/scope.ts: given students, which staff have them in scope? Used to
// route student-driven events (a hackathon suggestion, a logged win) to the people responsible
// for those students: their section's Faculty Advisor, and the HOD.

/** Active staff of the given roles whose scope assignments cover any of `studentIds`. */
export async function staffCovering(studentIds: string[], roles: Role[]): Promise<string[]> {
  if (!studentIds.length) return [];
  const { rows } = await pool.query<{ user_id: string }>(
    `SELECT DISTINCT a.user_id
     FROM staff_scope_assignments a
     JOIN users staff ON staff.id = a.user_id AND staff.status = 'active' AND staff.role::text = ANY($2::text[])
     JOIN users s ON s.id = ANY($1::uuid[])
     JOIN student_profiles sp ON sp.user_id = s.id
     WHERE a.department_id = s.department_id
       AND (a.batch_year IS NULL OR a.batch_year = sp.batch_year)
       AND (a.section IS NULL OR a.section = sp.section)`,
    [studentIds, roles],
  );
  return rows.map((r) => r.user_id);
}

/** Sends the same in-app notification to every staff member of `roles` covering `studentIds`. */
export async function notifyStaffCovering(studentIds: string[], roles: Role[], payload: Omit<NotificationPayload, 'recipientId'>): Promise<number> {
  const recipients = await staffCovering(studentIds, roles);
  for (const recipientId of recipients) await services.notifications.notify({ ...payload, recipientId });
  return recipients.length;
}
