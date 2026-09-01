# Implementation plan: evergreen public release

This change is spec-only. Nothing below is done, and the release gate still reports 254
preview-channel blockers until it is. Updating the specification does not clear a gate.

## 1. Close the non-scenario evidence gap

- [x] Define `previewEvidenceFor(kind, item)` in `src/platform/governance/publication.ts`. It
  covers `explanation`, `drug-card`, and `practice-region`, and returns a stated absence for every
  other kind. `scenario` deliberately keeps its own path: its evidence comes from the completion
  and quality audits, which this signature does not carry. No `debrief-template` kind exists in
  the maturity vocabulary, so nothing publishes as one.
- [x] Remove the `{ passed: [] }` fallback in `scripts/check-review-gate.ts` and replace it with a
  named "no evidence rule for kind" blocker, so an undefined contract fails closed and is legible.
  The old fallback failed closed but reported six missed gates, which reads as unfinished authoring
  rather than an undefined contract — two different problems with two different fixes.
- [x] Add the per-kind evidence records the rules require: assertion-to-source records for the 10
  explainers, reference-value tests for propofol, remifentanil, and rocuronium, and region-variant
  tests for the US and GB profiles. The pharmacology reference values are asserted in
  `tests/unit/pharmacology.test.ts` (Marsh, Schnider, Eleveld, Minto) and the rocuronium teaching
  model in `tests/unit/neuromuscular.test.ts`; the region variants in
  `tests/unit/region-and-units.test.ts`. The explainer records were the gap and are now asserted
  in `tests/unit/preview-evidence-contract.test.ts`.
- [x] Test that an item whose kind has no rule blocks, and that each kind's rule fails on a
  missing source locator, a missing declared field, and a missing test. Writing these found a real
  hole: the explanation safety-scope rule only matched a dose stated BEFORE the verb, so
  "Give 2 mg/kg of propofol" — the more natural English — passed. Both orders now.

## 2. Promote what has earned it, and only that

- [x] Advance the 10 explainers, 3 drug cards, and 2 region profiles from `draft` to `preview`
  individually, each with its exact-version evidence record. No bulk flip. All 255 items now
  resolve `preview`; `/review-status` prints the count with the list behind it.
- [x] Test that setting `preview` without a passing exact-version evidence record fails the gate.
  Three halves, because the claim has three ways to be empty: evidence that does not pass blocks;
  a record for a different version, id, or kind does not resolve at all; and `draft` or
  `withdrawn` stay unpublishable however good the evidence is. Marking something `preview` is not
  what makes it publishable.

## 3. Finish the 14 incomplete oncology scenarios

