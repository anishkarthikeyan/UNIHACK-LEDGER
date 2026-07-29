import 'dotenv/config';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool, PoolClient } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Idempotent importer for the institution's competition tracking sheet.
// Reuses the existing `hackathons` table (see database/migrations/0001_competition_dataset.sql)
// instead of a parallel Competition table. Safe to run repeatedly: rows are matched by a
// stable external_ref derived from (name + organizer), never by the CSV row number, and
// every write is an upsert.
//
// Usage:
//   tsx database/import-competitions.ts [path-to-csv] [--dry-run]

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
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

// --- CSV parsing (RFC 4180-ish: quoted fields, embedded commas, "" escapes) ---

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

function loadRows(): ImportRow[] {
  const text = readFileSync(csvPath, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  // Row 1 is a title-only row, row 2 is the real header (see task brief).
  const header = parseCsvLine(lines[1]);
  const mismatched = header.some((h, i) => h !== EXPECTED_HEADER[i]);
  if (mismatched) {
    console.warn('Warning: CSV header does not exactly match the expected columns. Proceeding by position anyway.');
    console.warn('Expected:', EXPECTED_HEADER.join(' | '));
    console.warn('Found:   ', header.join(' | '));
  }

  const rows: ImportRow[] = [];
  for (let i = 2; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]);
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

async function getOrCreate(client: PoolClient, table: 'hackathon_categories' | 'organizers', name: string, createdTracker: Set<string>): Promise<string> {
  const existing = await client.query(`SELECT id FROM ${table} WHERE name = $1`, [name]);
  if (existing.rows[0]) return existing.rows[0].id;
  const inserted = await client.query(`INSERT INTO ${table} (name) VALUES ($1) RETURNING id`, [name]);
  createdTracker.add(name);
  return inserted.rows[0].id;
}

async function importRow(client: PoolClient, row: ImportRow, summary: Summary): Promise<void> {
  const name = row.name.trim();
  if (!name) {
    summary.skipped.push({ line: row.lineNumber, name: '(blank)', reason: 'Missing competition name.' });
    return;
  }

  const organizerRaw = row.organizer.trim() || 'Unknown Organizer';
  const externalRef = `csv:${stableKey(`${name}|${organizerRaw}`)}`;

  const regClosesAt = parseSheetDate(row.regDeadline);
  const r1 = parseSheetDate(row.r1Date);
  const r2 = parseSheetDate(row.r2Date);
  const final = parseSheetDate(row.competitionDate);

  const eligibility = parseEligibility(row.eligibleYear);
  const eligibleYears = eligibility.filter((e) => e.year !== null).map((e) => e.year as number).sort((a, b) => a - b);
  const categories = splitList(row.category, /\+/);
  const organizers = splitList(organizerRaw, /,/);

  const status = classifyStatus(regClosesAt, [r1, r2, final]);
  const description = `${name} — organized by ${organizerRaw}. Imported from the institution's competition tracking sheet; full details will be added once the source workbook is available.`;

  const upsert = await client.query(
    `INSERT INTO hackathons (
       title, slug, organizer, description, mode, registration_closes_at,
       eligible_years, status, external_ref, external_status,
       external_registered_teams, external_registered_students, source, prize_pool
     ) VALUES ($1,$2,$3,$4,'hybrid',$5,$6,$7,$8,$9,$10,$11,'csv_import',$12)
     ON CONFLICT (external_ref) DO UPDATE SET
       title = EXCLUDED.title, organizer = EXCLUDED.organizer, description = EXCLUDED.description,
       registration_closes_at = EXCLUDED.registration_closes_at, eligible_years = EXCLUDED.eligible_years,
       status = EXCLUDED.status, external_status = EXCLUDED.external_status,
       external_registered_teams = EXCLUDED.external_registered_teams,
       external_registered_students = EXCLUDED.external_registered_students,
       prize_pool = EXCLUDED.prize_pool, updated_at = now()
     RETURNING id, (xmax = 0) AS inserted`,
    [
      name, `${baseSlug(name)}-${stableKey(externalRef).slice(-8)}`, organizerRaw, description,
      regClosesAt, eligibleYears, status, externalRef, nullIfBlank(row.status),
      parseIntOrNull(row.regTeams), parseIntOrNull(row.regStudents), nullIfBlank(row.prizeAmount),
    ],
  );
  const hackathonId = upsert.rows[0].id as string;
  if (upsert.rows[0].inserted) summary.inserted++; else summary.updated++;

  // Categories: replace the link set so a re-import reflects the sheet's current values.
  await client.query('DELETE FROM hackathon_category_links WHERE hackathon_id = $1', [hackathonId]);
  for (const categoryName of categories) {
    const categoryId = await getOrCreate(client, 'hackathon_categories', categoryName, summary.categoriesCreated);
    await client.query('INSERT INTO hackathon_category_links (hackathon_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [hackathonId, categoryId]);
  }

  // Organizers: same replace-in-place approach.
  await client.query('DELETE FROM hackathon_organizers WHERE hackathon_id = $1', [hackathonId]);
  for (const organizerName of organizers) {
    const organizerId = await getOrCreate(client, 'organizers', organizerName, summary.organizersCreated);
    await client.query('INSERT INTO hackathon_organizers (hackathon_id, organizer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [hackathonId, organizerId]);
  }

  // Eligibility.
  await client.query('DELETE FROM hackathon_eligibility WHERE hackathon_id = $1', [hackathonId]);
  for (const e of eligibility) {
    await client.query('INSERT INTO hackathon_eligibility (hackathon_id, year, label) VALUES ($1,$2,$3)', [hackathonId, e.year, e.label]);
    summary.eligibilityRowsWritten++;
  }

  // Timeline: Round 1 / Round 2 / Final, reusing the existing (previously unused) hackathon_rounds table.
  await client.query('DELETE FROM hackathon_rounds WHERE hackathon_id = $1 AND sequence IN (1,2,3)', [hackathonId]);
  const rounds: { sequence: number; name: string; startsAt: string | null }[] = [
    { sequence: 1, name: 'Round 1', startsAt: r1 },
    { sequence: 2, name: 'Round 2', startsAt: r2 },
    { sequence: 3, name: 'Final', startsAt: final },
  ];
  for (const round of rounds) {
    if (!round.startsAt) continue;
    await client.query('INSERT INTO hackathon_rounds (hackathon_id, name, sequence, starts_at) VALUES ($1,$2,$3,$4)', [hackathonId, round.name, round.sequence, round.startsAt]);
    summary.roundsWritten++;
  }
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
      const categories = splitList(row.category, /\+/);
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

  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://unihack:unihack_local_password@127.0.0.1:5433/unihack_ledger' });
  for (const row of rows) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await importRow(client, row, summary);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      summary.skipped.push({ line: row.lineNumber, name: row.name || '(blank)', reason: err instanceof Error ? err.message : String(err) });
    } finally {
      client.release();
    }
  }
  await pool.end();
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
