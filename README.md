<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/949aa28b-6326-4cdc-9d76-c90f43af8025

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend and database

The project now includes a TypeScript API and PostgreSQL schema for users/roles, hackathons, teams, registrations, projects, achievements, suggestions, notifications, settings, and audit logs.

1. Copy `.env.example` to `.env` and set `JWT_SECRET`. The local database uses port `5433` to avoid clashing with any PostgreSQL installation already using port `5432`.
2. Start PostgreSQL (Docker Desktop must be running): `npm run db:up`
3. Start the API in another terminal: `npm run api:dev`
4. Check it: `curl http://localhost:4000/health`

The database creates these demo accounts, all with password `Demo@123`:

| Role | Email |
| --- | --- |
| Student | `student@demo.edu` |
| Faculty | `faculty@demo.edu` |
| Admin | `admin@demo.edu` |

The existing frontend remains a static prototype. Connect its forms and pages to the API endpoints in `server/index.ts` incrementally; never expose `JWT_SECRET` or `DATABASE_URL` in the frontend/mobile app.
