-- Two statements, in this order. The first exists so the second's truncation is visible: the row
-- query is capped, and without a total a reviewer could not tell a complete batch from one that
-- silently dropped everything past the cap.
SELECT COUNT(*) AS eligible_rows
FROM scenario_reports
WHERE status IN ('open', 'investigating', 'withdrawn_content')
  AND created_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days')
  AND capability_version IS NOT NULL
  AND release_ref IS NOT NULL
  AND defaults_hash IS NOT NULL
  AND maturity_hash IS NOT NULL
  AND source_manifest_hash IS NOT NULL
  AND limitation_manifest_hash IS NOT NULL;

SELECT created_at, module_id, scenario_id, content_version, capability_version,
       release_ref, defaults_hash, maturity, maturity_hash, source_manifest_hash,
       limitation_manifest_hash, fidelity_class, practice_region, canonical_url,
       surface, simulated_tick, category, note, recent_context_json
FROM scenario_reports
WHERE status IN ('open', 'investigating', 'withdrawn_content')
  AND created_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days')
  AND capability_version IS NOT NULL
  AND release_ref IS NOT NULL
  AND defaults_hash IS NOT NULL
  AND maturity_hash IS NOT NULL
  AND source_manifest_hash IS NOT NULL
  AND limitation_manifest_hash IS NOT NULL
ORDER BY created_at, scenario_id
LIMIT 1000;
