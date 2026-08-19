import { z } from 'zod';

// Centralized, validated environment configuration. The rule this module enforces:
//
//   - Config that's load-bearing for CORRECTNESS OR SECURITY in any environment (JWT_SECRET)
//     fails the process at boot in every environment. There is no insecure fallback.
//   - Config that's load-bearing for correctness only in PRODUCTION (DATABASE_URL) has a
//     convenience default that matches a native local Postgres install in development/test, but
//     is required — fails fast — once NODE_ENV=production (Railway sets DATABASE_URL itself via
//     its Postgres plugin reference — see .env.production.example).
//   - Config for optional/future integrations (Gemini, Resend, Firebase) is never required to
//     boot the server. Each service that depends on one of these checks its own presence and
//     degrades gracefully (logs a warning, no-ops or throws only when that specific feature is
//     actually invoked) rather than blocking every other feature that doesn't need it. This is
//     deliberate: Phase 1.5 must leave nothing broken while those credentials are still pending.
//
// Import `config` (not `process.env`) everywhere else in the server so every environment
// variable the app depends on is declared, typed, and validated in exactly one place.

const nodeEnv = (process.env.NODE_ENV ?? 'development') as 'development' | 'test' | 'production';
const isProduction = nodeEnv === 'production';

// Railway (and most PaaS hosts) assign the port at deploy time and inject it as PORT — the app
// must listen on that, not a fixed one. API_PORT stays the local-dev-only knob (see
// .env.example); this reconciles the two into the one property the rest of this file reads,
// without adding a second port setting for callers to worry about.
if (process.env.PORT && !process.env.API_PORT) {
  process.env.API_PORT = process.env.PORT;
}

function fail(message: string): never {
  // eslint-disable-next-line no-console
  console.error(`FATAL: ${message}`);
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  fail('JWT_SECRET is not set. Refusing to start with an insecure default secret. Set JWT_SECRET in your environment (see .env.example).');
}

if (isProduction && !process.env.DATABASE_URL) {
  fail('DATABASE_URL is not set. The local-development default connection string is only used outside production. Set DATABASE_URL explicitly for production.');
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  // Default matches a native local Postgres install (see README "Local development") — NOT
  // Docker. Required (fails fast, no fallback) once NODE_ENV=production — see the check above.
  DATABASE_URL: z.string().min(1).default('postgresql://unihack:unihack_local_password@127.0.0.1:5432/unihack_ledger'),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('12h'),
  WEB_ORIGIN: z.string().optional(),
  // Base URL used to build links inside outgoing emails (e.g. "View pipeline", password reset).
  // Falls back to the first WEB_ORIGIN, then localhost — see `config.appUrl` below.
  APP_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).optional(),
  STORAGE_DIR: z.string().default('./uploads'),
  STORAGE_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(20),
  GEMINI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('UniHack Ledger <onboarding@resend.dev>'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().positive().default(20),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  fail(`Invalid environment configuration:\n${parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')}`);
}

const env = parsed.success ? parsed.data : (undefined as never);

export const config = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  port: env.API_PORT,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  webOrigins: env.WEB_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) ?? [],
  appUrl: env.APP_URL || env.WEB_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000',
  logLevel: env.LOG_LEVEL ?? (env.NODE_ENV === 'production' ? 'info' : 'debug'),
  storage: {
    dir: env.STORAGE_DIR,
    maxFileSizeBytes: env.STORAGE_MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  gemini: {
    apiKey: env.GEMINI_API_KEY,
    isConfigured: Boolean(env.GEMINI_API_KEY),
  },
  resend: {
    apiKey: env.RESEND_API_KEY,
    isConfigured: Boolean(env.RESEND_API_KEY),
    from: env.EMAIL_FROM,
  },
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID,
    serviceAccountJson: env.FIREBASE_SERVICE_ACCOUNT_JSON,
    isConfigured: Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_SERVICE_ACCOUNT_JSON),
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    authMax: env.AUTH_RATE_LIMIT_MAX,
  },
} as const;

export type AppConfig = typeof config;
