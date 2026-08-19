import type { CapacitorConfig } from '@capacitor/cli';

// Phase 1.5 Mobile Foundation: this file replaces the old static capacitor.config.json.
//
// The critical change: `server.url` is now conditional on an environment variable instead of a
// hardcoded, checked-in dev machine address. When CAP_DEV_SERVER_URL is unset — the only
// configuration this file uses for a real release build — Capacitor falls back to its default
// behavior: the WebView loads `webDir` (the built `dist/` bundle) directly from the packaged
// app over its internal local scheme. That means:
//   - No dependency on a development machine or Vite dev server at runtime.
//   - The app launches and renders fully offline (see README "Offline startup behaviour").
//   - `npx cap sync` bakes the current `dist/` build into the native project as-is.
//
// For local development with live-reload on a physical device or emulator (the workflow used
// earlier in this project), set CAP_DEV_SERVER_URL before running `npx cap sync`, e.g.:
//   CAP_DEV_SERVER_URL=http://<your-LAN-IP>:3000   (physical Android device, or iOS device)
//   CAP_DEV_SERVER_URL=http://10.0.2.2:3000        (Android emulator)
//   CAP_DEV_SERVER_URL=http://localhost:3000       (iOS simulator)
//
// Note: `@capacitor/cli`'s CapacitorConfig type only supports `server.url` at the top level —
// there is no separate per-platform server override in this Capacitor version (the previous
// config's nested `android.server.url` / `ios.server.url` were never part of the typed/supported
// schema; they were silently accepted by the old untyped JSON loader without actually doing
// anything platform-specific). If Android and iOS need different dev URLs in the same session,
// set CAP_DEV_SERVER_URL and re-run `npx cap sync` for whichever platform you're testing.
//
// This only controls which HTML/JS the WebView loads. The frontend's own API base URL (where
// fetch() calls go) is a separate, independent setting — see src/lib/api.ts and
// VITE_API_BASE_URL in .env.example. A release build needs both: no dev server URL here, and a
// real deployed API URL there.
const devServerUrl = process.env.CAP_DEV_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.unihack.ledger',
  appName: 'UniHack Ledger',
  webDir: 'dist',
  server: {
    // Cleartext (plain HTTP) is only ever needed to reach a local dev server; a real deployed
    // API should be HTTPS, so this stays off unless a dev server URL is actually in play.
    cleartext: Boolean(devServerUrl),
    ...(devServerUrl ? { url: devServerUrl } : {}),
  },
};

export default config;
