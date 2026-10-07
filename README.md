

# UniHack Ledger

A university hackathon/competition tracking platform: student discovery, teams, registrations,
projects, achievements with AI-assisted certificate verification, faculty review workflows, and
an admin console. React + Vite frontend, Express + PostgreSQL backend, packaged for Android/iOS
via Capacitor.

## Local development

**Prerequisites:** Node.js, a native PostgreSQL install (Homebrew on macOS: `brew install
postgresql@16`). Docker is **not** part of this workflow — see "Optional: Docker" below if you
want it anyway.

1. Install dependencies: `npm install`
2. Make sure Postgres is running: `npm run db:up` (wraps `brew services start postgresql@16` —
   safe to run anytime; this is a shared background service, not something this project starts
   and stops per session).
3. One-time only — create the role and database this project expects (matches `.env.example`'s
   `DATABASE_URL`; skip if you already have them from a previous setup):
   ```
   createuser -h 127.0.0.1 -p 5432 unihack
   psql -h 127.0.0.1 -p 5432 -d postgres -c "ALTER ROLE unihack WITH LOGIN PASSWORD 'unihack_local_password';"
   createdb -h 127.0.0.1 -p 5432 -O unihack unihack_ledger
   ```
4. Copy `.env.example` to `.env` and set `JWT_SECRET` to a long random value:
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
5. Apply migrations: `npm run db:migrate`
6. Start the API: `npm run api:dev` (in one terminal)
7. Start the frontend: `npm run dev` (in another terminal) — served at http://localhost:3000, proxying `/api` to the backend
8. Check the API directly: `curl http://localhost:4000/health`

### Students: real CSE 2024–2028 roster

Students come from the institutional master sheet, not from a seed. The sheet is kept outside the
repo; pass its path to the importer:

```
npm run db:import:students -- "/path/to/student-master.csv" --dry-run          # validate only
npm run db:import:students -- "/path/to/student-master.csv" --retire-synthetic # import
```

- Matches by Reg. No. Re-running updates existing students and never creates duplicates or
  touches teams/registrations/projects/achievements.
- Rows with missing/invalid real fields, or a Reg. No. that appears more than once, are rejected
  and listed. Fix them in the sheet and re-run.
- New accounts get no password unless `STUDENT_INITIAL_PASSWORD` is set. It then applies only to
  test accounts (`--password-scope=all` for everyone), and never overwrites an existing password.
- `--retire-synthetic` removes the old generated `studentNNN@unihack.edu` accounts (deactivates
  any that other records still reference).

`npm run db:seed:users` now seeds only synthetic faculty and the admin account. The old
`*@demo.edu` accounts are inactive.

### Optional: Docker

`docker-compose.yml` is kept as an alternative for anyone who prefers a containerized local
database, but nothing in this project's scripts or docs uses it by default — see the comment at
the top of that file. Local dev and CI both assume native Postgres.

## External integrations (optional — the app runs fully without any of these)

Every integration below degrades gracefully when its credentials are unset: the feature's UI and
API still work, just without that specific capability, and a warning is logged at boot
(`server/services/index.ts`). Nothing is faked — there's no mock/demo mode for these, only "not
configured yet."

| Integration | Env vars | Unlocks |
| --- | --- | --- |
| Gemini AI | `GEMINI_API_KEY` | Certificate OCR + AI-assisted authenticity scoring in Achievements/Review & Verify (advisory only — faculty always make the final call) |
| Resend (email) | `RESEND_API_KEY`, `EMAIL_FROM` | Registration/approval/rejection/reminder/password-reset emails (otherwise logged, not sent) |
| Firebase Cloud Messaging | `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`, plus `android/app/google-services.json` and an Xcode "Push Notifications" capability for iOS | Push notifications on mobile (in-app notifications work regardless) |

`APP_URL` sets the base URL used inside outgoing emails (defaults to `WEB_ORIGIN`, then
`localhost:3000`) — set it to your real deployed API/frontend URL in production so email links work.

## Production deployment (Railway)

The backend + Postgres deploy to Railway; `railway.json` and `.env.production.example` describe
the exact config. See `docs/RAILWAY_DEPLOYMENT.md` for the full step-by-step (project creation,
Postgres plugin, every environment variable, migrations, and verification) — the short version:

```
railway login
railway init                       # create/link a Railway project
railway add --database postgres     # provision managed Postgres
railway up                          # deploy (uses railway.json)
railway run npm run db:migrate      # apply schema to the Railway database
```

Then set the required variables (`JWT_SECRET`, `WEB_ORIGIN`, `APP_URL`, optionally the Gemini/Resend/Firebase
keys) via `railway variables set KEY=value` or the dashboard — see `.env.production.example` for
the full list and why each one matters. `DATABASE_URL` is provided automatically by the Postgres
plugin.

## Mobile (Capacitor)

The Android and iOS projects are checked into `android/` and `ios/`. A release build must point
at the deployed Railway API, never at this machine — `npm run build:mobile` enforces that:

```
VITE_API_BASE_URL=https://your-app.up.railway.app npm run build:mobile
```

This runs `scripts/verify-mobile-api-url.mjs` first, which fails loudly (not silently) if
`VITE_API_BASE_URL` is unset, non-HTTPS, or points at `localhost`/a LAN address — then builds and
runs `npx cap sync`. Open `android/` in Android Studio or `ios/App` in Xcode to build/sign from
there as usual. See `src/lib/api.ts` and `capacitor.config.ts` for the full picture, including the
local-dev-with-live-reload workflow via `CAP_DEV_SERVER_URL` (dev only — never used for a release
build).

## Architecture

`server/index.ts` is a thin composition root — all route logic lives in `server/routes/*.ts`, all
external-service access (storage, email, AI, push) lives behind interfaces in
`server/services/*` with a single composition point in `server/services/index.ts` that picks the
real or no-op implementation based on which credentials are configured. Never call a third-party
SDK directly from a route. Never expose `JWT_SECRET` or `DATABASE_URL` in the frontend/mobile app.

Dev and production configuration are kept deliberately separate rather than one shared file with
overrides: local dev reads `.env` (gitignored, native Postgres, `NODE_ENV=development`);
production reads variables set directly on the Railway service (`NODE_ENV=production`,
Railway-managed `DATABASE_URL`). `.env.example` / `.env.production.example` document each without
containing real secrets.
