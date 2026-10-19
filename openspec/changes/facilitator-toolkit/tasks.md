# Implementation plan: facilitator toolkit

## 1. Facilitator guide

- [ ] Define the guide section → scenario field map; write the generator with fixed templates
  only; test that no template string contains a clinical claim.
- [ ] Prerender `/<module>/scenario/<id>/facilitator` with print styles and `noindex`; link from
  the briefing's educator disclosure and the educator pages.
- [ ] Generate PEARLS-phase prompts per objective from attribution; snapshot-test the structure.
- [ ] Catalog gate: report every scenario with an absent guide field.
- [ ] Automated offline run over the catalog.

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
