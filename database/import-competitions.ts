import 'dotenv/config';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool, PoolClient } from 'pg';
import { parseCsv } from './lib/csv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Idempotent importer for the institution's competition tracking sheet.
// Reuses the existing `hackathons` table (see database/migrations/0001_competition_dataset.sql)
// instead of a parallel Competition table. Safe to run repeatedly: rows are matched by a
// stable external_ref derived from (name + organizer), never by the CSV row number, and
// every write is an upsert.
//
// Usage:
//   tsx database/import-competitions.ts [path-to-csv] [--dry-run] [--archive-missing]

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
// Archives previously imported competitions that are no longer in this sheet (they disappear
// from Explore but keep their registrations/history). Rows created in the app are never touched.
const archiveMissing = args.includes('--archive-missing');
const csvArg = args.find((a) => !a.startsWith('--'));
const csvPath = csvArg
  ? path.resolve(csvArg)
  : path.join(__dirname, 'Competition Dashboard - List of Competitions 26-27.csv');

const EXPECTED_HEADER = [
  'S. No', 'Competition Name', 'Competition Status', 'Eligible Year', 'Reg. Deadline',
  'R1 -Date', 'R2 - Date', 'Competition Date', 'Remaining Days for Reg.', 'R. Days for R1',
  'R. Days for R2', 'R. Days for Final', 'Reg. Team', 'Reg. Std', 'Total Prize Amount',
  'Category', 'Organizer',
];

const ROMAN_YEARS: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };

interface ImportRow {
  lineNumber: number;
  serialNo: string;
  name: string;
  status: string;
  eligibleYear: string;
  regDeadline: string;
  r1Date: string;
  r2Date: string;
  competitionDate: string;
  regTeams: string;
  regStudents: string;
  prizeAmount: string;
  category: string;
  organizer: string;
}

interface Summary {
  totalDataRows: number;
  inserted: number;
  updated: number;
  skipped: { line: number; name: string; reason: string }[];
  categoriesCreated: Set<string>;
  organizersCreated: Set<string>;
  roundsWritten: number;
  eligibilityRowsWritten: number;
}

function loadRows(): ImportRow[] {
  const text = readFileSync(csvPath, 'utf8');
  const allRows = parseCsv(text).filter((r) => !(r.length === 1 && r[0] === ''));
  // Row 1 (index 0) is a title-only row, row 2 (index 1) is the real header (see task brief).
  const header = allRows[1];
  const mismatched = header.some((h, i) => h !== EXPECTED_HEADER[i]);
  if (mismatched) {
    console.warn('Warning: CSV header does not exactly match the expected columns. Proceeding by position anyway.');
    console.warn('Expected:', EXPECTED_HEADER.join(' | '));
    console.warn('Found:   ', header.join(' | '));
  }

  const rows: ImportRow[] = [];
  for (let i = 2; i < allRows.length; i++) {
    const f = allRows[i];
    if (f.every((v) => v === '')) continue;
    rows.push({
      lineNumber: i + 1,
      serialNo: f[0] ?? '',
      name: f[1] ?? '',
      status: f[2] ?? '',
      eligibleYear: f[3] ?? '',
      regDeadline: f[4] ?? '',
      r1Date: f[5] ?? '',
      r2Date: f[6] ?? '',
      competitionDate: f[7] ?? '',
      // f[8..11] = Remaining Days for Reg./R1/R2/Final — intentionally never read.
      // These are derived values and must be computed at display time, not stored.
      regTeams: f[12] ?? '',
      regStudents: f[13] ?? '',
      prizeAmount: f[14] ?? '',
      category: f[15] ?? '',
      organizer: f[16] ?? '',
    });
  }
  return rows;
}

// --- Field transforms ---

