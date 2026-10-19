# Implementation plan: pharmacology verification queue

## 1. Records

- [ ] Extend the transcription record type with checker fields and discrepancy; make the
  "verified" marker in the model detail panel read it.
- [ ] Write the acceptance rules (different checker, accepted second-source kind, maintainer
  confirmation, current version); tests for self-check, old version, discrepancy.

## 2. Queue page

- [ ] Prerender `/verification-queue` as a trust document: counts first, grouped list behind a
  disclosure, corrigendum notes, accepted second sources per model, the procedure paragraph.
- [ ] Test that the pending count equals the unverified records in source; offline render.

## 3. Submission paths

- [ ] Add the `parameter check` report category with structured fields inside the existing
  bounds, Turnstile, quotas, and preview; document the maintainer confirmation step in the
  report-maintenance runbook.
- [ ] Document the pull-request path and the record format in the contribution guide.

## 4. Citation and archive (adoption requirement)

- [ ] Add `CITATION.cff`; validate it in CI.
- [ ] Archive releases with a persistent identifier and a project concept identifier; record the
  identifier in the release record; fail the release gate without it.
- [ ] Render the suggested citation in the about panel from build-time release identity.

## 5. Outreach

- [ ] Add the queue to the front door's single reviewer invitation page target and to the
  outreach note, so the one ask the project makes can be answered in an afternoon.
