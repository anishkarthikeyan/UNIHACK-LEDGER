CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE hackathon_status AS ENUM ('draft', 'pending_review', 'published', 'registration_closed', 'ongoing', 'completed', 'archived');
CREATE TYPE registration_status AS ENUM ('draft', 'submitted', 'pending_verification', 'approved', 'rejected', 'withdrawn');
CREATE TYPE membership_status AS ENUM ('invited', 'active', 'declined', 'removed');
CREATE TYPE project_visibility AS ENUM ('private', 'institution', 'public');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'changes_requested', 'rejected');
CREATE TYPE suggestion_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected');

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institutional_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  department_id UUID REFERENCES departments(id),
  status account_status NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE student_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  programme TEXT,
  year_of_study SMALLINT CHECK (year_of_study BETWEEN 1 AND 8),
  interests TEXT[] NOT NULL DEFAULT '{}',
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  phone TEXT,
  verification_status review_status NOT NULL DEFAULT 'pending'
);

CREATE TABLE faculty_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  designation TEXT,
  phone TEXT,
  can_manage_all_hackathons BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  organizer TEXT NOT NULL,
  organizer_department_id UUID REFERENCES departments(id),
  coordinator_id UUID REFERENCES users(id),
  description TEXT NOT NULL,
  domains TEXT[] NOT NULL DEFAULT '{}',
  mode TEXT NOT NULL CHECK (mode IN ('online', 'offline', 'hybrid')),
  venue TEXT,
  official_url TEXT,
  community_url TEXT,
  prize_pool TEXT,
  eligible_years SMALLINT[] NOT NULL DEFAULT '{}',
  min_team_size SMALLINT NOT NULL DEFAULT 1 CHECK (min_team_size >= 1),
  max_team_size SMALLINT NOT NULL DEFAULT 1 CHECK (max_team_size >= min_team_size),
  solo_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  registration_opens_at TIMESTAMPTZ,
  registration_closes_at TIMESTAMPTZ NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status hackathon_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hackathon_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence SMALLINT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  instructions TEXT,
  UNIQUE (hackathon_id, sequence)
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  domains TEXT[] NOT NULL DEFAULT '{}',
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  max_members SMALLINT NOT NULL CHECK (max_members BETWEEN 1 AND 20),
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
  join_mode TEXT NOT NULL CHECK (join_mode IN ('invite', 'request', 'open')) DEFAULT 'invite',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, created_by)
);

CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL CHECK (member_role IN ('leader', 'member')),
  status membership_status NOT NULL DEFAULT 'invited',
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ,
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  participation_mode TEXT NOT NULL CHECK (participation_mode IN ('solo', 'team')),
  external_registration_url TEXT,
  status registration_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((participation_mode = 'solo' AND student_id IS NOT NULL AND team_id IS NULL) OR (participation_mode = 'team' AND team_id IS NOT NULL AND student_id IS NULL)),
  UNIQUE NULLS NOT DISTINCT (hackathon_id, student_id),
  UNIQUE NULLS NOT DISTINCT (hackathon_id, team_id)
);

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  storage_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE registration_documents (
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('institutional_id', 'external_registration_proof')),
  PRIMARY KEY (registration_id, file_id)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  hackathon_id UUID REFERENCES hackathons(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  participation_mode TEXT NOT NULL CHECK (participation_mode IN ('solo', 'team')),
  problem_statement TEXT NOT NULL,
  description TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  github_url TEXT,
  demo_url TEXT,
  poster_url TEXT,
  presentation_url TEXT,
  visibility project_visibility NOT NULL DEFAULT 'private',
  showcase_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_files (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, file_id)
);

CREATE TABLE project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  score NUMERIC(5,2) CHECK (score BETWEEN 0 AND 100),
  feedback TEXT,
  status review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  hackathon_id UUID REFERENCES hackathons(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  outcome TEXT NOT NULL,
  achieved_on DATE,
  status review_status NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE achievement_files (
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  PRIMARY KEY (achievement_id, file_id)
);

CREATE TABLE hackathon_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  organizer TEXT NOT NULL,
  official_url TEXT NOT NULL,
  registration_deadline DATE,
  event_date_text TEXT,
  domain TEXT,
  mode TEXT,
  eligible_years TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  prize_pool TEXT,
  expected_participants INTEGER CHECK (expected_participants >= 0),
  description TEXT,
  status suggestion_status NOT NULL DEFAULT 'submitted',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID REFERENCES hackathons(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hackathon_interests (
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (hackathon_id, student_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX hackathons_listing_idx ON hackathons (status, registration_closes_at);
CREATE INDEX registrations_hackathon_idx ON registrations (hackathon_id, status);
CREATE INDEX notifications_recipient_idx ON notifications (recipient_id, read_at, created_at DESC);
CREATE INDEX audit_logs_created_idx ON audit_logs (created_at DESC);
CREATE INDEX hackathon_interests_student_idx ON hackathon_interests (student_id);

-- Demo password for every seeded account: Demo@123. Replace these with SSO-provisioned accounts in production.
INSERT INTO departments (code, name) VALUES ('CSE', 'Computer Science and Engineering'), ('IT', 'Information Technology'), ('ECE', 'Electronics and Communication Engineering');
INSERT INTO users (institutional_id, email, password_hash, full_name, role, department_id)
SELECT seed.institutional_id, seed.email, crypt('Demo@123', gen_salt('bf')), seed.full_name, seed.role::user_role, d.id
FROM (VALUES
  ('ST-4091', 'student@demo.edu', 'Anish K.', 'student', 'CSE'),
  ('FA-102', 'faculty@demo.edu', 'Dr. Meena R.', 'faculty', 'CSE'),
  ('AD-001', 'admin@demo.edu', 'System Admin', 'admin', 'CSE')
) AS seed(institutional_id, email, full_name, role, department_code)
JOIN departments d ON d.code = seed.department_code;
INSERT INTO student_profiles (user_id, programme, year_of_study, interests, tech_stack)
SELECT id, 'B.Tech CSE', 3, ARRAY['AI', 'Web'], ARRAY['React', 'TypeScript'] FROM users WHERE email = 'student@demo.edu';
INSERT INTO faculty_profiles (user_id, designation, can_manage_all_hackathons)
SELECT id, 'Associate Professor', TRUE FROM users WHERE email = 'faculty@demo.edu';
INSERT INTO system_settings (key, value) VALUES
  ('academic_year', '"2025-2026"'), ('default_semester', '"even"'), ('role_escalation_confirmation', 'true');