function stableKey(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function baseSlug(value: string): string {
  return stableKey(value) || 'competition';
}

/** Parses the sheet's DD-MM-YY format. Returns null (never throws) for TBA/blank/invalid dates. */
function parseSheetDate(raw: string): string | null {
  const v = raw.trim();
  if (!v || /^tba$/i.test(v) || /^n\/?a$/i.test(v)) return null;
  const m = v.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = 2000 + Number(m[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!valid) return null;
  return date.toISOString().slice(0, 10);
}

function parseIntOrNull(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function nullIfBlank(raw: string): string | null {
  const v = raw.trim();
  return v ? v : null;
}

function splitList(raw: string, separator: RegExp): string[] {
  return raw.split(separator).map((s) => s.trim()).filter(Boolean);
}

// The sheet's Category column mixes full words with single-letter shorthand ("C + P", "C + I")
// and inconsistent casing/hyphenation ("Start-up" vs "Start-Up") — verified against every
// distinct raw value actually in the sheet (Stage 0 audit): every "C + P" row's prize column
// mentions PPO/PPI (Pre-Placement Offer/Interview), so "P" = Placement, not "Program"/"Prize".
// Without this, the DB would end up with "C"/"P"/"I" sitting next to "Competition"/"Internship"
// as distinct categories, and "Start-up"/"Start-Up" as two different ones purely from casing.
const CATEGORY_ALIASES: Record<string, string> = {
  c: 'Competition', competition: 'Competition',
  p: 'Placement', placement: 'Placement',
  i: 'Internship', internship: 'Internship',
  'start-up': 'Startup', 'start up': 'Startup', startup: 'Startup',
};
function normalizeCategory(token: string): string {
  return CATEGORY_ALIASES[token.trim().toLowerCase()] ?? token.trim();
}

interface Eligibility { year: number | null; label: string | null }

function parseEligibility(raw: string): Eligibility[] {
  const tokens = splitList(raw, /,/);
  const out: Eligibility[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const roman = ROMAN_YEARS[token.toUpperCase()];
    const key = roman ? `y${roman}` : `l${token.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (roman) out.push({ year: roman, label: null });
    else out.push({ year: null, label: token });
  }
  return out;
}

/** Status classification is a one-time decision made at import, exactly like the status
 * of a manually-created hackathon is chosen by its coordinator — not a value recomputed
 * on every read. Only the "remaining days" figures are forbidden from being stored. */
function classifyStatus(regClosesAt: string | null, roundDates: (string | null)[]): string {
  const today = new Date().toISOString().slice(0, 10);
  if (!regClosesAt || regClosesAt > today) return 'published';
  const known = roundDates.filter((d): d is string => Boolean(d));
  const latest = known.sort().pop();
  if (latest && latest >= today) return 'ongoing';
  return 'completed';
}

/** One fully-transformed, ready-to-write row — the exact same per-row transform logic as
 * before, just computed up front so the write phase below can operate on the whole dataset at
 * once instead of one row at a time. */
interface PreparedRow {
  row: ImportRow;
  name: string;
  organizerRaw: string;
  externalRef: string;
  slug: string;
  description: string;
  status: string;
  regClosesAt: string | null;
  r1: string | null;
  r2: string | null;
  final: string | null;
  eligibility: Eligibility[];
  categories: string[];
  organizers: string[];
}

function prepareRow(row: ImportRow, summary: Summary): PreparedRow | null {
  const name = row.name.trim();
  if (!name) {
    summary.skipped.push({ line: row.lineNumber, name: '(blank)', reason: 'Missing competition name.' });
    return null;
  }
  const organizerRaw = row.organizer.trim() || 'Unknown Organizer';
  const externalRef = `csv:${stableKey(`${name}|${organizerRaw}`)}`;
  const regClosesAt = parseSheetDate(row.regDeadline);
  const r1 = parseSheetDate(row.r1Date);
  const r2 = parseSheetDate(row.r2Date);
  const final = parseSheetDate(row.competitionDate);
  const eligibility = parseEligibility(row.eligibleYear);
  const categories = Array.from(new Set(splitList(row.category, /\+/).map(normalizeCategory)));
  const organizers = splitList(organizerRaw, /,/);
  const status = classifyStatus(regClosesAt, [r1, r2, final]);
  const description = `${name} — organized by ${organizerRaw}. Imported from the institution's competition tracking sheet; full details will be added once the source workbook is available.`;
  return {
    row, name, organizerRaw, externalRef, slug: `${baseSlug(name)}-${stableKey(externalRef).slice(-8)}`,
    description, status, regClosesAt, r1, r2, final, eligibility, categories, organizers,
  };
}

/** Bulk-writes the whole dataset in a small, fixed number of set-based statements instead of
 * ~15 round trips per row (upsert + delete/insert for categories, organizers, eligibility,
 * rounds — each individually parameterized). That per-row approach is fine against a local
 * database, but against a remote one (e.g. Railway over the CLI's SSH tunnel) 146 rows × ~15
 * round trips is ~2,200 round trips, and at real internet latency that's the difference between
 * a two-minute run and one that's still not done after two hours (observed directly running
 * this importer against Railway). Every statement here is still a plain upsert/replace over
 * `unnest()`-expanded arrays — same semantics, same idempotency, same final data, just batched.
 * `eligible_years` on `hackathons` is deliberately left out of the bulk upsert itself (a per-row
 * smallint[] can't be batched as a rectangular array parameter when rows have different lengths)
 * and is instead derived afterward straight from the `hackathon_eligibility` rows this same run
 * just wrote — same result, no ragged-array problem. */
async function writeAll(client: PoolClient, prepared: PreparedRow[], summary: Summary): Promise<void> {
  if (!prepared.length) return;

  const upsert = await client.query(
    `INSERT INTO hackathons (
       title, slug, organizer, description, mode, registration_closes_at,
       status, external_ref, external_status,
       external_registered_teams, external_registered_students, source, prize_pool, max_team_size
     )
     SELECT title, slug, organizer, description, 'hybrid', registration_closes_at,
       status::hackathon_status, external_ref, external_status,
       external_registered_teams, external_registered_students, 'csv_import', prize_pool, 4
     FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::timestamptz[], $6::text[], $7::text[], $8::text[], $9::int[], $10::int[], $11::text[])
       AS t(title, slug, organizer, description, registration_closes_at, status, external_ref, external_status, external_registered_teams, external_registered_students, prize_pool)
     ON CONFLICT (external_ref) DO UPDATE SET
       title = EXCLUDED.title, organizer = EXCLUDED.organizer, description = EXCLUDED.description,
       registration_closes_at = EXCLUDED.registration_closes_at, status = EXCLUDED.status,
       external_status = EXCLUDED.external_status, external_registered_teams = EXCLUDED.external_registered_teams,
       external_registered_students = EXCLUDED.external_registered_students, prize_pool = EXCLUDED.prize_pool,
       updated_at = now()
     RETURNING id, external_ref, (xmax = 0) AS inserted`,
    [
      prepared.map((r) => r.name),
      prepared.map((r) => r.slug),
      prepared.map((r) => r.organizerRaw),
      prepared.map((r) => r.description),
      prepared.map((r) => r.regClosesAt),
      prepared.map((r) => r.status),
      prepared.map((r) => r.externalRef),
      prepared.map((r) => nullIfBlank(r.row.status)),
      prepared.map((r) => parseIntOrNull(r.row.regTeams)),
      prepared.map((r) => parseIntOrNull(r.row.regStudents)),
      prepared.map((r) => nullIfBlank(r.row.prizeAmount)),
    ],
  );
  const idByExternalRef = new Map<string, string>();
  for (const r of upsert.rows) {
    idByExternalRef.set(r.external_ref, r.id);
    if (r.inserted) summary.inserted++; else summary.updated++;
  }
  const touchedIds = upsert.rows.map((r) => r.id as string);

  // Categories/organizers: resolve-or-create every distinct name once (not once per row), then
  // replace the full link set for every touched hackathon in one delete + one bulk insert.
  async function resolveLookupTable(table: 'hackathon_categories' | 'organizers', names: string[], createdTracker: Set<string>): Promise<Map<string, string>> {
    const idByName = new Map<string, string>();
    if (!names.length) return idByName;
    const { rows: existing } = await client.query(`SELECT id, name FROM ${table} WHERE name = ANY($1::text[])`, [names]);
    for (const row of existing) idByName.set(row.name, row.id);
    const missing = names.filter((n) => !idByName.has(n));
    if (missing.length) {
      const { rows: created } = await client.query(`INSERT INTO ${table} (name) SELECT * FROM unnest($1::text[]) RETURNING id, name`, [missing]);
      for (const row of created) { idByName.set(row.name, row.id); createdTracker.add(row.name); }
    }
    return idByName;
  }

  const categoryIdByName = await resolveLookupTable('hackathon_categories', Array.from(new Set(prepared.flatMap((r) => r.categories))), summary.categoriesCreated);
  await client.query('DELETE FROM hackathon_category_links WHERE hackathon_id = ANY($1::uuid[])', [touchedIds]);
  {
    const hackathonIds: string[] = []; const categoryIds: string[] = [];
    for (const r of prepared) {
      const hid = idByExternalRef.get(r.externalRef)!;
      for (const c of r.categories) { hackathonIds.push(hid); categoryIds.push(categoryIdByName.get(c)!); }
    }
    if (hackathonIds.length) await client.query('INSERT INTO hackathon_category_links (hackathon_id, category_id) SELECT * FROM unnest($1::uuid[], $2::uuid[])', [hackathonIds, categoryIds]);
  }

  const organizerIdByName = await resolveLookupTable('organizers', Array.from(new Set(prepared.flatMap((r) => r.organizers))), summary.organizersCreated);
  await client.query('DELETE FROM hackathon_organizers WHERE hackathon_id = ANY($1::uuid[])', [touchedIds]);
  {
    const hackathonIds: string[] = []; const organizerIds: string[] = [];
    for (const r of prepared) {
      const hid = idByExternalRef.get(r.externalRef)!;
      for (const o of r.organizers) { hackathonIds.push(hid); organizerIds.push(organizerIdByName.get(o)!); }
    }
    if (hackathonIds.length) await client.query('INSERT INTO hackathon_organizers (hackathon_id, organizer_id) SELECT * FROM unnest($1::uuid[], $2::uuid[])', [hackathonIds, organizerIds]);
  }

  // Eligibility: one delete + one bulk insert for every (hackathon, year|label) row across the
  // whole dataset.
  await client.query('DELETE FROM hackathon_eligibility WHERE hackathon_id = ANY($1::uuid[])', [touchedIds]);
  {
    const hackathonIds: string[] = []; const years: (number | null)[] = []; const labels: (string | null)[] = [];
    for (const r of prepared) {
      const hid = idByExternalRef.get(r.externalRef)!;
      for (const e of r.eligibility) { hackathonIds.push(hid); years.push(e.year); labels.push(e.label); }
    }
    if (hackathonIds.length) {
      await client.query('INSERT INTO hackathon_eligibility (hackathon_id, year, label) SELECT * FROM unnest($1::uuid[], $2::smallint[], $3::text[])', [hackathonIds, years, labels]);
      summary.eligibilityRowsWritten = hackathonIds.length;
    }
  }

  // Timeline: Round 1 / Round 2 / Final, reusing the existing (previously unused) hackathon_rounds
  // table — same delete + bulk-insert pattern, skipping any round with no date exactly as before.
  await client.query('DELETE FROM hackathon_rounds WHERE hackathon_id = ANY($1::uuid[]) AND sequence IN (1,2,3)', [touchedIds]);
  {
    const hackathonIds: string[] = []; const names: string[] = []; const sequences: number[] = []; const startsAts: string[] = [];
    for (const r of prepared) {
      const hid = idByExternalRef.get(r.externalRef)!;
      const rounds: { sequence: number; name: string; startsAt: string | null }[] = [
        { sequence: 1, name: 'Round 1', startsAt: r.r1 },
        { sequence: 2, name: 'Round 2', startsAt: r.r2 },
        { sequence: 3, name: 'Final', startsAt: r.final },
      ];
      for (const round of rounds) {
        if (!round.startsAt) continue;
        hackathonIds.push(hid); names.push(round.name); sequences.push(round.sequence); startsAts.push(round.startsAt);
      }
    }
    if (hackathonIds.length) {
      await client.query('INSERT INTO hackathon_rounds (hackathon_id, name, sequence, starts_at) SELECT * FROM unnest($1::uuid[], $2::text[], $3::smallint[], $4::timestamptz[])', [hackathonIds, names, sequences, startsAts]);
      summary.roundsWritten = hackathonIds.length;
    }
  }

  // eligible_years is derived straight from the eligibility rows just written — rows with no
  // numeric year (only a label, e.g. "StartUp") simply never appear in `sub` and keep the
  // column's '{}' default, matching what the row-by-row version produced.
  await client.query(
    `UPDATE hackathons h SET eligible_years = sub.years
     FROM (SELECT hackathon_id, array_agg(year ORDER BY year) AS years FROM hackathon_eligibility WHERE hackathon_id = ANY($1::uuid[]) AND year IS NOT NULL GROUP BY hackathon_id) sub
     WHERE h.id = sub.hackathon_id`,
    [touchedIds],
  );
}

async function main() {
  const rows = loadRows();
  const summary: Summary = {
    totalDataRows: rows.length,
    inserted: 0,
    updated: 0,
    skipped: [],
    categoriesCreated: new Set(),
    organizersCreated: new Set(),
    roundsWritten: 0,
    eligibilityRowsWritten: 0,
  };

  if (dryRun) {
    for (const row of rows) {
      if (!row.name.trim()) { summary.skipped.push({ line: row.lineNumber, name: '(blank)', reason: 'Missing competition name.' }); continue; }
      const regClosesAt = parseSheetDate(row.regDeadline);
      const eligibility = parseEligibility(row.eligibleYear);
      const categories = Array.from(new Set(splitList(row.category, /\+/).map(normalizeCategory)));
      const organizers = splitList(row.organizer.trim() || 'Unknown Organizer', /,/);
      categories.forEach((c) => summary.categoriesCreated.add(c));
      organizers.forEach((o) => summary.organizersCreated.add(o));
      summary.eligibilityRowsWritten += eligibility.length;
      if (parseSheetDate(row.r1Date)) summary.roundsWritten++;
      if (parseSheetDate(row.r2Date)) summary.roundsWritten++;
      if (parseSheetDate(row.competitionDate)) summary.roundsWritten++;
      void regClosesAt;
      summary.inserted++; // dry-run can't distinguish insert vs update without hitting the DB
    }
    printSummary(summary, true);
    return;
  }

  const seenRefs = new Set<string>();
  const prepared = rows.map((row) => prepareRow(row, summary)).filter((r): r is PreparedRow => {
    if (!r) return false;
    if (seenRefs.has(r.externalRef)) {
      summary.skipped.push({ line: r.row.lineNumber, name: r.name, reason: 'Duplicate of an earlier row (same name and organizer).' });
      return false;
    }
    seenRefs.add(r.externalRef);
    return true;
  });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://unihack:unihack_local_password@127.0.0.1:5432/unihack_ledger' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await writeAll(client, prepared, summary);
    if (archiveMissing) {
      const archived = await client.query(`UPDATE hackathons SET status = 'archived', updated_at = now()
        WHERE source = 'csv_import' AND status <> 'archived' AND NOT (external_ref = ANY($1::text[])) RETURNING title`, [[...seenRefs]]);
      console.log(`Archived (no longer in sheet): ${archived.rowCount}`);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
  printSummary(summary, false);
}

function printSummary(summary: Summary, isDryRun: boolean) {
  console.log(`\n${isDryRun ? '[DRY RUN] ' : ''}Competition import summary`);
  console.log('--------------------------------');
  console.log(`Data rows read:        ${summary.totalDataRows}`);
  console.log(`Inserted:              ${summary.inserted}`);
  console.log(`Updated:               ${summary.updated}`);
  console.log(`Skipped (invalid):     ${summary.skipped.length}`);
  console.log(`Categories created:    ${summary.categoriesCreated.size} ${summary.categoriesCreated.size ? '(' + [...summary.categoriesCreated].join(', ') + ')' : ''}`);
  console.log(`Organizers created:    ${summary.organizersCreated.size}`);
  console.log(`Eligibility rows:      ${summary.eligibilityRowsWritten}`);
  console.log(`Timeline rounds:       ${summary.roundsWritten}`);
  if (summary.skipped.length) {
    console.log('\nSkipped rows:');
    for (const s of summary.skipped) console.log(`  line ${s.line} — ${s.name}: ${s.reason}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
