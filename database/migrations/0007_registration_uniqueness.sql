-- init.sql declared both registration uniqueness constraints NULLS NOT DISTINCT. Solo registrations
-- have team_id NULL and team registrations have student_id NULL, so that treated every solo
-- registration for a hackathon as a duplicate of every other (and likewise for teams): only the
-- first student/team could register. Plain UNIQUE ignores NULLs, which is the intended rule —
-- one registration per (hackathon, student) and per (hackathon, team).
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_hackathon_id_student_id_key;
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_hackathon_id_team_id_key;
ALTER TABLE registrations ADD CONSTRAINT registrations_hackathon_id_student_id_key UNIQUE (hackathon_id, student_id);
ALTER TABLE registrations ADD CONSTRAINT registrations_hackathon_id_team_id_key UNIQUE (hackathon_id, team_id);
