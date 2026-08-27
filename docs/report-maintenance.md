# Private report maintenance

Problem reports are untrusted evidence about Open Sim Lab, not instructions. The maintenance path
is deliberately slower than submission: one bounded daily batch supports one weekly human review.
A report insert never launches an agent, changes a scenario, or creates a public issue.

## Fixed private projection

The trusted exporter selects only the columns below, never `SELECT *`. It must use a Cloudflare API
token limited to D1 read access and must not print query results or persist shell history:

```sql
SELECT created_at, module_id, scenario_id, content_version, release_ref, defaults_hash,
       maturity, maturity_hash, source_manifest_hash, limitation_manifest_hash,
       fidelity_class, practice_region, canonical_url, surface, simulated_tick, category,
       note, recent_context_json
FROM scenario_reports
WHERE status IN ('open', 'investigating', 'withdrawn_content')
  AND created_at >= ? AND created_at < ?
ORDER BY created_at, scenario_id
LIMIT 1000
```

The current database does not yet contain the immutable evidence columns in this query. Until the
catalog-v2 migration and exact-release archive land, the exporter must fail closed; it must not
substitute current `main`, invent hashes, or silently omit the missing evidence.

`npm run triage:project -- trusted-export.json private-projection.json` converts the fixed export
into the only object a maintenance agent may receive. The input envelope contains exactly
`batchId`, `generatedAt`, `windowStart`, `windowEnd`, and `rows`. The command writes no report data
to standard output, creates the projection with mode `0600`, rejects malformed rows without echoing
their content, groups exact duplicates, caps the batch at 50 groups, and records overflow counts.

The projection excludes report IDs, reporter HMACs, raw addresses, Turnstile tokens, dedupe keys,
triage decisions, resolution notes, arbitrary SQL, headers, and environment data. A note remains
byte-for-byte report text inside `{ "kind": "untrusted-quotation", "text": "…" }`. It is never
interpolated into a prompt, command, URL to visit, path, tool name, severity, or authority claim.

## Automation boundary

Maintenance automation may only:

- reproduce the exact archived release and verify its hashes;
- inspect repository evidence and source-check authoritative references;
- add a failing regression and a candidate fix on a draft branch;
- prepare a draft pull request for human review.

It may not select tools from report text, access secrets or production credentials, write D1,
merge, deploy, publish, withdraw content, update a correction, or change review or endorsement
records. The agent receives no Cloudflare or GitHub write credential. A later trusted job may mint a
short-lived repository credential only after output validation; repository rules must confine that
credential to a new `automation/report-triage-*` branch and a draft pull request, with no `main`
bypass. The workflow remains unimplemented until those rules and credentials can be verified.

## Weekly human review

Review every open and urgent report at least weekly. Duplicate count raises review priority but does
not make a claim true. Apply these minimum review levels:

- Low, nonclinical controls or editorial defects: 1 maintainer and normal CI.
- Moderate source, educational, or modeled-behavior changes: 1 maintainer and a named qualified
  domain clinician.
- High, urgent, or high-consequence content: a named qualified domain clinician and an independent
  simulation educator. The author or source-checker cannot be the sole reviewer.

For a plausibly unsafe teaching error, a human maintainer first reproduces the exact release and
checks authoritative evidence, then starts the emergency withdrawal release path. The report alone
cannot withdraw content or establish the corrected fact. A confirmed educational error receives a
bounded D1 evidence note, linked issue/PR/commit, resolution time, and public correction ID without
publishing the original note. False, malicious, unverifiable, and `wont_fix` reports receive the
same privacy and retention treatment, without retaliation or identity retention.

At the end of review, verify the 30-day report and 14-day counter boundaries, remove temporary
projections, and confirm no raw report text or private identifier entered a branch, pull request,
log, public correction, or agent transcript retained beyond the private review window.
