import 'dotenv/config';
// config must be imported before anything that reads process.env indirectly (logger, db pool,
// services) — it performs fail-fast validation as a side effect of being loaded.
import { config } from './config/env';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { checkDatabaseConnection } from './db/pool';
import { logger } from './lib/logger';
import { startReminderScheduler } from './lib/reminderScheduler';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimit } from './middleware/rateLimit';

import { achievementsRoutes } from './routes/achievements.routes';
import { adminRoutes } from './routes/admin.routes';
import { authRoutes } from './routes/auth.routes';
import { cohortRoutes } from './routes/cohort.routes';
import { hackathonsRoutes } from './routes/hackathons.routes';
import { notificationsRoutes } from './routes/notifications.routes';
import { projectsRoutes } from './routes/projects.routes';
import { registrationsRoutes } from './routes/registrations.routes';
import { remindersRoutes } from './routes/reminders.routes';
import { reportsRoutes } from './routes/reports.routes';
import { studentsRoutes } from './routes/students.routes';
import { suggestionsRoutes } from './routes/suggestions.routes';
import { teamsRoutes } from './routes/teams.routes';
import { usersRoutes } from './routes/users.routes';

// This file is now a pure composition root: build the app, wire cross-cutting middleware, mount
// every domain's router, start listening. All actual route logic lives in server/routes/*.ts;
// all external-service access lives behind server/services/*. See ARCHITECTURE.md.
const app = express();

// Railway (like any PaaS) puts the app behind a reverse proxy — without this, req.ip and
// express-rate-limit's IP-based keying both see the proxy's own address for every request
// instead of the real client, which would silently collapse the login rate limit onto one
// shared bucket for all users. `1` trusts exactly one hop (Railway's edge), matching how
// express-rate-limit's docs recommend configuring this behind a single known proxy. Not set
// locally — there's no proxy to trust in dev.
if (config.isProduction) app.set('trust proxy', 1);

app.use(helmet({
  // The API is JSON-only and never serves HTML the browser would render, so CSP's main
  // protections don't apply here the way they would to a page-serving app — disabled to avoid
  // fighting default directives that assume an HTML response. Every other helmet default
  // (X-Content-Type-Options, X-Frame-Options, HSTS in production, etc.) stays on.
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

// Default to a closed CORS posture: reflect only WEB_ORIGIN(s) if set. Falling back to `true`
// (reflect any origin) is only appropriate for a throwaway local prototype, not anything that
// might ever be reachable outside localhost.
app.use(cors({ origin: config.webOrigins.length ? config.webOrigins : false }));
app.use(express.json({ limit: '1mb' }));
app.use(apiRateLimit);

app.get('/health', async (_req, res) => {
  await checkDatabaseConnection();
  res.json({ status: 'ok' });
});

app.use(authRoutes);
app.use(hackathonsRoutes);
app.use(teamsRoutes);
app.use(registrationsRoutes);
app.use(projectsRoutes);
app.use(suggestionsRoutes);
app.use(studentsRoutes);
app.use(cohortRoutes);
app.use(notificationsRoutes);
app.use(usersRoutes);
app.use(achievementsRoutes);
app.use(remindersRoutes);
app.use(reportsRoutes);
app.use(adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => logger.info(`UniHack Ledger API listening on port ${config.port} (${config.nodeEnv})`));
startReminderScheduler();