- [ ] Author the missing completion contracts and quality records for the 14 oncology scenarios
  the gate names. These stay blocked until then; this is authoring work, not a rule change.
  Diagnosed. The 11 oncology scenarios each miss four requirements, and they are not one problem:
  - `inclusive-runtime-verification` and `report-control-coverage` are missing for all 240
    scenarios in every module, and their own evidence says why — exact-version assistive
    technology, keyboard, phone, zoom, offline and performance validation, and production
    Turnstile/D1 verification. That is people, hardware and infrastructure, in the same category
    as face-validity review. No code makes them true, and marking them satisfied would be the
    fabrication this project refuses.
  - `observable-objectives` is a single content-design decision, not authoring. 118 scenarios
    across anesthesia, cardiology, neurology and oncology fail it, and every one fails only
    because it declares more objectives than the contract's cap of 5: 107 declare 6, 10 declare 7,
    1 declares 8. Not one scenario anywhere has an objective without a debrief rubric row. So the
    choice is to raise the cap or to merge objectives in 118 scenarios, and it belongs to a
    maintainer rather than to whoever happens to be editing next. The audit now names the cause
    per scenario instead of restating the rule, so the decision can be made from the data.
  - `guidance-and-demonstration` is the genuine authoring gap: oncology had no bound expert
    demonstration, which the renal and endocrine scenarios do have. Done for
    `delayed-immune-event-a-drug-that-stopped-months-ago` and
    `incidental-clot-a-decision-the-evidence-cannot-make` and
    `normal-test-toxicity-the-dose-in-his-bag` and `prognosis-question-a-number-he-asked-for` and
    `laboratory-tls-a-syndrome-he-does-not-have-yet` and
    `rare-early-myocarditis-a-base-rate-is-not-a-threshold` and
    `lowering-the-count-a-number-that-can-be-moved` and
    `inherited-urgency-an-emergency-that-mostly-is-not-one` and
    `trial-rule-a-rule-written-for-a-database` and
    `silent-interaction-a-harm-with-nothing-to-find` and
    `easy-label-a-label-that-fits-too-easily`. All 11 done. Every oncology scenario now carries an
    observed-state tutor and a worked example, leaving only the objectives cap and the two
    people-and-hardware requirements outstanding for the module.
    Renal-electrolyte was already complete on this requirement. Endocrine-metabolic now has it on
    all twelve. `dka-resolution-transition` and `hhs-osmolality-trajectory` were the two
    outstanding, and the reason recorded here had gone stale: both already publish an assessment
    snapshot through `platform/kernel/protocol.ts`, so no engine state was added to a shipped
    scenario. What was missing was everything downstream of it. Each now has an observed-state
    tutor, a worked example driven through the real engine to handoff, tray and cockpit wiring,
    expert, ordering-error, recovery and no-action fixtures, and an exact-version completion
    record. Both are held to their own lesson's restraint. The DKA pair never say whether this
    patient has resolved before the learner's recognition step records it, and they point at the
    ketone and the bicarbonate rather than the glucose that has already moved. The HHS pair refuse
    the reassurance at both places that lesson offers it — the low ketones at presentation and the
    three improved values in the later report — and neither says whether she is getting better.
    Their prompts carry no external link for the same reason the oncology ones do not: these
    scenarios declare full citations, and a URL built from one is a construction rather than a
    lookup. Each of the two now fails only `observable-objectives` and the two
    people-and-hardware requirements.
    The pattern, now used by every scenario in both modules, is an
    observed-state tutor reading the learner's own recorded steps, a snapshot-driven worked
    example, tray and cockpit wiring, and a test that drives the example through the real engine
    to handoff rather than asserting it as a script. Each example also has to be held to its own
    lesson's restraint — the delayed immune event may not supply the diagnosis or the grade, and
    the incidental clot may not choose to anticoagulate or not to, because the recommendation it
    rests on is conditional on very low certainty, and the normal-test lesson has to withhold the
    drug before it documents anything, because the supply is with the patient and the next dose
    falls due inside the lesson. Adding a scenario now touches one guard rather than five.
    The oncology prompts carry no external source link: these scenarios declare their sources as
    full citations without URLs, and a link built from a citation is a guess rather than a
    lookup. The architecture boundary caught one such guess and the other two were withdrawn
    with it.

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
- [x] Verify the control truthfully reports unavailability on a static-only fork. A fork is not
  an outage: it has no Worker at all, and the missing endpoint answers differently per host — a
  404, an SPA fallback serving the application's own HTML with a 200, or a JSON error page. All
  three are now tested to say so and to contact Cloudflare in none of them. The HTML case used to
  fail closed only because the parse error escaped `reportConfig` and the caller happened to catch
  it; it now refuses deliberately.
- [x] Publish the 5-working-day acknowledgement commitment and the triage path. Both were in
  `GOVERNANCE.md` only, which is the same gap the corrections log had: someone deciding whether
  reporting is worth their time decides it in the product. Now typed in `corrections.ts`, rendered
  at `/corrections`, and tested against the number the governance file states.

## 7. Publish

- [ ] Re-run `npm run public-ready:history` and `npm audit` immediately before the visibility
  change, per `docs/public-readiness-audit.md`.
- [ ] Make the repository public.
- [ ] `npm run deploy` on the preview channel.

## 8. Still outstanding after this release

- [ ] Recruit at least three credentialed clinician reviewers. Publication does not close this.
- [ ] Independent second-source checks on the pharmacology parameters.
- [ ] Face-validity review and on-device frame-budget measurement.
