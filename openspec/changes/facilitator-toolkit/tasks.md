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

- [ ] Write the run-sheet exporter for both fidelity families; sample closed-loop vitals at event
  ticks under the expert transcript.
- [ ] Emit plain text and JSON with identical fields; carry licence, statements, maturity, version,
  sources; exclude transcript, identifiers, timestamps.
- [ ] Test over the catalog: every state and transition present; labels present; no vendor format.

## 5. Documentation

- [ ] Add a "Running this in a room" page to the educator documentation describing classroom
  mode, pause points, bookmarks, the guide, and the run sheet, with the INACSL standards each
  element supports and which standards still need a human facilitator.
