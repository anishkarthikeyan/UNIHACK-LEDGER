import { logger } from '../../lib/logger';

// Minimal in-process async queue with retry/backoff, used for the parts of notification
// delivery that are genuinely fire-and-forget and fallible (push delivery to an external
// provider) — as opposed to the in-app DB write, which stays synchronous within the request
// because callers rely on it being persisted before the response returns.
//
// This is intentionally NOT Redis/BullMQ-backed: for this project's scale an in-memory queue is
// the right amount of infrastructure, and the interface below is exactly what a swap to a real
// broker would need to satisfy, so upgrading later is additive, not a rewrite.
export interface QueueJob<T> {
  payload: T;
  attempts: number;
}

export class RetryQueue<T> {
  private queue: QueueJob<T>[] = [];
  private draining = false;

  constructor(
    private readonly handler: (payload: T) => Promise<void>,
    private readonly options: { maxAttempts?: number; backoffMs?: number; label: string } = { label: 'queue' },
  ) {}

  enqueue(payload: T): void {
    this.queue.push({ payload, attempts: 0 });
    void this.drain();
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    const maxAttempts = this.options.maxAttempts ?? 3;
    const backoffMs = this.options.backoffMs ?? 1000;
    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      try {
        await this.handler(job.payload);
      } catch (err) {
        job.attempts += 1;
        if (job.attempts < maxAttempts) {
          logger.warn({ err, label: this.options.label, attempt: job.attempts }, 'Queue job failed, retrying');
          await new Promise((resolve) => setTimeout(resolve, backoffMs * job.attempts));
          this.queue.push(job);
        } else {
          logger.error({ err, label: this.options.label }, 'Queue job failed permanently, dropping');
        }
      }
    }
    this.draining = false;
  }
}
