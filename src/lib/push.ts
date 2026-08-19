import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api, ApiError } from './api';

// Native push registration (Firebase Cloud Messaging via @capacitor/push-notifications — Part 8
// of the completion spec). This is a complete client, but it has nothing to talk to until a real
// Firebase project is wired up server-side (FIREBASE_PROJECT_ID / FIREBASE_SERVICE_ACCOUNT_JSON
// — see server/services/notifications/PushNotificationService.ts) and android/app/google-services.json
// is added: every call in here is a no-op on web (Capacitor.isNativePlatform() is false in a
// browser) and fails silently if the native registration itself errors, so it's safe to call
// unconditionally on every login without gating the rest of the app on push actually working.
const LAST_TOKEN_KEY = 'unihack.pushToken';

export async function registerForPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === 'prompt') permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', async ({ value: token }) => {
      try {
        const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
        await api.notifications.registerPushToken(token, platform);
        localStorage.setItem(LAST_TOKEN_KEY, token);
      } catch {
        // Registration failing (e.g. no push backend configured yet) must never break login.
      }
    });
    PushNotifications.addListener('registrationError', () => {
      // No FCM/APNs config yet in most environments — expected, not worth surfacing to the user.
    });
  } catch {
    // Any native-plugin error here is non-fatal to the rest of the app.
  }
}

export async function unregisterPushToken(): Promise<void> {
  const token = localStorage.getItem(LAST_TOKEN_KEY);
  if (!token) return;
  localStorage.removeItem(LAST_TOKEN_KEY);
  try { await api.notifications.removePushToken(token); } catch (err) { if (!(err instanceof ApiError)) throw err; }
}
