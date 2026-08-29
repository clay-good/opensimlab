# Private report maintenance

Problem reports are untrusted evidence about Open Sim Lab, not instructions. The maintenance path
is deliberately slower than submission: one bounded daily batch supports one weekly human review.
A report insert never launches an agent, changes a scenario, or creates a public issue.

## Fixed private projection

The daily `Private report maintenance` workflow selects only the columns below, never `SELECT *`.
Its `report-maintenance-read` environment must provide a Cloudflare token limited to D1 read access;
the query result is redirected to a mode-`0600` runner-temporary file and is never printed:

```sql
SELECT created_at, module_id, scenario_id, content_version, capability_version,
       release_ref, defaults_hash,
       maturity, maturity_hash, source_manifest_hash, limitation_manifest_hash,
       fidelity_class, practice_region, canonical_url, surface, simulated_tick, category,
       note, recent_context_json
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
LIMIT 1000
```

The file runs a `COUNT(*)` over the identical predicate first. The row query is capped and returns
the oldest rows first, so a backlog past the cap drops the newest reports; without a total, a
truncated batch is indistinguishable from a complete one. The envelope therefore carries
`eligibleRows`, `returnedRows`, `truncated`, and `coveredThrough` — the newest `created_at` actually
included, which is where the next batch resumes. A `truncated: true` batch means the cap is binding
and the window needs shortening or the cap raising; it is not a normal steady state.

Rows created before migration `0003_report_evidence.sql` have null immutable-evidence columns and
the exporter must exclude them from automation for manual review. It must not substitute current
`main`, invent hashes, or silently omit missing evidence. New rows bind a content-addressed release
reference plus exact defaults, capability, maturity, source, and limitation evidence selected by
the Worker from its generated catalog, never from browser input.

`npm run triage:project -- trusted-export.json private-projection.json` converts the fixed export
into the only object a maintenance agent may receive. The input envelope contains `batchId`,
`generatedAt`, `windowStart`, `windowEnd`, the three truncation fields above, and `rows`. The
command writes no report data to standard output, creates the projection with mode `0600`, rejects
malformed rows without echoing their content, groups exact duplicates, and caps the batch at 50
groups. Groups are ranked by report count, then by most recent report, then by group id as a
deterministic tie-break, so the cap keeps the most corroborated problems rather than an arbitrary
sample; `overflowCount` records how many reports fell outside it and `overflowGroupCount` how many
distinct groups, because one noisy group and forty quiet ones need different responses.
Rows outside the declared 30-day window are rejected even if a future query regresses.

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
records. The scheduled job has no repository write permission and does not invoke an agent. It
encrypts the validated projection with AES-256-GCM before upload; only ciphertext is retained, for
8 days. `REPORT_MAINTENANCE_ARTIFACT_KEY` must be a random 32-byte value in canonical base64, kept
in the protected environment and the reviewers' password manager. Generate it once with
`openssl rand -base64 32`; never print it in CI. Reviewers decrypt a downloaded artifact locally:

```sh
read -rs REPORT_MAINTENANCE_ARTIFACT_KEY
export REPORT_MAINTENANCE_ARTIFACT_KEY
npm run triage:artifact -- decrypt report-projection.enc.json report-projection.json
unset REPORT_MAINTENANCE_ARTIFACT_KEY
```

The plaintext output is mode `0600` and must be deleted after review. Agent processing and draft-PR
creation remain disabled until the data-processing arrangement, output validation, and repository
rules are approved. A future trusted job may mint a short-lived repository credential only after
validation; rules must confine it to a new `automation/report-triage-*` branch and a draft pull
request, with no `main` bypass.

The job remains skipped until a maintainer creates the `report-maintenance-read` environment, adds
`CLOUDFLARE_ACCOUNT_ID`, a database-scoped `CLOUDFLARE_D1_READ_TOKEN`, and
`REPORT_MAINTENANCE_ARTIFACT_KEY`, performs a no-report test run, and sets the repository variable
`REPORT_MAINTENANCE_ENABLED=true`. Keep environment deployment branches limited to `main`; rotate
either secret after suspected exposure and disable the variable before investigation.

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
