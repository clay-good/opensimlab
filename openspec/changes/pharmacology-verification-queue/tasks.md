# Implementation plan: pharmacology verification queue

## 1. Records

- [x] Extend the transcription record type with checker fields and discrepancy; make the
  "verified" marker in the model detail panel read it. The four free-standing fields
  (`secondSource`, `checkedBy`, `checkedOn`, `status`) are gone: a model now carries its
  `checks`, its transcriber, its accepted second-source kinds, and any corrigendum, and
  `isTranscriptionVerified` in `pharmacology/verification.ts` derives the status the confidence
  label shows. The panel's "pending independent check" label and the queue read the same rule.
  Showing a checker's name, source, and date on request waits for the first accepted check.
- [x] Write the acceptance rules (different checker, accepted second-source kind, maintainer
  confirmation, current version); tests for self-check, old version, discrepancy.
  `judgeVerificationRecord` also refuses an unknown parameter and a value that is not the one
  transcribed. A model is verified only when every reference parameter is, so a teaching model,
  which has nothing transcribed, never is. `tests/unit/pharmacology-verification.test.ts`.

## 2. Queue page

- [x] Prerender `/verification-queue` as a trust document: counts first, grouped list behind a
  disclosure, corrigendum notes, accepted second sources per model, the procedure paragraph.
  31 parameters across five models, from each model's published reference individual; Eleveld's
  Q2 carries the corrigendum note. Linked from the validation report and the README.
- [x] Test that the pending count equals the unverified records in source; offline render.
  The page is a prerendered route rendered from bundled source, so it needs no network.

## 3. Submission paths

- [ ] Add the `parameter check` report category with structured fields inside the existing
  bounds, Turnstile, quotas, and preview; document the maintainer confirmation step in the
  report-maintenance runbook.
- [x] Document the pull-request path and the record format in the contribution guide.

## 4. Citation and archive (adoption requirement)

- [ ] Add `CITATION.cff`; validate it in CI.
- [ ] Archive releases with a persistent identifier and a project concept identifier; record the
  identifier in the release record; fail the release gate without it.
- [ ] Render the suggested citation in the about panel from build-time release identity.

## 5. Outreach

- [ ] Add the queue to the front door's single reviewer invitation page target and to the
  outreach note, so the one ask the project makes can be answered in an afternoon.
