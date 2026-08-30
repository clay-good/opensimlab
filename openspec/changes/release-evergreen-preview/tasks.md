# Implementation plan: evergreen public release

This change is spec-only. Nothing below is done, and the release gate still reports 254
preview-channel blockers until it is. Updating the specification does not clear a gate.

## 1. Close the non-scenario evidence gap

- [ ] Define `previewEvidenceFor(kind, item)` in `src/platform/governance/publication.ts`,
  covering `scenario`, `explainer`, `drug-card`, `region-profile`, and `debrief-template` per the
  per-kind table in `design.md`.
- [ ] Remove the `{ passed: [] }` fallback in `scripts/check-review-gate.ts` and replace it with a
  named "no evidence rule for kind" blocker, so an undefined contract fails closed and is legible.
- [ ] Add the per-kind evidence records the rules require: assertion-to-source records for the 10
  explainers, reference-value tests for propofol, remifentanil, and rocuronium, and region-variant
  tests for the US and GB profiles.
- [ ] Test that an item whose kind has no rule blocks, and that each kind's rule fails on a
  missing source locator, a missing declared field, and a missing test.

## 2. Promote what has earned it, and only that

- [ ] Advance the 10 explainers, 3 drug cards, and 2 region profiles from `draft` to `preview`
  individually, each with its exact-version evidence record. No bulk flip.
- [ ] Test that setting `preview` without a passing exact-version evidence record fails the gate.

## 3. Finish the 14 incomplete oncology scenarios

- [ ] Author the missing completion contracts and quality records for the 14 oncology scenarios
  the gate names. These stay blocked until then; this is authoring work, not a rule change.

## 4. Drop the staged version label

- [x] Set `package.json` version to an unsuffixed number; generate the release identifier from
  build date and commit. `vite.config.ts` injects `__RELEASE_ID__` as `<date>+<commit>`, which
  `APP_VERSION` reports; a source checkout with no injected value reports `unreleased`.
- [x] Add a lint gate that fails on `alpha`, `beta`, or `rc` used as a product maturity label in
  package metadata, prerendered HTML, manifests, or documentation.
  `scripts/check-maturity-labels.ts`, run by `npm run lint` over the sources and again by
  `npm run build` over `dist/`. It flags semver prereleases and a fixed list of release phrases,
  never a bare `alpha` or `beta`, so beta blockade and capnogram alpha angles survive it.
- [x] Leave every content item's semantic content version untouched. The engine capability
  version is exempt by exact string: it pins what the solver could do when a transcript was
  recorded, and ~250 completion contracts compare it literally.

## 5. Build the release-honesty surfaces

- [x] Add the permanent review-status route reporting exact counts and the full item list for
  every maturity status plus the board state; link it from the front page. `/review-status`,
  rendered by `DocumentRoute` from `reviewStatusReport()`, which derives every item's status from
  the content rather than a written-down list. The front-page link is the honest-status line
  itself, so the claim carries the route to its own evidence.
- [x] Extend the first-load acknowledgement to state that content is not clinically reviewed, and
  link it to the review-status route.
- [x] Add the unreviewed-content statement to every export alongside the existing statement.
  `NOT_CLINICALLY_REVIEWED` sits beside `NOT_FOR_CLINICAL_USE` in the transcript, the event log as
  text and as JSON, the concentration CSV, the reviewer's notes file, and the practice-history
  export. The two say different things — one bounds what the simulator is for, the other discloses
  that nothing is signed — so neither replaces the other.
- [x] Add the release gate check that refuses to publish when any honesty surface is missing.
  `honestySurfaceBlockers()` blocks a missing review-status route, a non-indexable one, and a list
  that has stopped covering the corpus. `exportDisclosureBlockers()` blocks an export that has
  dropped either statement. Two surfaces are held by their tests rather than the gate — the
  concentration CSV and the acknowledgement modal are React modules that import CSS, and this
  script has no loader for it.

## 6. Turn on public correction intake

- [ ] Configure and enable the production report Worker, D1, and Turnstile values; verify the
  accepted, duplicate, invalid, quota, and cleanup paths against the live deployment.
- [ ] Verify the control truthfully reports unavailability on a static-only fork.
- [ ] Publish the 5-working-day acknowledgement commitment and the triage path.

## 7. Publish

- [ ] Re-run `npm run public-ready:history` and `npm audit` immediately before the visibility
  change, per `docs/public-readiness-audit.md`.
- [ ] Make the repository public.
- [ ] `npm run deploy` on the preview channel.

## 8. Still outstanding after this release

- [ ] Recruit at least three credentialed clinician reviewers. Publication does not close this.
- [ ] Independent second-source checks on the pharmacology parameters.
- [ ] Face-validity review and on-device frame-budget measurement.
