import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { Pool, PoolClient } from 'pg';
import { parseCsv } from './lib/csv';
import { DEMO_BATCH, DEMO_PASSWORD, DEMO_SECTIONS, DemoStudent, demoStudents, facultyEmail, HOD_EMAIL } from './lib/demo-cohort';

// Department-wide demo for CSE 2024 (sections A–Q). Run seed-test-staff.ts and the competition
// import first (npm run db:seed:demo does the staff step).
//
//   1. Roster sync (only with --sheet <csv>): aligns students with the III-year CSE sheet — adds
//      students missing from the database (SDE status defaults to Non-SDE; the sheet has no SDE
//      column), corrects sections, and deactivates active 2024 students the sheet no longer lists.
//   2. Passwords: Demo@123 on every active student, staff account and admin.
//   3. Activity: ~9 teams per section (1–4 members, some cross-section), each registered for 1–3
//      imported competitions; approved/rejected/pending registrations reviewed by the section's
//      Faculty Advisor; results (winner, runner-up, finalist…) logged as team achievements; a few
//      projects and pending suggestions. Deterministic (fixed random seed).
//
// One live student per section is left untouched for the hand-run demo. Refuses to run on top of
// existing activity — `npm run db:reset:demo` first.
//
// Usage: tsx database/seed-demo.ts [--sheet "/path/to/III year CSE Database.csv"]

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://unihack:unihack_local_password@127.0.0.1:5432/unihack_ledger' });
const sheetArg = process.argv.indexOf('--sheet');
const sheetPath = sheetArg > -1 ? process.argv[sheetArg + 1] : null;

// --- deterministic randomness ---
let seed = 20261007;
const rand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = <T>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];
const weighted = <T>(pairs: [T, number][]): T => { let r = rand() * pairs.reduce((n, [, w]) => n + w, 0); for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; } return pairs[0][0]; };
const shuffle = <T>(xs: T[]): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const ADJ = ['Byte', 'Null', 'Stack', 'Code', 'Logic', 'Quantum', 'Pixel', 'Neural', 'Binary', 'Cyber', 'Turbo', 'Async', 'Kernel', 'Vector', 'Lambda', 'Cloud', 'Data', 'Hyper', 'Rapid', 'Silicon', 'Tensor', 'Debug', 'Atomic', 'Crimson', 'Echo'];
const NOUN = ['Builders', 'Pointers', 'Smashers', 'Crafters', 'Lords', 'Ninjas', 'Wizards', 'Knights', 'Pioneers', 'Hackers', 'Mavericks', 'Titans', 'Rangers', 'Squad', 'Coders', 'Forge', 'Labs', 'Minds', 'Voyagers', 'Sparks'];
const PROJECTS = [
  { title: 'CampusPulse', problem: 'Students miss campus events and bus timings because information is scattered.', tech: ['React', 'Node.js', 'PostgreSQL'] },
  { title: 'SmartAttend', problem: 'Manual attendance wastes ten minutes of every lecture and is easy to proxy.', tech: ['Flutter', 'Firebase', 'Face Recognition'] },
  { title: 'EnergyEye', problem: 'Classrooms leave lights and fans running when empty, wasting power.', tech: ['ESP32', 'MQTT', 'Grafana'] },
  { title: 'SafeRoute', problem: 'Late-evening students have no way to share a safe walking route on campus.', tech: ['Kotlin', 'Google Maps', 'Express'] },
  { title: 'LibraryLens', problem: 'Finding a free seat or a specific book in the library takes too long.', tech: ['Python', 'OpenCV', 'FastAPI'] },
  { title: 'AgriSense', problem: 'Small farmers cannot predict crop disease early enough to act.', tech: ['TensorFlow', 'React Native', 'AWS'] },
  { title: 'MediQueue', problem: 'Government hospital OPD queues waste hours of patients’ time.', tech: ['Next.js', 'Twilio', 'MongoDB'] },
  { title: 'FraudShield', problem: 'UPI scams target first-time digital payment users.', tech: ['Python', 'XGBoost', 'Kafka'] },
];
const RESULT_LABEL: Record<string, string> = { winner: 'Winner', runner_up: 'Runner-up', finalist: 'Finalist', special_mention: 'Special mention' };
const SUGGESTIONS = [
  { title: 'Smart India Hackathon 2027', organizer: 'Ministry of Education', url: 'https://sih.gov.in', domain: 'Open Innovation' },
  { title: 'Google Solution Challenge 2027', organizer: 'Google Developer Student Clubs', url: 'https://developers.google.com/community/gdsc-solution-challenge', domain: 'Social Good' },
  { title: 'Microsoft Imagine Cup 2027', organizer: 'Microsoft', url: 'https://imaginecup.microsoft.com', domain: 'AI' },
  { title: 'ETHIndia 2026', organizer: 'Devfolio', url: 'https://ethindia.co', domain: 'Web3' },
  { title: 'HackerEarth Data Science Challenge', organizer: 'HackerEarth', url: 'https://www.hackerearth.com/challenges', domain: 'Data Science' },
  { title: 'Flipkart GRiD 9.0', organizer: 'Flipkart', url: 'https://unstop.com', domain: 'E-commerce' },
];

