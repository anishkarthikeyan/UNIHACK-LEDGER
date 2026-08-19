import { NotificationPayload, PushToken } from './models';

// Notification abstraction. Route handlers call `notify()` and never touch the `notifications`
// table or a push provider's SDK directly — that's what made every past "insert into
// notifications" call site a copy-pasted raw SQL statement scattered across the monolith. This
// interface is the one seam: swapping "in-app only" for "in-app + FCM push" (Phase 6, once
// Firebase credentials exist) means changing server/services/index.ts, not any route.
export interface NotificationService {
  /** Records an in-app notification and fans out to any other configured channel (push, once
   *  wired). Never throws for a channel that's merely unconfigured — logs and continues. */
  notify(payload: NotificationPayload): Promise<void>;
  /** Registers a device's push token against a user, for later delivery once push is wired up. */
  registerPushToken(userId: string, token: string, platform: PushToken['platform']): Promise<void>;
  removePushToken(token: string): Promise<void>;
}
