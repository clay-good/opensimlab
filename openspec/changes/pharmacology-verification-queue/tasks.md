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
  Deferred deliberately. Every report column is scenario-scoped (`scenario_id`, `surface`,
  `simulated_tick`) and the note is capped at 160 characters, while a check is model-scoped and
  carries a citation, a locator, and a name. It needs its own table, a migration a maintainer
  applies to production D1, and a Worker that is not yet enabled in production (release task 6).
  Until then the pull-request path, documented in `CONTRIBUTING.md`, is the working route and
  the queue page names it.
- [x] Document the pull-request path and the record format in the contribution guide.

## 4. Citation and archive (adoption requirement)

- [x] Add `CITATION.cff`; validate it in CI. `tests/unit/citation.test.ts` holds its required
  fields and keeps its title, author, licence, repository, and site in step with the package and
  the about panel. It is a repository test, not the upstream `cffconvert` validator, which is a
  Python tool this Node-only CI does not install. The file claims no DOI, because none exists.
- [ ] Archive releases with a persistent identifier and a project concept identifier; record the
  identifier in the release record; fail the release gate without it. Needs a maintainer to
  connect an archive (for example Zenodo's GitHub integration) and mint the concept identifier;
  the gate is not added before then, because it would block every deploy on an account nobody has
  opened.
- [x] Render the suggested citation in the about panel from build-time release identity.
  The panel used to say "cite the release version shown in the about panel" and show none. It now
  prints the running build's `<date>+<commit>`, and the prerender step receives the same identity
  through `scripts/register-release-id.ts`, so the hydrated About page and its HTML agree. A
  source checkout says it is an unreleased build rather than inventing a version.

## 5. Outreach

- [x] Add the queue to the front door's single reviewer invitation page target and to the
  outreach note, so the one ask the project makes can be answered in an afternoon. The outreach
  note points pharmacologists to the queue (`docs/outreach/first-contact.md`), and
  `/content-review`, where reviewers land, offers it as the smaller ask that needs no licence.
  The front door's invitation itself stays one sentence, as its test requires.
