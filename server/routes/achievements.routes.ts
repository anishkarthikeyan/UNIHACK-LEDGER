import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { config } from '../config/env';
import { pool } from '../db/pool';
import { audit } from '../lib/audit';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest } from '../middleware/auth';
import { services } from '../services';
import { approvalEmail } from '../services/email/templates';
import { StorageValidationError } from '../services/storage/StorageService';

// Behavior unchanged from the original monolithic server/index.ts — moved verbatim, plus the
// certificate upload/download/AI-verification pipeline (Phase 3-5: LocalStorageService and the
// Gemini OCR/verification services already existed but had no route calling them) and
// notification/email fan-out on verification (Phase 7).
export const achievementsRoutes = Router();

// Memory storage: files are handed straight to StorageService (which does its own size/type
// validation against config.storage.maxFileSizeBytes) rather than buffered to a temp file on
// disk first — certificates are small (images/PDFs), so this is simpler and fine for this scale.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.storage.maxFileSizeBytes } });

// Shared SELECT list: exposes certificate presence (never the raw storage key — that's an
// internal storage detail, not something the frontend should build paths from) plus the AI
// assist fields faculty see during review. `certificate_name`/`certificate_content_type` let the
// frontend decide how to render "View certificate" (image preview vs. plain download) without a
// second round-trip.
const achievementSelectFields = `a.*, f.original_name AS certificate_name, f.content_type AS certificate_content_type,
    (a.certificate_file_id IS NOT NULL) AS has_certificate`;
const achievementJoins = `LEFT JOIN files f ON f.id = a.certificate_file_id`;

achievementsRoutes.get('/achievements/mine', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT ${achievementSelectFields}, h.title AS hackathon_title, p.title AS project_title
    FROM achievements a LEFT JOIN hackathons h ON h.id = a.hackathon_id LEFT JOIN projects p ON p.id = a.project_id ${achievementJoins}
    WHERE a.student_id = $1 ORDER BY a.created_at DESC`, [req.user!.id]);
  res.json(rows);
}));

achievementsRoutes.post('/achievements', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ title: z.string().min(2), outcome: z.string().min(2), hackathonId: z.string().uuid().optional(), projectId: z.string().uuid().optional(), achievedOn: z.string().date().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const x = input.data;
  const { rows } = await pool.query(`INSERT INTO achievements (student_id, hackathon_id, project_id, title, outcome, achieved_on) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user!.id, x.hackathonId ?? null, x.projectId ?? null, x.title, x.outcome, x.achievedOn ?? null]);
  await audit(req.user!.id, 'create', 'achievement', rows[0].id);
  res.status(201).json(rows[0]);
}));

achievementsRoutes.get('/achievements', authenticate, allow('faculty', 'admin'), ah(async (req, res) => {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : null;
  const { rows } = await pool.query(`SELECT ${achievementSelectFields}, u.full_name AS student_name, h.title AS hackathon_title, p.title AS project_title
    FROM achievements a JOIN users u ON u.id = a.student_id LEFT JOIN hackathons h ON h.id = a.hackathon_id LEFT JOIN projects p ON p.id = a.project_id ${achievementJoins}
    WHERE ($1::text IS NULL OR a.status::text = $1) ORDER BY a.created_at DESC`, [statusFilter]);
  res.json(rows);
}));

achievementsRoutes.patch('/achievements/:id', authenticate, allow('faculty', 'admin'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ status: z.enum(['approved', 'rejected', 'changes_requested']), reviewNotes: z.string().max(2000).optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const { rows } = await pool.query(`UPDATE achievements SET status = $2, verified_by = $3, verified_at = now(), review_notes = $4 WHERE id = $1 RETURNING *`,
    [req.params.id, input.data.status, req.user!.id, input.data.reviewNotes ?? null]);
  if (!rows[0]) return res.status(404).json({ error: 'Achievement not found.' });
  await audit(req.user!.id, 'verify', 'achievement', req.params.id, { status: input.data.status });

  const student = (await pool.query<{ full_name: string; email: string }>('SELECT full_name, email FROM users WHERE id = $1', [rows[0].student_id])).rows[0];
  if (student) {
    await services.notifications.notify({
      recipientId: rows[0].student_id, type: 'achievement_reviewed',
      title: `Achievement record ${input.data.status.replace('_', ' ')}`,
      body: `"${rows[0].title}" was ${input.data.status.replace('_', ' ')}${input.data.reviewNotes ? `: ${input.data.reviewNotes}` : '.'}`,
      actionUrl: '/achievements',
    });
    await services.email.send(approvalEmail(student.email, {
      recipientName: student.full_name, subjectTitle: `Achievement record: ${rows[0].title}`,
      outcome: input.data.status, note: input.data.reviewNotes, appUrl: config.appUrl,
    }));
  }

  res.json(rows[0]);
}));

