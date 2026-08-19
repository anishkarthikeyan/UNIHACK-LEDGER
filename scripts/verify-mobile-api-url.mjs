// Guardrail for `npm run build:mobile` (see package.json / README "Mobile release builds").
//
// A packaged Android/iOS build has no dev-proxy origin for src/lib/api.ts's relative '/api'
// default to resolve against, and no LAN/localhost address is reachable from an end user's
// device — so a mobile release build MUST have VITE_API_BASE_URL set to a real, public HTTPS
// API URL at build time. This fails the build loudly instead of silently shipping an app that
// can't reach any backend (or worse, one wired to this dev machine's LAN address).
const url = process.env.VITE_API_BASE_URL;

function fail(message) {
  console.error(`\nFATAL: ${message}\n`);
  console.error('Set it and re-run, e.g.:');
  console.error('  VITE_API_BASE_URL=https://your-app.up.railway.app npm run build:mobile\n');
  process.exit(1);
}

if (!url) {
  fail('VITE_API_BASE_URL is not set. A mobile build cannot use the relative "/api" default (that only works for the web app, proxied by Vite or a same-origin reverse proxy).');
}

let parsed;
try {
  parsed = new URL(url);
} catch {
  fail(`VITE_API_BASE_URL ("${url}") is not a valid URL.`);
}

if (parsed.protocol !== 'https:') {
  fail(`VITE_API_BASE_URL ("${url}") must be HTTPS. A shipped mobile app cannot depend on plain HTTP.`);
}

const forbidden = ['localhost', '127.0.0.1', '0.0.0.0'];
const isPrivateLan = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname);
if (forbidden.includes(parsed.hostname) || isPrivateLan) {
  fail(`VITE_API_BASE_URL ("${url}") points at a local/LAN address. A shipped mobile build must point at a real deployed API (e.g. your Railway URL), not this development machine.`);
}

console.log(`✓ VITE_API_BASE_URL is a valid public HTTPS URL: ${url}`);
