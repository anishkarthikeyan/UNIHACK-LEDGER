-- Stage 2A (institutional user dataset): student_profiles has no way to record a class section
-- (verified during the Stage 0 audit — no "section" concept existed anywhere in the schema or
-- app). Additive, nullable — existing rows are unaffected; only students actually need it, so
-- it lives on student_profiles rather than the shared users table.
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS section TEXT;
