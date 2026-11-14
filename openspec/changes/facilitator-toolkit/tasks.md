# Implementation plan: facilitator toolkit

## 1. Facilitator guide

- [x] Define the guide section → scenario field map; write the generator with fixed templates
  only; test that no template string contains a clinical claim. `src/platform/facilitation/guide.ts`
  renders 13 sections in the design's order; nine fill from fields every scenario has. Framework
  mapping fills for the 39 anesthesia scenarios from `curriculum/mapping.ts`, with the mapping
  disclaimer, and is absent for the 217 scenarios in modules with no mapping yet (the
  framework-mapping-expansion change adds them). Pause points now have a field and two lessons
  declare them, and a content note is its own section (nine lessons carry one). Expected actions
  and common error and recovery now fill for all 256, from the reference transcripts every lesson
  already ships: the expert path under "Expected actions", and the common-error and recovery
  paths under "Common error and recovery" as two labelled runs, each step showing the tick it was
  recorded at. The guide still interprets nothing. It does not say an action was correct or
  compare the error path to the expert one; it shows a facilitator what the checked-in
  transcripts do.
  Getting there meant normalising three shapes, not one. 216 lessons write `[tick, stepId]`, the
  tray control a learner presses. 39 anaesthesia lessons write whole actions,
  `{ tick, type, payload }`, because that module's trays send doses rather than named steps. And
  emergency medicine's tension pneumothorax writes `[tick, { type, payload }]`, keeping the tick
  outside the action because its own helper does. Reading only the first two shapes left that one
  lesson with both sections absent while 255 filled - a gap nothing but a count would have
  noticed, and `tests/unit/facilitator-guide.test.ts` now asserts the count rather than a sample.
  A payload prints as authored scenario data (`doseMg 1, route iv`), which does not breach the
  rule that the only prose this module owns is its fixed templates.
  The aggregation is generated (`npm run reference-paths`), because `import.meta.glob` is not
  available to the prerender step, which runs under tsx rather than Vite, and a hand-written list
  of 256 imports is one more thing to forget when a lesson is added.
  `tests/unit/reference-paths.test.ts` holds the committed file against the real fixtures, so an
  edited transcript cannot leave a guide showing an expert path the lesson no longer takes -
  which is worse than showing none, because a facilitator cannot tell.
  It cost the first visit nothing. The data lands in the facilitator-guide route chunk, and that
  chunk is now in `FIRST_VISIT_PRECACHE_EXCLUSIONS`: the guides are noindex, so their prerendered
  HTML was never in the precache either, and a first visit could not open one offline whether the
  chunk was there or not. First-visit precache went from 1,913.6 KB to 1,912.0 KB across the whole
  change. Timeline entries show ticks as recorded rather
  than clock time, because tick length differs by module timescale.
- [x] Prerender `/<module>/scenario/<id>/facilitator` with print styles and `noindex`; link from
  the briefing's educator disclosure and the educator pages. Served at
  `/facilitator/<module>/scenario/<id>` rather than under the briefing: a guide nested in a
  module's path was counted as one of its lessons by every module's route guards and by the
  briefing precache check, and moving it is simpler than teaching each guard an exception.
  All 256 are prerendered and noindex,
  share their briefing's preview image instead of adding 256 more, and print without the site
  bar. Linked from the live briefing, the prerendered briefing, and a new "Running a scenario
  with a group" section on `/for-educators`.
- [ ] Generate PEARLS-phase prompts per objective from attribution; snapshot-test the structure.
  Partly done: reactions, description, and summary are fixed templates, and analysis asks each
  debrief-rubric question under its objective, tested for every scenario. Prompts generated from
  attribution of the learner's own run remain.
- [x] Catalog gate: report every scenario with an absent guide field. `npm run gate` prints the
  guide count and each absent section's scenario count. It reports and does not block, because
  the page already says the section is absent.
- [ ] Automated offline run over the catalog. Open, and now deliberate on both sides: the guides
  are noindex and so outside the document precache, which takes indexable routes only, and their
  route chunk is a named first-visit exclusion for the same reason. Making the guides work
  offline is a decision to precache an educator surface, not an oversight to fix.

## 2. Pause points

- [x] Add `pausePoints` to the scenario schema (tick or one-comparison predicate, question ≤ 200
  chars, region); reuse the predicate parser; reject anything else. `ScenarioPausePoint` in the
  scenario types, validated structurally and semantically (`tests/unit/pause-points.test.ts`);
  `duePausePoint` in `src/platform/facilitation/pause-points.ts` says which one is due, once each.
  The facilitator guide lists declared points, and the author guide documents the field. No
  scenario declares any yet, and nothing fires them until classroom mode exists.
- [x] Implement classroom mode as an instructor setting that forces Unassisted and enables pause
  points; restore guidance level on exit. A per-session toggle in the session menu, deliberately
  not remembered on the device, so forced Unassisted guidance can never persist by accident.
- [x] Fire once, record in transcript, assert state hash unchanged across the pause; replay test.
  A due pause point fires once, stops the clock, and shows its question beside the monitor with a
  Resume control. The transcript gains an optional `facilitatorPauses` list, present only when a
  pause fired, which is a marker and never an action, so the state trace and its hash are
  untouched and replay ignores it (`tests/unit/classroom-pauses.test.ts`). The named region is
  outlined exactly as a worked-example beat outlines one, through its own attribute so the
  demonstration's layout does not change.
