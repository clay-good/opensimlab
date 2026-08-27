# Quality evidence receipts

Checked-in receipts prevent catalog generation and release checks from reusing supplied evidence
after its declared local dependencies change, even when the scenario version stays the same.
They establish consistency with a recorded snapshot, not clinical approval or proof a test ran.

## What is bound

`scripts/quality-dependencies.json` contains one receipt per module/scenario/content-version group.
Each `sha256-files-v1` receipt pins:

- The complete supplied record envelopes, including kinds, identities, and evidence bodies.
  `qualityRecordsSha256` sorts object keys and envelope serializations; payload array order matters.
- Raw SHA-256 file bytes at explicit repository-relative paths, including every local file
  reference in those bodies and the checker's required shared boundaries.
- For the initial hypocalcemia snapshot, 31 files covering its model, scenario, tutor, defaults,
  tests, evidence brief, engine, source registry, limitations, governance, and shared policies.

Both consumers validate identities and schemas first, then check receipts before writing catalogs
or evaluating publication. Missing, changed, duplicate, malformed, or uncovered dependencies fail
in development and both release channels. Paths must resolve to regular files without symlink
ancestors. No URL is fetched. Unrelated files outside the receipt do not affect it; even a comment
change inside a pinned shared file does. This conservative whole-file policy is intentional.
Write file references as POSIX `src/...`, `tests/...`, or `docs/...` paths with an extension;
an optional `./` and a `#` locator are supported. URLs are not local references. Other files may
be pinned explicitly; prose and directory-only references are not a dependency graph.

## Updating evidence

1. Read the named dependency changes and decide which claims and tests need reconsideration.
2. Update the authored records and run their relevant verification. Leave missing clinical or
   accessibility evidence missing; do not invent a passing record to unblock the build.
3. After that review, explicitly update the literal payload/file digests. Use
   `qualityRecordsSha256` for the payload and SHA-256 of raw bytes for each file. Add newly cited
   local files and any other known behavioral dependencies. Normal build commands never do this.
4. Run `npm run catalog`, the quality-dependency tests, and `npm run ci`; review the receipt diff
   with the code/evidence diff before committing. A digest alone is not an independent signature.

## Remaining boundaries

This is a prepublication refusal, not a live withdrawal mechanism. A failed build leaves existing
generated or deployed catalogs untouched; public stale-gate reporting and automatic applicable
maturity downgrades remain unfinished. Explicit references plus shared boundaries are not a full
transitive dependency graph. Remote-source changes, review expiry, independent review, and signed
built-pack/replay provenance require their own checks. Do not treat this receipt as their substitute.