// --- Certificate upload / download / AI-assisted verification ---
// Storage, OCR, and authenticity scoring already existed as fully-built, independently tested
// services (server/services/storage, server/services/ai) with nothing calling them — this is
// that call site. AI output is advisory only: it's attached to the achievement for faculty to
// see in Review & Verify, but the PATCH endpoint above is the only thing that can change
// `status`, and it always requires an explicit faculty/admin action.
achievementsRoutes.post('/achievements/:id/certificate', authenticate, allow('student'), upload.single('file'), ah(async (req: AuthRequest, res) => {
  const achievement = (await pool.query('SELECT * FROM achievements WHERE id = $1', [req.params.id])).rows[0];
  if (!achievement) return res.status(404).json({ error: 'Achievement not found.' });
  if (achievement.student_id !== req.user!.id) return res.status(403).json({ error: 'You can only attach a certificate to your own achievement.' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded. Attach a file under the "file" field.' });

  let stored;
  try {
    stored = await services.storage.save({
      buffer: req.file.buffer, originalName: req.file.originalname, contentType: req.file.mimetype, category: 'certificates',
    });
  } catch (err) {
    if (err instanceof StorageValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }

  const { rows: fileRows } = await pool.query(
    `INSERT INTO files (uploaded_by, storage_key, original_name, content_type, size_bytes) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [req.user!.id, stored.key, stored.originalName, stored.contentType, stored.sizeBytes],
  );
  const previousFileId = achievement.certificate_file_id as string | null;

  // Re-upload (e.g. after "changes requested") replaces the previous certificate, clears any
  // stale AI read on it (a new file needs a new extraction, not the old one left dangling), and
  // — if faculty had already acted on this achievement — puts it back in the review queue, since
  // GET /achievements?status=pending is how faculty find work to do and a resubmission after
  // "changes requested" or "rejected" needs another look, not to sit invisible forever.
  const needsReReview = achievement.status === 'changes_requested' || achievement.status === 'rejected';
  const { rows: updated } = await pool.query(
    `UPDATE achievements SET certificate_file_id = $2, ai_score = NULL, ai_reasons = '{}', ai_flags = '{}', ai_extraction = NULL
     ${needsReReview ? ", status = 'pending', verified_by = NULL, verified_at = NULL" : ''}
     WHERE id = $1 RETURNING *`,
    [req.params.id, fileRows[0].id],
  );
  await pool.query('INSERT INTO achievement_files (achievement_id, file_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, fileRows[0].id]);
  if (previousFileId) {
    await pool.query('DELETE FROM achievement_files WHERE achievement_id = $1 AND file_id = $2', [req.params.id, previousFileId]);
    const stillReferenced = (await pool.query('SELECT 1 FROM achievement_files WHERE file_id = $1 LIMIT 1', [previousFileId])).rowCount;
    if (!stillReferenced) {
      const old = (await pool.query('DELETE FROM files WHERE id = $1 RETURNING storage_key', [previousFileId])).rows[0];
      if (old) await services.storage.delete(old.storage_key).catch(() => {});
    }
  }
  await audit(req.user!.id, 'upload_certificate', 'achievement', req.params.id, { fileId: fileRows[0].id });

  // Best-effort AI read: never blocks the upload response and never fails the request. Runs
  // synchronously here (certificates are small, Gemini Flash is fast) rather than via a job
  // queue — acceptable for this scale; revisit if uploads start timing out in practice.
  if (services.ocr.isConfigured && services.aiVerification.isConfigured) {
    try {
      const extraction = await services.ocr.extractCertificateFields(req.file.buffer, req.file.mimetype);
      const { rows: candidates } = await pool.query<{ id: string; title: string; organizer: string; starts_at: string | null; ends_at: string | null }>(
        `SELECT id, title, organizer, starts_at, ends_at FROM hackathons
         WHERE title ILIKE $1 OR ($2::uuid IS NOT NULL AND id = $2) ORDER BY starts_at DESC NULLS LAST LIMIT 10`,
        [`%${extraction.competitionName ?? achievement.title}%`, achievement.hackathon_id],
      );
      const authenticity = await services.aiVerification.scoreAuthenticity(extraction,
        candidates.map((c) => ({ id: c.id, title: c.title, organizer: c.organizer, startsAt: c.starts_at, endsAt: c.ends_at })));
      await pool.query(
        `UPDATE achievements SET ai_score = $2, ai_reasons = $3, ai_flags = $4, ai_extraction = $5 WHERE id = $1`,
        [req.params.id, authenticity.score, authenticity.reasons, authenticity.flags, JSON.stringify(extraction)],
      );
    } catch (err) {
      // AI assist failing must never fail the upload — faculty can still review the certificate
      // manually, they just won't have a score. Logged inside each service already.
    }
  }

  const { rows: final } = await pool.query(`SELECT ${achievementSelectFields}, h.title AS hackathon_title, p.title AS project_title
    FROM achievements a LEFT JOIN hackathons h ON h.id = a.hackathon_id LEFT JOIN projects p ON p.id = a.project_id ${achievementJoins}
    WHERE a.id = $1`, [req.params.id]);
  res.status(201).json(final[0]);
}));

achievementsRoutes.get('/achievements/:id/certificate', authenticate, ah(async (req: AuthRequest, res) => {
  const achievement = (await pool.query('SELECT student_id, certificate_file_id FROM achievements WHERE id = $1', [req.params.id])).rows[0];
  if (!achievement || !achievement.certificate_file_id) return res.status(404).json({ error: 'No certificate on file.' });
  const isOwner = achievement.student_id === req.user!.id;
  const isReviewer = req.user!.role === 'faculty' || req.user!.role === 'admin';
  if (!isOwner && !isReviewer) return res.status(403).json({ error: 'You do not have permission to view this certificate.' });

  const file = (await pool.query('SELECT storage_key, original_name, content_type FROM files WHERE id = $1', [achievement.certificate_file_id])).rows[0];
  if (!file) return res.status(404).json({ error: 'Certificate file is missing from storage.' });
  const buffer = await services.storage.read(file.storage_key);
  if (!buffer) return res.status(404).json({ error: 'Certificate file is missing from storage.' });
  res.setHeader('Content-Type', file.content_type);
  res.setHeader('Content-Disposition', `inline; filename="${file.original_name.replace(/"/g, '')}"`);
  res.send(buffer);
}));
