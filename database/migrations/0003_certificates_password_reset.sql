-- Completion phase (Aug 2026): wires up features whose services/schema existed but had no
-- caller yet — see server/services/ai, server/services/storage, server/services/email.
--
-- 1. Certificate upload + AI-assisted verification (achievements). One certificate per
--    achievement is the product's actual shape (re-upload replaces it — see
--    server/routes/achievements.routes.ts), so a direct FK is simpler than relying solely on the
--    achievement_files join table, which stays in place unchanged for provenance/history.
-- 2. Faculty review comments on achievements, matching the review_notes pattern
--    hackathon_suggestions already uses.
-- 3. Password reset tokens — auth.routes.ts previously had no forgot/reset-password flow at all;
--    passwordResetEmail() already existed in server/services/email/templates with no caller.
-- 4. reminders.reminded_at — lets a reminder-due scheduler (server/lib/reminderScheduler.ts)
--    mark a reminder as already notified without re-sending it every poll interval.

ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS certificate_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS ai_score NUMERIC(5,2) CHECK (ai_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS ai_reasons TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_flags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_extraction JSONB;

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Only a SHA-256 hash of the token is stored — the plaintext token exists only in the emailed
  -- link and the requester's memory, same principle as a password hash.
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id);

ALTER TABLE reminders ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ;
