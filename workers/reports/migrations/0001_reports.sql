CREATE TABLE scenario_reports (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  content_version TEXT NOT NULL,
  module_id TEXT NOT NULL,
  maturity TEXT NOT NULL,
  practice_region TEXT NOT NULL,
  fidelity_class TEXT NOT NULL,
  surface TEXT NOT NULL CHECK (surface IN ('prebrief', 'live', 'debrief', 'source', 'limitation')),
  simulated_tick INTEGER NOT NULL CHECK (simulated_tick >= 0),
  category TEXT NOT NULL CHECK (category IN ('clinical-content', 'patient-behavior', 'tutor-debrief', 'controls', 'accessibility', 'outdated-source', 'other')),
  note TEXT CHECK (note IS NULL OR length(note) <= 160),
  canonical_url TEXT NOT NULL,
  app_version TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'wont_fix', 'duplicate', 'withdrawn_content')),
  severity TEXT NOT NULL DEFAULT 'untriaged' CHECK (severity IN ('untriaged', 'low', 'moderate', 'high', 'urgent')),
  resolution_note TEXT CHECK (resolution_note IS NULL OR length(resolution_note) <= 1000),
  linked_issue TEXT,
  linked_pr TEXT,
  linked_commit TEXT,
  resolved_at TEXT,
  public_correction_id TEXT
) STRICT;

CREATE INDEX scenario_reports_status_created ON scenario_reports (status, severity, created_at);
CREATE INDEX scenario_reports_scenario_status ON scenario_reports (scenario_id, content_version, status);
CREATE INDEX scenario_reports_created ON scenario_reports (created_at);

CREATE TABLE report_counters (
  day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('verified', 'accepted')),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'reporter')),
  subject TEXT NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 0),
  PRIMARY KEY (day, kind, scope, subject)
) WITHOUT ROWID, STRICT;
