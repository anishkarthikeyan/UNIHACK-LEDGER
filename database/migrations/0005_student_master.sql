-- Student master data foundation: the real CSE 2024–2028 roster (database/import-students.ts).
--
-- Hierarchy represented: department (users.department_id → departments.code = 'CSE')
--   → batch (student_profiles.batch_year = admission year, e.g. 2024 for 2024–2028)
--   → section (student_profiles.section)
--   → SDE / Non-SDE (student_profiles.sde_status)
--   → student (users row; Reg. No. = users.institutional_id).
--
-- Everything is additive and nullable, so existing rows, queries and API responses are unaffected.
-- No personal data beyond what the roster provides is added.

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS batch_year SMALLINT CHECK (batch_year BETWEEN 2000 AND 2100),
  ADD COLUMN IF NOT EXISTS sde_status TEXT CHECK (sde_status IN ('SDE', 'Non-SDE')),
  -- Roster metadata. The source sheet marks these as system/testing fields, not institutional
  -- facts: faculty_assignment is a label ("Section A Mentor") with no faculty account behind it
  -- yet, roster_role is the sheet's "Role" column (Student / Team Lead / Participant — the app
  -- role stays users.role = 'student'), and is_test_account/test_scenario only mark which accounts
  -- are earmarked for controlled testing. Nothing creates participation data from them.
  ADD COLUMN IF NOT EXISTS faculty_assignment TEXT,
  ADD COLUMN IF NOT EXISTS roster_role TEXT,
  ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS test_scenario TEXT,
  -- Provenance: which import owns this profile ('cse_2024_master'), or 'synthetic_retired' for a
  -- leftover generated account kept only because other rows reference it.
  ADD COLUMN IF NOT EXISTS roster_source TEXT,
  ADD COLUMN IF NOT EXISTS roster_updated_at TIMESTAMPTZ;

-- Sections are single letters in the real roster; this rejects data-entry slips such as a batch
-- year typed into the Section column.
ALTER TABLE student_profiles DROP CONSTRAINT IF EXISTS student_profiles_section_format;
ALTER TABLE student_profiles ADD CONSTRAINT student_profiles_section_format CHECK (section IS NULL OR section ~ '^[A-Z]{1,2}$');

-- A student placed in a batch must also have a section and SDE classification.
ALTER TABLE student_profiles DROP CONSTRAINT IF EXISTS student_profiles_cohort_complete;
ALTER TABLE student_profiles ADD CONSTRAINT student_profiles_cohort_complete CHECK (batch_year IS NULL OR (section IS NOT NULL AND sde_status IS NOT NULL));

CREATE INDEX IF NOT EXISTS student_profiles_cohort_idx ON student_profiles (batch_year, section, sde_status);

-- users.institutional_id and users.email are already UNIQUE, but only case-sensitively.
-- Reg. No. and email must not be importable twice in different letter case.
CREATE UNIQUE INDEX IF NOT EXISTS users_institutional_id_ci_uk ON users (upper(institutional_id));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_ci_uk ON users (lower(email));

-- Year of study is derived from the batch (admission) year rather than stored, so it never goes
-- stale. Assumes the academic year starts in June. Returns NULL outside a 1–8 year range.
CREATE OR REPLACE FUNCTION student_year_of_study(batch SMALLINT) RETURNS SMALLINT
LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN y BETWEEN 1 AND 8 THEN y::smallint END
  FROM (SELECT (extract(year FROM now())::int - batch + CASE WHEN extract(month FROM now()) >= 6 THEN 1 ELSE 0 END) AS y) s
$$;
