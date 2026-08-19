# Railway Deployment — UniHack Ledger API

This is the exact, complete requirements list and step-by-step for deploying the backend +
Postgres to Railway. Everything here that doesn't require your Railway account has already been
done in this repo (see the bottom of this file). The remaining steps need your login/credentials
— that's a hard boundary (Railway has no way to create a project or accept payment/plan details
without an authenticated account), not something that can be scripted around.

## What gets deployed

One Railway **project** containing two **services**:
1. **Postgres** — Railway's managed plugin, not a container you configure yourself.
2. **unihack-ledger-api** — this repo, deployed from the `server/` Express app via `railway.json`
   (Nixpacks build, `npm run start`, health-checked at `/health`).

The frontend is **not** deployed to Railway by this guide — it ships inside the Android/iOS app
bundles (`npm run build:mobile`). If you also want a hosted web version later, that's a separate,
optional third service; nothing here blocks adding it.

## Prerequisites (your action required)

1. A Railway account — https://railway.app (GitHub login is the fastest path).
2. Decide: deploy from this **local repo via the CLI** (fastest to get running right now) or from
   a **GitHub repo** (Railway auto-redeploys on push — better long-term, but this repo isn't
   pushed to GitHub yet, so it's an extra step). Both are described below; pick one.

The Railway CLI is already installed in this environment (`railway --version` → confirm it prints
a version). If it's ever missing: `npm install -g @railway/cli`.

## Step-by-step (CLI path)

```bash
# 1. Authenticate — opens a browser for you to log in/create an account.
railway login

# 2. From the repo root, create and link a new Railway project.
railway init

# 3. Provision managed Postgres into that project.
railway add --database postgres

# 4. Link this local checkout to the API service Railway just created (if `railway init` didn't
#    already select it, `railway service` lists/picks it).
railway service

# 5. Set the required variables (see full table below). DATABASE_URL is NOT set here — Railway
#    wires it automatically once you reference the Postgres plugin (step 6).
railway variables set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('base64'))")"
railway variables set NODE_ENV="production"
railway variables set WEB_ORIGIN="https://localhost,capacitor://localhost"
railway variables set APP_URL="https://<your-service>.up.railway.app"   # fill in after step 7, then re-set

# 6. Reference the Postgres plugin's connection string (via the dashboard is easiest: open the
#    API service → Variables → "New Variable" → "Add Reference" → select the Postgres service →
#    DATABASE_URL. The CLI equivalent is the same variable-reference syntax used in
#    .env.production.example: DATABASE_URL="${{Postgres.DATABASE_URL}}").

# 7. Deploy.
railway up

# 8. Once deployed, get the public URL (dashboard → service → Settings → Networking → "Generate
#    Domain" if one wasn't created automatically), then go back and set APP_URL to it (step 5).

# 9. Apply the database schema.
railway run npm run db:migrate

# 10. Verify.
curl https://<your-service>.up.railway.app/health
# → {"status":"ok"}
```

## Step-by-step (GitHub path, alternative to the CLI's `railway up`)

Push this repo to GitHub, then in the Railway dashboard: New Project → Deploy from GitHub repo →
select it. Railway reads `railway.json` automatically (same build/start/healthcheck config as the
CLI path). Everything from step 3 onward above is identical.

## Required environment variables (set on the API service, not committed anywhere)

See `.env.production.example` for the authoritative, commented list. Summary:

| Variable | Required? | Value |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Reference to the Postgres plugin (`${{Postgres.DATABASE_URL}}`), not typed by hand |
| `JWT_SECRET` | Yes | Long random value, **different from your local `.env`** |
| `NODE_ENV` | Yes | `production` |
| `WEB_ORIGIN` | Yes | `https://localhost,capacitor://localhost` (Capacitor's default WebView origins) plus any real web frontend origin |
| `APP_URL` | Recommended | Your Railway service's public URL — used inside email links |
| `PORT` | Set by Railway automatically | Don't set this yourself — `server/config/env.ts` already prefers it over `API_PORT` |
| `GEMINI_API_KEY` | Optional | Enables AI certificate verification |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional | Enables outgoing email |
| `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional | Enables push notifications |
| `STORAGE_DIR` | Recommended once a Volume is attached | See "File storage" below |

## File storage (do this before real students upload certificates)

Railway's filesystem is **ephemeral** — every redeploy wipes it. Without a Volume, uploaded
certificates would silently disappear on the next deploy.

1. Dashboard → API service → Settings → Volumes → "New Volume".
2. Mount path: `/data/uploads`.
3. Set `STORAGE_DIR=/data/uploads` as a service variable.
4. Redeploy.

## HTTPS

Automatic — Railway terminates TLS for every `*.up.railway.app` domain and any custom domain you
attach (DNS CNAME + Railway dashboard → Settings → Networking → Custom Domain). No app-level
config needed; `helmet`'s HSTS header is already enabled in production (`server/index.ts`).

## Pointing the mobile app at this deployment

```bash
VITE_API_BASE_URL=https://<your-service>.up.railway.app npm run build:mobile
```

`npm run build:mobile` refuses to build (see `scripts/verify-mobile-api-url.mjs`) if this isn't a
public HTTPS URL — it cannot point at `localhost`, `127.0.0.1`, a `192.168.x.x`/LAN address, or be
left unset, so a mobile build can never accidentally ship depending on this Mac.

## Post-deploy verification checklist

- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] `POST /auth/login` with a real (or freshly admin-created) account returns a token
- [ ] `railway run npm run db:migrate` reports "No pending migrations" on a second run (idempotent)
- [ ] Logs (`railway logs`) show no `no-op mode` warnings for any integration you configured a key for
- [ ] A mobile build made with `VITE_API_BASE_URL` set to this URL can log in and load hackathons

## What's already done in this repo (no Railway account needed for any of this)

- `railway.json` — build/start/healthcheck config, so `railway up`/GitHub deploys need no manual
  dashboard configuration beyond environment variables.
- `server/config/env.ts` — prefers Railway's injected `PORT` over the local-dev `API_PORT`.
- `server/index.ts` — `trust proxy` enabled in production (Railway sits behind a reverse proxy;
  without this, rate limiting and client-IP logging would see Railway's proxy IP for every
  request instead of the real caller).
- `server/db/pool.ts` — TLS enabled for the Postgres connection in production (Railway's managed
  Postgres expects it); left off for local dev, which has no TLS listener at all.
- `tsx` moved from `devDependencies` to `dependencies` — Railway's build runs with
  `NODE_ENV=production`, which makes `npm ci` skip `devDependencies`; the start command
  (`tsx server/index.ts`) would otherwise fail with `tsx: command not found`. Verified with a
  simulated `npm ci --omit=dev`.
- `.env.production.example` — documents every production variable; contains no real secrets.
- `scripts/verify-mobile-api-url.mjs` + `npm run build:mobile` — guardrail described above.
- `package.json` `engines.node` — pins the Node major version Railway's Nixpacks builder targets.
