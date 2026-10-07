-- Phase 2: CSE organizational hierarchy + role-based access.
--
-- Roles (user_role): student, faculty (= Faculty Advisor), coordinator, sde_coordinator, hod, admin.
-- 'faculty' keeps its existing enum value so every existing row/query keeps working.
--
-- Scope model: one table says which part of the hierarchy each staff member covers.
--   Department → Batch (NULL = every batch) → Section (NULL = every section).
--   faculty          : one row per assigned section            (department, batch, section)
--   coordinator      : department + batch                       (section NULL)
--   sde_coordinator  : department + batch; SDE-only is enforced by the role (server/lib/scope.ts)
--   hod              : department                               (batch and section NULL)
-- A staff user with no rows sees no students. Admin is a system role and needs no rows.
-- The roster's "Faculty Assignment" text ("Section A Mentor") stays test metadata; access is
-- decided only by this table.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sde_coordinator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hod';

CREATE TABLE IF NOT EXISTS staff_scope_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  batch_year SMALLINT CHECK (batch_year BETWEEN 2000 AND 2100),
  section TEXT CHECK (section ~ '^[A-Z]{1,2}$'),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A section can't be assigned without its batch.
  CHECK (section IS NULL OR batch_year IS NOT NULL)
);

-- One row per (user, department, batch, section), treating NULL as "all".
CREATE UNIQUE INDEX IF NOT EXISTS staff_scope_assignments_uk
  ON staff_scope_assignments (user_id, department_id, COALESCE(batch_year, 0), COALESCE(section, ''));
CREATE INDEX IF NOT EXISTS staff_scope_assignments_user_idx ON staff_scope_assignments (user_id);
