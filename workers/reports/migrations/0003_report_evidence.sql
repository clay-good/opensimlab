ALTER TABLE scenario_reports ADD COLUMN capability_version TEXT;
ALTER TABLE scenario_reports ADD COLUMN release_ref TEXT;
ALTER TABLE scenario_reports ADD COLUMN defaults_hash TEXT;
ALTER TABLE scenario_reports ADD COLUMN maturity_hash TEXT;
ALTER TABLE scenario_reports ADD COLUMN source_manifest_hash TEXT;
ALTER TABLE scenario_reports ADD COLUMN limitation_manifest_hash TEXT;

CREATE INDEX scenario_reports_release_status
  ON scenario_reports (scenario_id, content_version, release_ref, status);
