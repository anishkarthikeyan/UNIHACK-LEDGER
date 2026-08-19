import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config/env';
import { pool } from '../db/pool';
import { audit } from '../lib/audit';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest } from '../middleware/auth';
import { services } from '../services';
import { approvalEmail, registrationEmail } from '../services/email/templates';

// Behavior unchanged from the original monolithic server/index.ts — moved verbatim, plus
// notification/email fan-out on review (Phase 5/7: these events previously updated the row and
// wrote an audit log but never told the affected student anything).
export const registrationsRoutes = Router();

registrationsRoutes.get('/registrations/mine', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT r.*, h.title AS hackathon_title, h.status AS hackathon_status, h.registration_closes_at, h.starts_at, h.ends_at, t.name AS team_name
    FROM registrations r JOIN hackathons h ON h.id = r.hackathon_id LEFT JOIN teams t ON t.id = r.team_id
    WHERE r.student_id = $1 OR r.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1 AND status = 'active')
    ORDER BY r.created_at DESC`, [req.user!.id]);
  res.json(rows);
}));

registrationsRoutes.post('/registrations', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ hackathonId: z.string().uuid(), participationMode: z.enum(['solo', 'team']), teamId: z.string().uuid().optional(), externalRegistrationUrl: z.string().url().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  if ((x.participationMode === 'team') !== Boolean(x.teamId)) return res.status(400).json({ error: 'A team is required only for team registration.' });

  const hackathon = (await pool.query(
    'SELECT title, status, registration_opens_at, registration_closes_at, min_team_size, max_team_size FROM hackathons WHERE id = $1',
    [x.hackathonId],
  )).rows[0];
  if (!hackathon) return res.status(404).json({ error: 'Hackathon not found.' });

  // Registration eligibility gate: only a hackathon that's actually published and inside its
  // registration window accepts new registrations (viewable ≠ registerable — 'registration_closed'/
  // 'ongoing'/'completed' hackathons stay visible in Explore but must reject new submissions here).
  if (hackathon.status !== 'published') {
    return res.status(400).json({ error: 'Registration is not currently open for this hackathon.' });
  }
  const now = new Date();
  if (hackathon.registration_opens_at && now < new Date(hackathon.registration_opens_at)) {
    return res.status(400).json({ error: 'Registration for this hackathon has not opened yet.' });
  }
  if (hackathon.registration_closes_at && now > new Date(hackathon.registration_closes_at)) {
    return res.status(400).json({ error: 'The registration deadline for this hackathon has passed.' });
  }

  if (x.participationMode === 'team') {
    // Only an active member may register their team, and specifically the leader — registering
    // commits the whole roster, so it follows the same leader-approval model as membership
    // decisions (invites, join requests) rather than being triggerable by any member.
    const membership = (await pool.query(`SELECT member_role FROM team_members WHERE team_id = $1 AND user_id = $2 AND status = 'active'`, [x.teamId, req.user!.id])).rows[0];
    if (!membership) return res.status(403).json({ error: 'You are not an active member of this team.' });
    if (membership.member_role !== 'leader') return res.status(403).json({ error: 'Only the team leader can submit this team\'s registration.' });

    const { rows: count } = await pool.query(`SELECT COUNT(*)::int AS n FROM team_members WHERE team_id = $1 AND status = 'active'`, [x.teamId]);
    const memberCount = count[0].n;
    if (memberCount < hackathon.min_team_size || memberCount > hackathon.max_team_size) {
      return res.status(400).json({ error: `This hackathon requires teams of ${hackathon.min_team_size}-${hackathon.max_team_size} members; your team currently has ${memberCount}.` });
    }
  }

  let registration;
  try {
    const { rows } = await pool.query(`INSERT INTO registrations (hackathon_id, student_id, team_id, participation_mode, external_registration_url, status, submitted_at)
      VALUES ($1,$2,$3,$4,$5,'pending_verification',now()) RETURNING *`, [x.hackathonId, x.participationMode === 'solo' ? req.user!.id : null, x.teamId ?? null, x.participationMode, x.externalRegistrationUrl ?? null]);
    registration = rows[0];
  } catch (error) {
    // 23505 = unique_violation — the (hackathon_id, student_id) / (hackathon_id, team_id)
    // constraints in init.sql are the actual duplicate-registration prevention mechanism; this
    // turns that into the clear message a student should see instead of a generic 500.
    if ((error as { code?: string }).code === '23505') {
      return res.status(409).json({ error: x.participationMode === 'team' ? 'Your team has already registered for this hackathon.' : 'You have already registered for this hackathon.' });
    }
    throw error;
  }
  await audit(req.user!.id, 'submit', 'registration', registration.id);

  const { rows: recipientsOnSubmit } = await pool.query<{ id: string; full_name: string; email: string }>(
    x.teamId
      ? `SELECT u.id, u.full_name, u.email FROM team_members tm JOIN users u ON u.id = tm.user_id WHERE tm.team_id = $1 AND tm.status = 'active'`
      : `SELECT u.id, u.full_name, u.email FROM users u WHERE u.id = $1`,
    [x.teamId ?? req.user!.id],
  );
  for (const recipient of recipientsOnSubmit) {
    await services.notifications.notify({
      recipientId: recipient.id, type: 'registration_submitted',
      title: 'Registration submitted',
      body: `${x.teamId ? 'Your team\'s' : 'Your'} registration for ${hackathon.title} was submitted and is awaiting faculty verification.`,
      actionUrl: '/pipeline',
    });
    await services.email.send(registrationEmail(recipient.email, {
      studentName: recipient.full_name, hackathonTitle: hackathon.title, appUrl: config.appUrl,
    }));
  }

  res.status(201).json(registration);
}));

registrationsRoutes.get('/registrations', authenticate, allow('faculty', 'admin'), ah(async (req, res) => {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : null;
  const { rows } = await pool.query(`SELECT r.*, h.title AS hackathon_title, s.full_name AS student_name, t.name AS team_name
    FROM registrations r JOIN hackathons h ON h.id = r.hackathon_id LEFT JOIN users s ON s.id = r.student_id LEFT JOIN teams t ON t.id = r.team_id
    WHERE ($1::text IS NULL OR r.status::text = $1) ORDER BY r.created_at DESC LIMIT 200`, [statusFilter]);
  res.json(rows);
}));

registrationsRoutes.patch('/registrations/:id', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ status: z.enum(['approved', 'rejected']), rejectionReason: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const { rows } = await pool.query(`UPDATE registrations SET status = $2, reviewed_by = $3, reviewed_at = now(), rejection_reason = $4 WHERE id = $1 RETURNING *`,
    [req.params.id, input.data.status, req.user!.id, input.data.rejectionReason ?? null]);
  if (!rows[0]) return res.status(404).json({ error: 'Registration not found.' });
  await audit(req.user!.id, 'review', 'registration', req.params.id, { status: input.data.status });

  // Notify whoever registered: the solo student, or every active member of the team.
  const registration = rows[0];
  const hackathon = (await pool.query('SELECT title FROM hackathons WHERE id = $1', [registration.hackathon_id])).rows[0];
  const { rows: recipients } = await pool.query<{ id: string; full_name: string; email: string }>(
    registration.team_id
      ? `SELECT u.id, u.full_name, u.email FROM team_members tm JOIN users u ON u.id = tm.user_id WHERE tm.team_id = $1 AND tm.status = 'active'`
      : `SELECT u.id, u.full_name, u.email FROM users u WHERE u.id = $1`,
    [registration.team_id ?? registration.student_id],
  );
  for (const recipient of recipients) {
    await services.notifications.notify({
      recipientId: recipient.id, type: 'registration_reviewed',
      title: `Registration ${input.data.status}`,
      body: `Your registration for ${hackathon?.title ?? 'a hackathon'} was ${input.data.status}${input.data.rejectionReason ? `: ${input.data.rejectionReason}` : '.'}`,
      actionUrl: '/pipeline',
    });
    await services.email.send(approvalEmail(recipient.email, {
      recipientName: recipient.full_name, subjectTitle: `Registration for ${hackathon?.title ?? 'your hackathon'}`,
      outcome: input.data.status, note: input.data.rejectionReason, appUrl: config.appUrl,
    }));
  }

  res.json(rows[0]);
}));
