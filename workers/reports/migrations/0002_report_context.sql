ALTER TABLE scenario_reports ADD COLUMN recent_context_json TEXT
  CHECK (recent_context_json IS NULL OR length(recent_context_json) <= 16384);