- [ ] Author at least two pause points per scenario, placed at the authored teaching moments.
  Started: both persistent VF lessons (anesthesia and emergency medicine) declare two each, at the
  rhythm event and before the scripted reassessment; each is a question for the room that never
  names the rhythm. 254 scenarios remain, and the gate counts them. Authoring stopped there on
  purpose: a pause is itself a cue, so in a recognition lesson a pause at the onset tells the room
  that something just happened, and most lessons have one authored moment, not two. Placing the
  rest is a judgment for educators, lesson by lesson, rather than something to generate.

## 3. Bookmarks and scrubbing

- [ ] Add `bookmarks` to the scenario schema; author at least one per scenario on the expert
  transcript; build test that the transcript reaches each tick.
- [ ] Implement jump-to-bookmark on the rehearsal-branch mechanism with fixture transcripts;
  measure replay time on the reference device and record it.
- [ ] Implement the transcript scrubber with keyboard operation and live-region announcement.
- [ ] Implement presentation mode as adoption specifies (enlarged numerics, doubled stroke,
  receded chrome) and compose it with classroom mode.

## 4. Run sheet

- [x] Write the run-sheet exporter for both fidelity families; sample closed-loop vitals at event
  ticks under the expert transcript.
  Both families, and the states are the authored timeline either way. The 39 closed-loop
  anaesthesia lessons now carry the numbers their model produced at each of their own timeline
  events, sampled by replaying the checked-in expert transcript under the fixture's seed
  (`scripts/sample-expert-vitals.ts`, run by `npm run reference-paths`). All 116 anaesthesia
  timeline events are tick-scheduled, so the sampling is deterministic and nothing has to guess
  when an event fired. Eight parameters are kept - heart rate, systolic, diastolic and mean
  pressure, saturation, respiratory rate, end-tidal CO2 and temperature - out of the 27 the model
  computes, because a sheet listing all 27 is a sheet nobody reads in a room.
  The sampler lives beside the generator rather than in `src/`: running the engine is a build-time
  job, and nothing shipped to a browser should be able to reach it. The numbers are recomputed in
  `tests/unit/reference-paths.test.ts` by replaying the engine rather than trusted, because a
  committed number nobody re-derives is a number that can drift from the model that produced it.
  Each sheet says which kind of numbers it carries: a closed-loop sheet says they are a model
  output under one reference path and not a prediction about any patient, and a state-transition
  sheet says the lesson runs no model and its observations are in each state's authored text - so
  an absent number is never read as "this lesson has none".
- [x] Emit plain text and JSON with identical fields; carry licence, statements, maturity, version,
  sources; exclude transcript, identifiers, timestamps. `runSheetText` and `runSheetJson` in
  `src/platform/facilitation/run-sheet.ts`, offered from each facilitator guide as two downloads
  built in the browser from the scenario already on the page, so the guide stays a document that
  requests nothing. The sheet is a view of the scenario and the checked-in expert transcript, not
  a second copy, so it cannot drift from the lesson. It carries no transcript of a learner's run,
  no identifier and no timestamp, because it is built from authored content only.
- [x] Test over the catalog: every state and transition present; labels present; no vendor format.
  `tests/unit/run-sheet.test.ts` builds a sheet for all 256 and holds that each has states,
  objectives, expected actions and sources; that both statements, the maturity label, the licence
  and the content version are on every one; that the JSON round-trips to the same fields the text
  prints; and that no vendor's name appears. The learner-claim guard is on the prose this module
  owns rather than on bare words, because a lesson may legitimately say "pain score" and a source
  may legitimately be the I-PASS handoff curriculum - forbidding the words themselves failed on
  both and would have taught the next author to reword a citation.

## 5. Documentation

- [ ] Add a "Running this in a room" page to the educator documentation describing classroom
  mode, pause points, bookmarks, the guide, and the run sheet, with the INACSL standards each
  element supports and which standards still need a human facilitator.
  Four of the five now exist to describe: classroom mode, pause points, the facilitator guide and
  the run sheet. Bookmarks do not (section 3).
  The INACSL half is blocked on sourcing, and the block is worth stating because it also puts a
  question over two lines already in the codebase. `src/platform/facilitation/guide.ts` and
  `ui/Prebrief.tsx` both name "the INACSL Healthcare Simulation Standards of Best Practice
  (2021)", and neither the standards nor that edition are in the sources register. Attempted to
  add them on 2026-11-14 and could not verify to this project's own bar:
  - Clinical Simulation in Nursing, which publishes the standards, returns 403 to an automated
    fetch, and the journal is not indexed in PubMed - `esearch` for the standards by title in
    that journal returns zero - so the NCBI E-utilities route the register uses for every other
    citation does not reach them.
  - A search surfaced 2025 articles in that journal carrying Preamble, Prebriefing, Professional
    Integrity and Debriefing as separate standards, which suggests the 2021 edition those two
    comments name has been superseded. That is the same failure the register already records
    against the COA standards, where the project named a revision two behind the current one.
  So: do not write this page's standards claims until someone with journal access can establish
  the current edition and its composition, and add the register entry at the same time. Naming a
  standard the project has not read is the thing this register exists to prevent, and the page is
  worth less than the claim is worth getting wrong. The two existing comments should be corrected
  or qualified in the same pass.
