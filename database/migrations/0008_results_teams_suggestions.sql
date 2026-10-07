-- Competition results, team-level achievements, and suggestion → hackathon linkage.

-- A structured result next to the free-text outcome, so wins can be counted. "Win" in analytics
-- means an approved achievement whose result is winner or runner_up.
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS result TEXT
  CHECK (result IN ('winner', 'runner_up', 'finalist', 'special_mention', 'participant'));
-- A team achievement is logged once (by any member) and credits every active member of the team.
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS achievements_team_idx ON achievements (team_id);

-- The hackathon a faculty member created by approving a student's suggestion.
ALTER TABLE hackathon_suggestions ADD COLUMN IF NOT EXISTS hackathon_id UUID REFERENCES hackathons(id) ON DELETE SET NULL;

-- The competition sheet has no team-size column, so imported rows got the table default of
-- exactly one member, which made every team registration for a real competition fail. Imported
-- competitions accept solo entries and teams of up to four.
UPDATE hackathons SET max_team_size = 4 WHERE source = 'csv_import' AND max_team_size = 1;
