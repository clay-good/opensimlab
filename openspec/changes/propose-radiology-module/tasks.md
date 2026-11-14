# Implementation plan: propose radiology as a candidate module

This change is specs-only. The tasks below are what a later implementation change would do; none is
done here, and none is required for this proposal to stand.

## 1. Record the proposal

- [x] Add `docs/module-proposals/radiology.md` from this change's design, at status `proposed`, with
  the twelve scenario proposals and every required section. Lifted from the design rather than
  rewritten, so the proposal and the change that argued for it cannot drift: all seven required
  sections, all twelve scenario proposals, and 12 of 12 pass the training-value rule.
- [x] Mirror it in `src/platform/modules/proposals.ts` so `tests/unit/module-proposals.test.ts` holds
  the About list in step with the document, and confirm it earns only `proposed`.
  One correction to that last clause: the document earns `breadth-test-passed`, not `proposed`.
  Structural completeness is all the validator can judge, and this document is structurally
  complete. It CLAIMS `proposed` anyway, which the validator allows in that direction only, because
  the next status is earned by a person reviewing the twelve against the training-value rule and the
  non-interpretive boundary, and nobody has. `tests/unit/radiology-proposal.test.ts` pins that gap
  deliberately - claimed `proposed`, earned `breadth-test-passed` - so neither half can drift.
- [x] Render radiology under "Proposed, not planned" on the About page, with no date and no landing card.
  The About page renders every proposal whose status is not `planned`, so this needed no change
  beyond the mirror; the existing test already holds that every proposal's title appears there, and
  the new test holds that the document promises no date.
  One guard was added beyond the tasks, because the module's whole claim rests on it: the proposal
  teaches decisions, never perception, and the first way that erodes is a later author adding one
  scenario that asks what the scan shows. The test refuses an interpretive verb against an image in
  any proposal's title, Actions or Choices, and holds that the out-of-scope paragraph still names
  detection, localization and characterization from pixels.

## 2. Earn the breadth test (later)

- [ ] Have the scenario proposals reviewed against the training-value rule and the non-interpretive
  boundary, then advance the document to `breadth-test-passed`.
- [ ] Write the first evidence briefs (acute contrast reaction, MR projectile safety, critical-result
  communication) before any `planned` status.

## 3. Build the capabilities the module needs (later)

- [ ] Specify and build the radiology-suite shell (scanner/procedure-room environment, screening and
  communication surface, event-to-handoff clock) as a versioned capability.
- [ ] Specify and build the result-communication surface (responder model: answers, does not answer,
  acknowledges a read-back) as a versioned capability.

## 4. Author scenarios against the gates (later)

- [ ] Author each scenario with its completion contract, defaults record, training-value record, hazard
  analysis, and state-space verification matrix, composing shared capabilities rather than forking them.
- [ ] Register radiology's review domains with governance coverage at `planned`, and count scenarios
  only as they pass every gate, lifting the playable count above its ratified floor.