interface Hackathon { id: string; title: string; status: string; closes: Date | null; endsHint: Date | null }

async function syncRoster(client: PoolClient, path: string) {
  const rows = parseCsv(readFileSync(path, 'utf8')).filter((r) => r.length > 4 && /^\d{2}CS\d{4}$/i.test((r[1] ?? '').trim()));
  const sheet = new Map(rows.map((r) => [r[1].trim().toUpperCase(), { name: r[2].trim().toUpperCase(), section: r[4].trim().toUpperCase() }]));
  const dept = (await client.query(`SELECT id FROM departments WHERE code = 'CSE'`)).rows[0];
  const existing = new Map((await client.query(`SELECT u.id, upper(u.institutional_id) AS reg, u.status, sp.section FROM users u JOIN student_profiles sp ON sp.user_id = u.id
    WHERE u.role = 'student' AND sp.batch_year = $1`, [DEMO_BATCH])).rows.map((r) => [r.reg, r]));
  let added = 0; let moved = 0; let deactivated = 0;
  for (const [reg, s] of sheet) {
    const cur = existing.get(reg);
    if (!cur) {
      const u = (await client.query(`INSERT INTO users (institutional_id, email, full_name, role, department_id, status) VALUES ($1, $2, $3, 'student', $4, 'active')
        ON CONFLICT (email) DO UPDATE SET status = 'active' RETURNING id`, [reg, `${reg.toLowerCase()}@unihack.edu`, s.name, dept.id])).rows[0];
      await client.query(`INSERT INTO student_profiles (user_id, batch_year, section, sde_status, faculty_assignment, roster_role, roster_source, roster_updated_at)
        VALUES ($1, $2, $3, 'Non-SDE', $4, 'Student', 'iii_year_cse_sheet', now()) ON CONFLICT (user_id) DO UPDATE SET section = EXCLUDED.section, batch_year = EXCLUDED.batch_year`,
        [u.id, DEMO_BATCH, s.section, `Section ${s.section} Mentor`]);
      added++; console.log(`  added       ${reg} ${s.name} (Section ${s.section}, SDE status unknown → Non-SDE)`);
    } else {
      if (cur.section !== s.section) { await client.query('UPDATE student_profiles SET section = $2, faculty_assignment = $3, roster_updated_at = now() WHERE user_id = $1', [cur.id, s.section, `Section ${s.section} Mentor`]); moved++; console.log(`  section     ${reg}: ${cur.section} → ${s.section}`); }
      if (cur.status !== 'active') await client.query(`UPDATE users SET status = 'active' WHERE id = $1`, [cur.id]);
    }
  }
  for (const [reg, cur] of existing) {
    if (!sheet.has(reg) && cur.status === 'active') { await client.query(`UPDATE users SET status = 'inactive', updated_at = now() WHERE id = $1`, [cur.id]); deactivated++; console.log(`  deactivated ${reg} (not in sheet)`); }
  }
  console.log(`Roster sync: ${sheet.size} in sheet · ${added} added · ${moved} section changes · ${deactivated} deactivated`);
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = (await client.query('SELECT (SELECT COUNT(*) FROM teams)::int + (SELECT COUNT(*) FROM registrations)::int AS n')).rows[0].n;
    if (existing) throw new Error('Activity already exists. Run `npm run db:reset:demo` first, then seed again.');

    if (sheetPath) await syncRoster(client, sheetPath);
    else console.log('Roster sync skipped (pass --sheet <csv> to align students with the III-year CSE sheet).');

    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const pw = await client.query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE status = 'active'`, [hash]);
    console.log(`Password ${DEMO_PASSWORD} set on ${pw.rowCount} active accounts.`);

    const students = await demoStudents(client);
    const faculty = new Map<string, string>();
    for (const sec of DEMO_SECTIONS) {
      const f = (await client.query('SELECT id FROM users WHERE email = $1', [facultyEmail(sec)])).rows[0];
      if (!f) throw new Error(`Missing ${facultyEmail(sec)} — run database/seed-test-staff.ts first.`);
      faculty.set(sec, f.id);
    }
    const hod = (await client.query('SELECT id FROM users WHERE email = $1', [HOD_EMAIL])).rows[0];

    const hackathons: Hackathon[] = (await client.query(`SELECT h.id, h.title, h.status, h.registration_closes_at AS closes,
        (SELECT MAX(COALESCE(r.ends_at, r.starts_at)) FROM hackathon_rounds r WHERE r.hackathon_id = h.id) AS ends_hint
      FROM hackathons h WHERE h.source = 'csv_import' AND h.status IN ('published', 'ongoing', 'completed')`)).rows
      .map((r) => ({ id: r.id, title: r.title, status: r.status, closes: r.closes, endsHint: r.ends_hint }));
    const byStatus = (s: string) => hackathons.filter((h) => h.status === s);
    const pools = { completed: byStatus('completed'), ongoing: byStatus('ongoing'), published: byStatus('published') };
    console.log(`Competitions: ${pools.completed.length} completed · ${pools.ongoing.length} ongoing · ${pools.published.length} open`);

    // --- teams ---
    const seedable = students.filter((s) => !s.live);
    const teamCount = new Map<string, number>();
    const bySection = new Map(DEMO_SECTIONS.map((sec) => [sec, shuffle(seedable.filter((s) => s.section === sec))]));
    const available = (s: DemoStudent) => (teamCount.get(s.id) ?? 0) < 2;
    // Spread participation: prefer students on no team yet; a few end up on two teams.
    const choose = (from: DemoStudent[], exclude: DemoStudent[]) => {
      const free = from.filter((s) => !exclude.includes(s) && !teamCount.get(s.id));
      const second = from.filter((s) => !exclude.includes(s) && available(s));
      const options = free.length && rand() < 0.85 ? free : second;
      return options.length ? pick(options) : undefined;
    };
    const usedNames = new Set<string>();
    const teamName = () => { for (;;) { const n = `${pick(ADJ)} ${pick(NOUN)}`; if (!usedNames.has(n)) { usedNames.add(n); return n; } } };

    const teams: { id: string; name: string; leader: DemoStudent; members: DemoStudent[] }[] = [];
    for (const sec of DEMO_SECTIONS) {
      const pool = bySection.get(sec)!;
      const target = Math.max(4, Math.round(pool.length / 4));
      for (let t = 0; t < target; t++) {
        const leader = choose(pool, []);
        if (!leader) break;
        const size = weighted<number>([[1, 15], [2, 25], [3, 30], [4, 30]]);
        const members = [leader];
        while (members.length < size) {
          const crossSection = rand() < 0.2;
          const source = crossSection ? bySection.get(pick(DEMO_SECTIONS.filter((x) => x !== sec)))! : pool;
          const m = choose(source, members);
          if (!m) break;
          members.push(m);
        }
        const name = teamName();
        const p = pick(PROJECTS);
        const createdAt = new Date(Date.UTC(2026, 5 + Math.floor(rand() * 3), 1 + Math.floor(rand() * 27)));
        const team = (await client.query(`INSERT INTO teams (name, description, max_members, visibility, join_mode, domains, tech_stack, created_by, created_at)
          VALUES ($1, $2, 4, $3, 'invite', $4, $5, $6, $7) RETURNING id`,
          [name, `Section ${sec} team working on ${p.title.toLowerCase()}-style problems.`, rand() < 0.8 ? 'public' : 'private', ['Web', 'AI/ML'], p.tech, leader.id, createdAt])).rows[0];
        for (const [i, m] of members.entries()) {
          await client.query(`INSERT INTO team_members (team_id, user_id, member_role, status, invited_by, joined_at) VALUES ($1, $2, $3, 'active', $4, $5)`,
            [team.id, m.id, i === 0 ? 'leader' : 'member', i === 0 ? null : leader.id, createdAt]);
          teamCount.set(m.id, (teamCount.get(m.id) ?? 0) + 1);
        }
        teams.push({ id: team.id, name, leader, members });
      }
    }
    const crossTeams = teams.filter((t) => new Set(t.members.map((m) => m.section)).size > 1).length;
    console.log(`Teams: ${teams.length} (${crossTeams} with members from more than one section), ${new Set(teams.flatMap((t) => t.members.map((m) => m.id))).size} students on teams`);

    // --- registrations, results, projects ---
    let regs = 0; let wins = 0; let pendingWins = 0; let projects = 0;
    const counts: Record<string, number> = {};
    for (const team of teams) {
      const reviewer = faculty.get(team.leader.section)!;
      const n = weighted<number>([[1, 40], [2, 35], [3, 25]]);
      const chosen = new Set<string>();
      for (let i = 0; i < n; i++) {
        const bucket = weighted<keyof typeof pools>([['completed', 60], ['ongoing', 25], ['published', 15]]);
        const h = pick(pools[bucket].length ? pools[bucket] : pools.completed);
        if (chosen.has(h.id)) continue;
        chosen.add(h.id);
        const closes = h.closes ?? new Date(Date.UTC(2026, 8, 1));
        const submitted = new Date(closes.getTime() - (2 + Math.floor(rand() * 20)) * 86400000);
        const status = h.status === 'published' ? weighted<string>([['pending_verification', 60], ['approved', 40]]) : weighted<string>([['approved', 92], ['rejected', 8]]);
        counts[status] = (counts[status] ?? 0) + 1;
        await client.query(`INSERT INTO registrations (hackathon_id, team_id, participation_mode, status, submitted_at, reviewed_by, reviewed_at, rejection_reason, created_at)
          VALUES ($1, $2, 'team', $3, $4, $5, $6, $7, $4)`,
          [h.id, team.id, status, submitted, status === 'pending_verification' ? null : reviewer,
            status === 'pending_verification' ? null : new Date(submitted.getTime() + 86400000), status === 'rejected' ? 'Proof of registration on the organizer portal was not attached.' : null]);
        regs++;

        // Results: completed competitions have final results; ongoing ones occasionally a finalist spot.
        if (status !== 'approved' || h.status === 'published') continue;
        const result = h.status === 'completed'
          ? weighted<string | null>([['winner', 10], ['runner_up', 10], ['finalist', 12], ['special_mention', 5], [null, 63]])
          : weighted<string | null>([['finalist', 15], [null, 85]]);
        if (!result) continue;
        const verified = rand() < 0.85;
        const achievedOn = h.endsHint ?? new Date(closes.getTime() + 20 * 86400000);
        await client.query(`INSERT INTO achievements (student_id, team_id, hackathon_id, title, outcome, result, achieved_on, status, verified_by, verified_at, review_notes, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [team.leader.id, team.id, h.id, h.title, `${RESULT_LABEL[result]} — team ${team.name}`, result, achievedOn,
            verified ? 'approved' : 'pending', verified ? reviewer : null, verified ? new Date(achievedOn.getTime() + 2 * 86400000) : null,
            verified ? 'Verified against certificate.' : null, new Date(achievedOn.getTime() + 86400000)]);
        if (result === 'winner' || result === 'runner_up') { if (verified) wins++; else pendingWins++; }
        if (!verified) {
          const recipients = new Set([reviewer, ...team.members.map((m) => faculty.get(m.section)!), hod?.id].filter(Boolean));
          for (const r of recipients) {
            await client.query(`INSERT INTO notifications (recipient_id, type, title, body, action_url) VALUES ($1, 'achievement_submitted', $2, $3, '/review')`,
              [r, result === 'winner' || result === 'runner_up' ? `New win logged: ${RESULT_LABEL[result]}` : 'New achievement logged',
                `${team.leader.name} (${team.leader.institutionalId}, Section ${team.leader.section}) for team ${team.name} logged "${h.title}" — ${RESULT_LABEL[result]}. Verify it under Review & Verify.`]);
          }
        }
      }
      if (rand() < 0.4 && chosen.size) {
        const p = pick(PROJECTS);
        const project = (await client.query(`INSERT INTO projects (title, slug, owner_id, hackathon_id, team_id, participation_mode, problem_statement, description, tech_stack, github_url, visibility)
          VALUES ($1, $2, $3, $4, $5, 'team', $6, $7, $8, $9, 'institution') RETURNING id`,
          [`${p.title} by ${team.name}`, `${p.title}-${team.id.slice(0, 8)}`.toLowerCase(), team.leader.id, [...chosen][0], team.id, p.problem,
            `${p.title} — ${p.problem} Built by team ${team.name} with ${p.tech.join(', ')}.`, p.tech, `https://github.com/${team.name.toLowerCase().replace(/\s+/g, '-')}/${p.title.toLowerCase()}`])).rows[0];
        if (rand() < 0.6) await client.query(`INSERT INTO project_reviews (project_id, reviewer_id, score, feedback, status) VALUES ($1, $2, $3, 'Solid prototype, well documented.', 'approved')`, [project.id, reviewer, 70 + Math.floor(rand() * 26)]);
        projects++;
      }
    }
    console.log(`Registrations: ${regs} (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')})`);
    console.log(`Results: ${wins} verified wins/runner-ups, ${pendingWins} awaiting faculty verification · Projects: ${projects}`);

    // --- pending suggestions, each notifying the student's Faculty Advisor ---
    for (const sug of SUGGESTIONS) {
      const s = pick(seedable);
      await client.query(`INSERT INTO hackathon_suggestions (submitted_by, title, organizer, official_url, description, registration_deadline, domain, mode)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'online')`, [s.id, sug.title, sug.organizer, sug.url, `${sug.title} by ${sug.organizer}. Our team would like the department to list this competition.`, '2026-11-30', sug.domain]);
      await client.query(`INSERT INTO notifications (recipient_id, type, title, body, action_url) VALUES ($1, 'suggestion_submitted', 'New hackathon suggestion', $2, '/review')`,
        [faculty.get(s.section), `${s.name} (${s.institutionalId}, Section ${s.section}) suggested "${sug.title}" by ${sug.organizer}. Review it under Review & Verify.`]);
    }
    console.log(`Suggestions: ${SUGGESTIONS.length} pending`);

    await client.query('COMMIT');

    console.log('\nLogins — password for all: Demo@123');
    console.log(`  HOD          ${HOD_EMAIL}`);
    console.log('  admin        admin@unihack.edu');
    console.log('  faculty      test.faculty.<a…q>@unihack.edu  (one per section)');
    console.log('  students     <reg no in lowercase>@unihack.edu  e.g. 24cs0002@unihack.edu');
    console.log('  live (no seeded activity), one per section:');
    for (const s of students.filter((x) => x.live)) console.log(`    Section ${s.section}  ${s.email}  ${s.name} (${s.sde})`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

main().catch((err) => { console.error(err.message ?? err); process.exitCode = 1; }).finally(() => pool.end());
