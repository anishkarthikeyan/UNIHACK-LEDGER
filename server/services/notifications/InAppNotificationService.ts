import { Pool } from 'pg';
import { logger } from '../../lib/logger';
import { NotificationPayload, PushToken } from './models';
import { NotificationService } from './NotificationService';
import { PushNotificationService } from './PushNotificationService';
import { RetryQueue } from './NotificationQueue';

// The real, wired implementation: persists to the `notifications` table (unchanged behavior
// from the raw INSERTs previously scattered across route handlers — this consolidates them
// behind one call site) and fans out to push via a retry queue when a push provider is
// configured. This is the concrete example of Part 2's "no screen/route talks to a third-party
// service directly" for a channel that's actually live today, not just scaffolded.
export class InAppNotificationService implements NotificationService {
  private readonly pushQueue: RetryQueue<{ tokens: string[]; title: string; body: string }>;

  constructor(private readonly pool: Pool, private readonly push: PushNotificationService) {
    this.pushQueue = new RetryQueue(
      async ({ tokens, title, body }) => { await this.push.sendToTokens(tokens, title, body); },
      { label: 'push-notification', maxAttempts: 3, backoffMs: 2000 },
    );
  }

  async notify(payload: NotificationPayload): Promise<void> {
    await this.pool.query(
      `INSERT INTO notifications (recipient_id, type, title, body, action_url) VALUES ($1, $2, $3, $4, $5)`,
      [payload.recipientId, payload.type, payload.title, payload.body ?? null, payload.actionUrl ?? null],
    );

    if (!this.push.isConfigured) return;
    const { rows } = await this.pool.query<Pick<PushToken, 'token'>>('SELECT token FROM push_tokens WHERE user_id = $1', [payload.recipientId]);
    if (!rows.length) return;
    this.pushQueue.enqueue({ tokens: rows.map((r) => r.token), title: payload.title, body: payload.body ?? '' });
    logger.debug({ recipientId: payload.recipientId, tokenCount: rows.length }, 'Queued push notification');
  }

  async registerPushToken(userId: string, token: string, platform: PushToken['platform']): Promise<void> {
    await this.pool.query(
      `INSERT INTO push_tokens (user_id, token, platform) VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE SET user_id = $1, platform = $3`,
      [userId, token, platform],
    );
  }

  async removePushToken(token: string): Promise<void> {
    await this.pool.query('DELETE FROM push_tokens WHERE token = $1', [token]);
  }
}
