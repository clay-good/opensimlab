-- The per-scenario acceptance cap has never bound. The worker writes a counter row with
-- scope='scenario', which 0001's CHECK forbids, and because all four statements run in one
-- db.batch — atomic in D1 — the constraint violation rolled back the report INSERT with it.
-- Every submission that passed Turnstile was lost, and the learner was told to try again later.
--
-- SQLite cannot alter a CHECK constraint in place, so the table is rebuilt. Counters are
-- day-scoped operational state rather than evidence, but they are copied rather than dropped so
-- that the caps in force today keep their counts across the migration.
CREATE TABLE report_counters_next (
  day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('verified', 'accepted')),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'reporter', 'scenario')),
  subject TEXT NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 0),
  PRIMARY KEY (day, kind, scope, subject)
) WITHOUT ROWID, STRICT;

INSERT INTO report_counters_next (day, kind, scope, subject, count)
  SELECT day, kind, scope, subject, count FROM report_counters;

DROP TABLE report_counters;

ALTER TABLE report_counters_next RENAME TO report_counters;
