// Email abstraction — planned provider is Resend (Part 6). No route or template should import
// the Resend SDK directly; everything goes through this interface so switching providers later
// touches server/services/index.ts and one new class, nothing else.
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailService {
  readonly isConfigured: boolean;
  /** Enqueues an email for delivery (see EmailQueue for retry/backoff). Never throws for a
   *  transient provider failure — logs and retries; only rejects for a malformed message. */
  send(message: EmailMessage): Promise<void>;
}
