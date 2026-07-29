-- Extends the existing `hackathons` domain to support the institution's competition
-- tracking dataset (database/Competition Dashboard - List of Competitions 26-27.csv)
-- and future detail pages, without introducing a parallel "Competition" table set.
--
-- Design notes:
-- * "Remaining days" figures are intentionally NOT stored anywhere in this schema.
--   They are always derived at read time from the stored dates (see server/index.ts).
-- * All ALTERs are additive/nullable so existing rows, queries, and API responses
--   (which SELECT h.*) keep working unchanged.
-- * `registration_closes_at` is relaxed to nullable because a meaningful share of the
--   source dataset reports the deadline as "TBA" or blank.
-- * This file is safe to run multiple times (IF NOT EXISTS / guarded ALTERs) and is
--   also folded into database/init.sql so brand-new installs get it in one shot.

ALTER TABLE hackathons ALTER COLUMN registration_closes_at DROP NOT NULL;

ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS external_ref TEXT UNIQUE;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS external_status TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS external_registered_teams INTEGER CHECK (external_registered_teams >= 0);
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS external_registered_students INTEGER CHECK (external_registered_students >= 0);
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS source TEXT;

-- Future-proofing fields for the detailed workbook (hyperlinked pages) that isn't
-- available yet. All nullable; populated later without another schema redesign.
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS registration_url TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS brochure_url TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS faq TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS judging_criteria TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS problem_statements TEXT;
-- Note: technologyTags/mode/venue/officialWebsite/minTeamSize/maxTeamSize already exist
-- as domains[]/mode/venue/official_url/min_team_size/max_team_size and are reused as-is.

-- ---------------------------------------------------------------------------
-- Category (normalized instead of a free-text column)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hackathon_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS hackathon_category_links (
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES hackathon_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (hackathon_id, category_id)
);

-- ---------------------------------------------------------------------------
-- Organizer (normalized; a competition can list more than one co-organizer)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS hackathon_organizers (
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  PRIMARY KEY (hackathon_id, organizer_id)
);

-- ---------------------------------------------------------------------------
-- Eligibility (relational rows instead of a text blob like "I, II, III, IV").
-- `year` covers student-year eligibility (I-IV -> 1-4); `label` covers
-- non-year audiences the sheet also uses ("StartUp Only", "MSMEs", ...).
-- Exactly one of the two is set per row.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hackathon_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  year SMALLINT CHECK (year BETWEEN 1 AND 8),
  label TEXT,
  CHECK ((year IS NOT NULL) <> (label IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_eligibility_year_uk ON hackathon_eligibility (hackathon_id, year) WHERE year IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS hackathon_eligibility_label_uk ON hackathon_eligibility (hackathon_id, label) WHERE label IS NOT NULL;

-- Timeline (Registration deadline stays on hackathons.registration_closes_at;
-- Round 1 / Round 2 / Final reuse the existing hackathon_rounds table instead
-- of introducing a parallel CompetitionTimeline table).

-- ---------------------------------------------------------------------------
-- Bookmarks (Save Competition / My Bookmarks / future reminders)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hackathon_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, hackathon_id)
);

CREATE INDEX IF NOT EXISTS hackathon_bookmarks_user_idx ON hackathon_bookmarks (user_id);
