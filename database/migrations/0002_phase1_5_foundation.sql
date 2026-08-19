-- Phase 1.5 — Architecture & Mobile Foundation.
--
-- Two unrelated but small, additive changes bundled into one migration because both are
-- foundation work for this phase rather than a new feature's schema:
--
-- 1. Missing indexes found during the DB audit (Part 11). Several "mine" endpoints
--    (/teams/mine, /registrations/mine, /projects/mine, /achievements/mine) filter by a foreign
--    key column that had no supporting index — only the composite PK on team_members
--    (team_id, user_id) existed, which doesn't help a user_id-only lookup since it isn't the
--    leading column. These are pure additions: no behavior change, only query plans improve.
--
-- 2. push_tokens: the notification model needed to register a device for push delivery (Phase
--    1.5 Part 5 asks for "notification models" as foundation work, ahead of Phase 6 actually
--    sending anything via FCM). Not used by any route yet — see
--    server/services/notifications/NotificationService.ts.

CREATE INDEX IF NOT EXISTS team_members_user_idx ON team_members (user_id);
CREATE INDEX IF NOT EXISTS registrations_student_idx ON registrations (student_id);
CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects (owner_id);
CREATE INDEX IF NOT EXISTS achievements_student_idx ON achievements (student_id);

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON push_tokens (user_id);
