// Push-delivery seam, separate from NotificationService (which owns the in-app record + fan-out
// decision). Planned provider: Firebase Cloud Messaging. Until FIREBASE_PROJECT_ID and
// FIREBASE_SERVICE_ACCOUNT_JSON are set, NotificationQueue uses NoopPushNotificationService below
// instead of throwing — per Phase 1.5 instructions, missing external credentials must never
// block anything else from working.
export interface PushNotificationService {
  readonly isConfigured: boolean;
  sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void>;
}

export class NoopPushNotificationService implements PushNotificationService {
  readonly isConfigured = false;

  async sendToTokens(): Promise<void> {
    // Intentionally silent no-op — see FcmPushNotificationService for the real implementation
    // that activates once Firebase credentials are present (server/services/index.ts picks
    // whichever one applies). Callers already log via NotificationQueue before reaching here.
  }
}

// Skeleton for the real provider. Not instantiated by server/services/index.ts until
// config.firebase.isConfigured is true (see that file) — constructing it eagerly would require
// the firebase-admin SDK and credentials that are explicitly out of scope for this phase.
// Wiring this in for real is Phase 6's job; the shape is settled now so that phase is additive,
// not another refactor.
export class FcmPushNotificationService implements PushNotificationService {
  readonly isConfigured = true;

  constructor(private readonly projectId: string, private readonly serviceAccountJson: string) {}

  async sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
    // Phase 6 TODO: initialize firebase-admin with this.serviceAccountJson, call
    // messaging().sendEachForMulticast({ tokens, notification: { title, body }, data }).
    // Deliberately unimplemented — Phase 1.5 prepares the seam, Phase 6 wires the real SDK call
    // once `npm install firebase-admin` and google-services.json are added.
    throw new Error('FCM delivery is not implemented yet — scaffolded for Phase 6. NoopPushNotificationService should be in use until then.');
  }
}
