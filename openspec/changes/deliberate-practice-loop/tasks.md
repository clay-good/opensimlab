# Implementation plan: deliberate-practice loop

Spec-only until checked. Every mechanism here is a learner-operated control; none starts on
its own, none changes the engine, and none produces a score.

## 1. Blind draw

- [ ] Add a draw operation to the catalog that selects from a pool (module, path, or all
  installed) using the session seed, with an "unseen only" filter defaulting on.
- [ ] Define the withheld field set and the pre-start field set; render the pre-start briefing
  from the latter only. Record `blindDraw: { pool }` in the transcript.
- [ ] Test over every scenario with a recognition objective that no withheld field reaches the
  DOM, the accessible tree, the document title, or the URL before the reveal condition.
- [ ] Test reproducibility of the draw from the transcript seed and pool.

## 2. Expert overlay

- [ ] Replay the expert fixture through the replay worker under the learner's seed, engine, and
  content version; compare against the fixture's declared tolerance and withhold on mismatch.
- [ ] Render both traces and action marks on the existing debrief axes; list per-objective tick
  differences and order agreement for order-sensitive actions only.
- [ ] Offer every declared equivalent-path transcript as a selectable reference.
- [ ] Architecture test: no sum, mean, score, or distance figure is exported by the overlay
  module; snapshot the line format.
- [ ] Automated run: the overlay renders offline for all 256 scenarios from their fixtures.

## 3. Rapid-cycle rehearsal

- [ ] Extend the scenario schema with `rapidCycle` decision points: objective id, window, directive
  line (≤160 chars) with source locator, cycle cap (3–6). Reject recognition objectives at build.
- [ ] Implement the cycle on top of the existing rehearsal branch; assert the restored state hash
  equals the original tick's hash.
- [ ] Hide the mechanism in Unassisted mode; show the evidence sentence with its citation in the
  rehearsal briefing.
- [ ] Author rapid-cycle decision points for every scenario whose objectives include a timed
  protocol step, starting with cardiac arrest, anaphylaxis, malignant hyperthermia, LAST, and
  status epilepticus across modules; register each directive line with the tutor-rule maturity.
- [ ] Build test: every timed-protocol objective has at least one rapid-cycle decision point.

## 4. Reasoning notes

- [ ] Add the note control to action confirmation and pause; store notes in the transcript
  sidecar keyed by tick; assert the transcript hash is unchanged.
- [ ] Show notes in the debrief analysis phase beside attribution; exclude from summary export;
  include in full export only after preview.
- [ ] Extend the report-context structural exclusion test to notes.

## 5. Spaced return and progress file (curriculum requirements)

- [ ] Compute weakest-then-oldest across all modules from the tutor's local evidence; one
  suggestion; 7-day dismissal; interval schedule 7 → 14 → 28 → 56 days labelled as convention.
- [ ] Define the progress file schema; export with both statements; import with replace/merge and
  recomputation report. Mostly done: the practice-history export is now progress file version 2.
  It carries the not-for-clinical-use, not-clinically-reviewed, and simulated-practice-not-
  clinical-time statements and each attempt's calendar day instead of its timestamp. Version 1
  files still import. `/privacy` offers merge (duplicates skipped) or replace (confirmed), and
  reports what it added and every objective whose latest status moved, from what to what.
  Remaining: the file does not yet carry goal-suggestion dismissals or reasoning notes. The notes
  do not exist yet, and the dismissals live in their own store.
- [ ] Tests: round trip, newer-map recomputation, identifier/device/sub-day timestamp absence,
  zero network requests. Round trip, status-change reporting, duplicate-safe merge, version-1
  compatibility, and the absence of identifiers, device fields, and sub-day timestamps are in
  `tests/unit/practice-history.test.ts` and `tests/ui/practice-history-controls.test.tsx`.
  Recomputation under a newer competency map waits for a map; status today is the latest
  outcome per objective. The no-network claim rests on the existing offline suite.

## 6. Documentation and labels

- [ ] Document each mechanism in the educator pages with what it is for and what it does not
  claim; add the ILCOR 2024 and Chamberland 2015 citations to the sources register.
- [ ] Update the limitations register: notes are not assessed, overlays are not scores, rapid
  cycle evidence is low certainty.
