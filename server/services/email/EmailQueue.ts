import { Resend } from 'resend';
import { logger } from '../../lib/logger';
import { RetryQueue } from '../notifications/NotificationQueue';
import { EmailMessage, EmailService } from './EmailService';

// Real Resend-backed implementation. Used whenever RESEND_API_KEY is set — see
// server/services/index.ts for the NoopEmailService fallback used otherwise. Sends are queued
// with retry/backoff rather than awaited inline in the request, so a slow/failing provider never
// blocks the route handler that triggered the email (registration, approval, etc. — Phase 7
// wires the actual call sites; this service is ready for them).
export class ResendEmailService implements EmailService {
  readonly isConfigured = true;
  private readonly client: Resend;
  private readonly queue: RetryQueue<EmailMessage>;

  constructor(apiKey: string, private readonly from: string) {
    this.client = new Resend(apiKey);
    this.queue = new RetryQueue<EmailMessage>(
      async (message) => {
        const { error } = await this.client.emails.send({ from: this.from, to: message.to, subject: message.subject, html: message.html });
        if (error) throw new Error(error.message);
      },
      { label: 'email', maxAttempts: 4, backoffMs: 3000 },
    );
  }

  async send(message: EmailMessage): Promise<void> {
    if (!message.to || !message.subject || !message.html) throw new Error('Email message is missing required fields.');
    this.queue.enqueue(message);
  }
}

// Used when RESEND_API_KEY is not set. Logs what would have been sent instead of silently
// dropping it — makes local development legible without requiring a real API key, and matches
// the "nothing else should block development" instruction for pending external credentials.
export class NoopEmailService implements EmailService {
  readonly isConfigured = false;

  async send(message: EmailMessage): Promise<void> {
    logger.warn({ to: message.to, subject: message.subject }, 'RESEND_API_KEY not set — email not sent (logged only)');
  }
}
