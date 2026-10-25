# Implementation plan: propose radiology as a candidate module

This change is specs-only. The tasks below are what a later implementation change would do; none is
done here, and none is required for this proposal to stand.

## 1. Record the proposal

- [ ] Add `docs/module-proposals/radiology.md` from this change's design, at status `proposed`, with
  the twelve scenario proposals and every required section.
- [ ] Mirror it in `src/platform/modules/proposals.ts` so `tests/unit/module-proposals.test.ts` holds
  the About list in step with the document, and confirm it earns only `proposed`.
- [ ] Render radiology under "Proposed, not planned" on the About page, with no date and no landing card.

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
