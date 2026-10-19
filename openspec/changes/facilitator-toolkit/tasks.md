# Implementation plan: facilitator toolkit

## 1. Facilitator guide

- [x] Define the guide section → scenario field map; write the generator with fixed templates
  only; test that no template string contains a clinical claim. `src/platform/facilitation/guide.ts`
  renders 13 sections in the design's order; nine fill from fields every scenario has. Four are
  absent everywhere, each with its reason on the page: framework mapping (not yet read from the
  curriculum maps), expected actions and common error and recovery (not yet read from the
  fixtures), and pause points (no such field yet). Timeline entries show ticks as recorded rather
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
- [ ] Automated offline run over the catalog. Open: the guides are noindex and so outside the
  precache, which today takes indexable routes only.

## 2. Pause points

- [ ] Add `pausePoints` to the scenario schema (tick or one-comparison predicate, question ≤ 200
  chars, region); reuse the predicate parser; reject anything else.
- [ ] Implement classroom mode as an instructor setting that forces Unassisted and enables pause
  points; restore guidance level on exit.
- [ ] Fire once, record in transcript, assert state hash unchanged across the pause; replay test.
- [ ] Author at least two pause points per scenario, placed at the authored teaching moments.

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
