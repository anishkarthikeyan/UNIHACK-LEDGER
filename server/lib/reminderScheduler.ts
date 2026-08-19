import { pool } from '../db/pool';
import { logger } from './logger';
import { config } from '../config/env';
import { services } from '../services';
import { reminderEmail } from '../services/email/templates';

// Reminders (student/faculty calendar entries — server/routes/reminders.routes.ts) previously had
// no delivery mechanism at all: created, listed, deleted, never actually reminded anyone. This is
// a minimal in-process poller rather than a real job queue — appropriate for this app's scale
// (no multi-instance deployment, no need for exactly-once delivery guarantees beyond
// `reminded_at` making each reminder fire once).
const POLL_INTERVAL_MS = 5 * 60 * 1000;
const LOOKAHEAD = "interval '1 hour'";

async function sendDueReminders(): Promise<void> {
  const { rows: due } = await pool.query<{ id: string; title: string; starts_at: string; created_by: string; team_id: string | null }>(
    `SELECT id, title, starts_at, created_by, team_id FROM reminders
     WHERE reminded_at IS NULL AND starts_at BETWEEN now() AND now() + ${LOOKAHEAD}`,
  );
  for (const reminder of due) {
    try {
      const { rows: recipients } = await pool.query<{ id: string; full_name: string; email: string }>(
        reminder.team_id
          ? `SELECT u.id, u.full_name, u.email FROM team_members tm JOIN users u ON u.id = tm.user_id WHERE tm.team_id = $1 AND tm.status = 'active'`
          : `SELECT u.id, u.full_name, u.email FROM users u WHERE u.id = $1`,
        [reminder.team_id ?? reminder.created_by],
      );
      const whenText = new Date(reminder.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      for (const recipient of recipients) {
        await services.notifications.notify({
          recipientId: recipient.id, type: 'general', title: 'Upcoming reminder',
          body: `${reminder.title} — ${whenText}`, actionUrl: '/calendar',
        });
        await services.email.send(reminderEmail(recipient.email, { recipientName: recipient.full_name, reminderTitle: reminder.title, whenText, appUrl: config.appUrl }));
      }
      await pool.query('UPDATE reminders SET reminded_at = now() WHERE id = $1', [reminder.id]);
    } catch (err) {
      logger.error({ err, reminderId: reminder.id }, 'Failed to deliver a due reminder — will retry next poll.');
    }
  }
}

export function startReminderScheduler(): void {
  setInterval(() => { sendDueReminders().catch((err) => logger.error({ err }, 'Reminder scheduler poll failed')); }, POLL_INTERVAL_MS);
  // Also run once shortly after boot rather than waiting a full interval.
  setTimeout(() => { sendDueReminders().catch((err) => logger.error({ err }, 'Reminder scheduler initial poll failed')); }, 10_000);
}
