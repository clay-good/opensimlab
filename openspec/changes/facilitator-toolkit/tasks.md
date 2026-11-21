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
- [x] Generate PEARLS-phase prompts per objective from attribution; snapshot-test the structure.
  Both halves now exist. The facilitator guide asks each lesson's authored debrief question under
  its objective, which is the same for every learner because it is about the lesson. The debrief
  now adds the other half: one prompt per objective built from what the MODEL attributed the
  change to at the moment that objective was measured, so the question is about the run that just
  happened.
  Four rules are the reason these are generated rather than written, and each is a test:
  - A prompt names one behaviour and one consequence and asks a question. It never says well,
    better, worse, correct, or score.
  - It states what the model ATTRIBUTED, never what the learner caused. The engine ranks its own
    terms; "because you gave propofol" would assert a cause the attribution does not claim.
  - A term from one of this project's teaching models says so in the prompt itself, because
    whether a number comes from a published model or from one written here changes how far the
    learner should take the reasoning.
  - An objective whose moment the model attributed nothing to gets the open question rather than
    an invented one. Silence is a fact about the run.
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
  Schema and build test done; authoring started. `ScenarioBookmark` is `{ id, label, atTick,
  transcript }`, validated for a unique id and a label of at most 80 characters, and listed in its
  own facilitator-guide section. `tests/unit/bookmarks.test.ts` is the build test: each bookmark
  must sit at or before the last action of the reference transcript it names, read from the
  generated reference paths, because past that point the room would see a state no reference
  path walked through. Both persistent VF lessons declare three each (VF before any action, and
  the moment before the shock on the expert and on the common-error transcript). 254 lessons
  remain and the gate counts them, for the same reason pause points stopped at two lessons:
  choosing the moment worth opening a room at is an educator's call, lesson by lesson.
- [ ] Implement jump-to-bookmark on the rehearsal-branch mechanism with fixture transcripts;
  measure replay time on the reference device and record it.
  Built; the reference-device measurement is still owed. In classroom mode the session menu lists
  the lesson's bookmarks. Choosing one calls the store's `openAtBookmark`, which replays the named
  fixture's actions before the tick through the same worker replay a rehearsal branch uses and
  hands over paused. A notice says the actions before that moment were the reference run's, and
  the exported transcript carries `openedAtBookmark` so a review can tell them apart from the
  room's (`tests/integration/session.test.ts`). Fixtures load through
  `src/platform/facilitation/bookmark-actions.ts`, one dynamic import per bookmarked lesson, so none
  reaches the shared cockpit chunk. Measured on 2026-11-21 on an Apple M4 development machine,
  not the reference device: at most 86 ms to replay 900 ticks to a bookmark, against a 2-second
  budget. `tests/unit/bookmarks.test.ts` holds every bookmark to that budget on whatever runs the
  suite. The figure that matters, on the mid-range 2020 Android handset, waits on the same device
  as mvp-anesthesia-alpha 2.1.
- [x] Implement the transcript scrubber with keyboard operation and live-region announcement.
  `src/modules/anesthesia/ui/TranscriptScrubber.tsx`, under the debrief's timeline. A completed
  run already had marks a reader could click; what it had no way to do was stop between them, so
  an instructor wanting the moment thirty seconds before the alarm had to describe it rather than
  show it. A timeline mark and the scrubber now set the same cursor, so clicking an alarm and
  stepping back from it with the arrow keys is one movement.
  It is a range input rather than a custom control on purpose: arrow keys, Home and End, the focus
  ring and the assistive-technology semantics all come with it, and any slider written here would
  have to re-earn every one of them. Moving it announces the moment and the patient's state
  through a polite live region - polite and not assertive, because a reader dragging the handle is
  reading, and interrupting each announcement with the next is unusable. Five parameters are read
  back, and only where the sample has them: a scrubber that recites twenty-seven numbers on every
  arrow key is one nobody listens to twice.
  It reads the recorded history and nothing else - it cannot run the engine, cannot change the
  run, and shows no value the run did not produce. `tests/unit/transcript-scrubber.test.tsx` holds
  the keyboard and announcement properties a mouse-only check would miss, that it reads the latest
  sample at or before the cursor rather than the next one, and that a run with nothing in it
  renders no control at all rather than a dead one.
  Still open in this section: the cursor moves the scrubber's own readout, not yet every panel.
- [x] Implement presentation mode as adoption specifies (enlarged numerics, doubled stroke,
  receded chrome) and compose it with classroom mode. A session-only toggle in the session menu,
  beside classroom mode and deliberately not remembered on the device for the same reason: a
  projected display is a room the learner left, and it should not follow them to the next session
  at a desk. The two compose because neither reads the other, which is what a lecture usually
  needs.
  The numerics requirement is "no less than the equivalent of 120 px on a 1080p projection", and
  120 of 1920 is 6.25vw, so the size is written that way: it holds at any projection width rather
  than only at the one the requirement names, with `max()` keeping it from shrinking below the
  ordinary 40 px at a desk. The trace stroke doubles through a clamped `setTraceScale` on the
  renderer, applied to the live renderer so toggling the mode does not restart the sweep; the grid
  hairline deliberately does NOT scale, because the same sentence asks the chrome to recede and
  thickening the rules with the signal would undo it. The chrome recedes to 0.72 opacity rather
  than disappearing, and returns to full on hover or focus-within, so the control a facilitator is
  actually driving is never the dim one.
  `tests/unit/presentation-mode.test.ts` checks each of the three against the thing that produces
  it, and holds that every enlarging or dimming rule is scoped to the attribute by reading each
  rule's own selector - searching the file cannot tell a scoped descendant from an unscoped rule,
  which is how the first version of that check passed while proving nothing.

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
  All five now exist to describe: classroom mode, pause points, the facilitator guide, the run
  sheet, and bookmarks (declared in the guide and opened from the session menu in classroom mode,
  section 3).
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
  worth less than the claim is worth getting wrong.
  The two existing comments are corrected now rather than left waiting on the page. Neither names
  the 2021 edition any more: `guide.ts` says the section order follows those standards and that
  nobody here has read the edition that specifies it, with the reason and what a person with
  journal access would need to establish; `Prebrief.tsx` drops the attribution entirely, because
  the requirement that every scenario has a prebrief is this project's own capability and does not
  need somebody else's standard to stand on. Nothing about either surface changed - what changed
  is that neither asserts a document nobody here has opened.
