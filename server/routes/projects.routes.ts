import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config/env';
import { pool } from '../db/pool';
import { audit } from '../lib/audit';
import { slugify } from '../lib/slugify';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest } from '../middleware/auth';
import { services } from '../services';
import { approvalEmail } from '../services/email/templates';

// Behavior unchanged from the original monolithic server/index.ts — moved verbatim, plus
// notification/email fan-out on review (Phase 7).
export const projectsRoutes = Router();

projectsRoutes.get('/projects/mine', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT p.*, h.title AS hackathon_title, t.name AS team_name FROM projects p
    LEFT JOIN hackathons h ON h.id = p.hackathon_id LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.owner_id = $1 OR p.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1 AND status = 'active')
    ORDER BY p.updated_at DESC`, [req.user!.id]);
  res.json(rows);
}));

projectsRoutes.get('/projects/showcase', authenticate, ah(async (_req, res) => {
  const { rows } = await pool.query(`SELECT p.*, h.title AS hackathon_title, t.name AS team_name FROM projects p
    LEFT JOIN hackathons h ON h.id = p.hackathon_id LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.visibility = 'public' ORDER BY p.showcase_featured DESC, p.created_at DESC LIMIT 60`);
  res.json(rows);
}));

projectsRoutes.get('/projects/all', authenticate, allow('faculty', 'admin'), ah(async (_req, res) => {
  const { rows } = await pool.query(`SELECT p.*, h.title AS hackathon_title, t.name AS team_name, u.full_name AS owner_name,
    (SELECT status FROM project_reviews WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1) AS review_status
    FROM projects p LEFT JOIN hackathons h ON h.id = p.hackathon_id LEFT JOIN teams t ON t.id = p.team_id JOIN users u ON u.id = p.owner_id
    ORDER BY p.updated_at DESC`);
  res.json(rows);
}));

projectsRoutes.get('/projects/:id', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT p.*, h.title AS hackathon_title, t.name AS team_name,
    (SELECT row_to_json(review) FROM (
      SELECT pr.status, pr.feedback, pr.score, pr.created_at, u.full_name AS reviewer_name
      FROM project_reviews pr JOIN users u ON u.id = pr.reviewer_id
      WHERE pr.project_id = p.id ORDER BY pr.created_at DESC LIMIT 1
    ) review) AS latest_review
    FROM projects p
    LEFT JOIN hackathons h ON h.id = p.hackathon_id LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.id = $1 AND (p.owner_id = $2 OR p.visibility != 'private' OR p.team_id IN (SELECT team_id FROM team_members WHERE user_id = $2 AND status = 'active'))`, [req.params.id, req.user!.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Project not found.' });
  res.json(rows[0]);
}));

projectsRoutes.post('/projects/:id/review', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ status: z.enum(['approved', 'changes_requested', 'rejected']), feedback: z.string().optional(), score: z.number().min(0).max(100).optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const project = (await pool.query('SELECT title, owner_id, team_id FROM projects WHERE id = $1', [req.params.id])).rows[0];
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  const { rows } = await pool.query(`INSERT INTO project_reviews (project_id, reviewer_id, score, feedback, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.id, req.user!.id, x.score ?? null, x.feedback ?? null, x.status]);
  await audit(req.user!.id, 'review', 'project', req.params.id, { status: x.status });

  const { rows: recipients } = await pool.query<{ id: string; full_name: string; email: string }>(
    project.team_id
      ? `SELECT u.id, u.full_name, u.email FROM team_members tm JOIN users u ON u.id = tm.user_id WHERE tm.team_id = $1 AND tm.status = 'active'`
      : `SELECT u.id, u.full_name, u.email FROM users u WHERE u.id = $1`,
    [project.team_id ?? project.owner_id],
  );
  for (const recipient of recipients) {
    await services.notifications.notify({
      recipientId: recipient.id, type: 'project_reviewed',
      title: `Project ${x.status.replace('_', ' ')}`,
      body: `"${project.title}" was ${x.status.replace('_', ' ')}${x.feedback ? `: ${x.feedback}` : '.'}`,
      actionUrl: '/projects',
    });
    await services.email.send(approvalEmail(recipient.email, {
      recipientName: recipient.full_name, subjectTitle: `Project: ${project.title}`,
      outcome: x.status, note: x.feedback, appUrl: config.appUrl,
    }));
  }

  res.status(201).json(rows[0]);
}));

projectsRoutes.post('/projects', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(2), problemStatement: z.string().min(10), description: z.string().min(10), participationMode: z.enum(['solo', 'team']), hackathonId: z.string().uuid().optional(), teamId: z.string().uuid().optional(), techStack: z.array(z.string()).default([]), githubUrl: z.string().url().optional(), demoUrl: z.string().url().optional(), posterUrl: z.string().url().optional(), presentationUrl: z.string().url().optional(), visibility: z.enum(['private', 'institution', 'public']).default('private') }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const { rows } = await pool.query(`INSERT INTO projects (title, slug, owner_id, hackathon_id, team_id, participation_mode, problem_statement, description, tech_stack, github_url, demo_url, poster_url, presentation_url, visibility)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, [x.title, slugify(x.title), req.user!.id, x.hackathonId ?? null, x.teamId ?? null, x.participationMode, x.problemStatement, x.description, x.techStack, x.githubUrl ?? null, x.demoUrl ?? null, x.posterUrl ?? null, x.presentationUrl ?? null, x.visibility]);
  await audit(req.user!.id, 'create', 'project', rows[0].id);
  res.status(201).json(rows[0]);
}));
