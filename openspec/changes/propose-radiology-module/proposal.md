# Propose radiology as a candidate module — the non-interpretive layer

## Summary

Radiology is a strong module candidate, but only for the half of the specialty this engine can
honestly teach. The board interpretation subspecialties — cardiopulmonary, genitourinary,
musculoskeletal, breast, pediatric, nuclear — are image-perception domains. This platform has no
image-display or image-annotation capability, and building perception scenarios on a decision-flow
engine would be a toy that teaches a learner to trust a reading they did not actually make. That is
negative transfer, and it fails the catalog's own rules.

The half that fits is the one the American Board of Radiology tests separately as **non-interpretive
skills** and the American College of Radiology encodes in its practice parameters: acute contrast
reactions, MR safety, critical-result communication, contrast-and-kidney decisions, incidental-finding
ownership, and interventional-radiology peri-procedural safety. These are time-evolving,
consequence-bearing decisions made under a clock — exactly what the engine already models for
anesthesia and emergency medicine. The simulation-education literature is strongest here: for
contrast-reaction crisis management, high-fidelity simulation improves performance where didactics
alone do not, and radiology staff are documented to be underprepared for the rare acute event.

This change adds a candidate module proposal for radiology, scoped to the non-interpretive layer, with
twelve scenario proposals that each pass the scenario training-value rule. It follows the
`learning/catalog-growth` mechanism exactly: radiology enters as a `proposed` document, is shown
nowhere as planned, promises no date, and advances only by passing the module breadth test. It adds no
code, no route, and no planned card.

## Why

- **The strongest radiology teaching on this engine is non-interpretive.** The engine turns time,
  incomplete information, action, consequence, and reassessment into rehearsal. A contrast-reaction
  crisis, an MR projectile hazard, and a critical-result phone call all have that shape. Reading a
  chest radiograph does not — it is perception, and the catalog has no capability for it.
- **Simulation is demonstrably necessary for the fitting content, not optional.** A radiology-resident
  simulation course covering tension pneumothorax, hemorrhage, and contrast reactions raised knowledge
  scores (*Use of a simulation laboratory to train radiology residents in the management of acute
  radiologic emergencies*). Kruse, Scriver, and Walsh (*European Journal of Radiology Open*, 2022) found
  didactics alone produced no significant gain while a four-station high-fidelity program did, bringing
  junior residents to senior post-test scores. An RSNA study (Gaca et al., *Radiology*, 2007;245(1):236–244)
  found that in simulated pediatric contrast anaphylaxis, calling the code team was the first intervention
  in only 5 of 38 runs. The rare acute event is precisely where rehearsal beats reading.
- **Governance already has a path, and radiology was not on the named list.** `learning/catalog-growth`
  requires a new module to be a checked-in proposal passing a breadth test before it is ever shown as
  planned, and names four candidates it currently considers strongest. Radiology is a fifth that the
  rule welcomes but does not yet record. The honest move is a proposal document, not a card.
- **Radiology carries real negative-transfer risk that must be designed against from the first
  scenario.** A learner could carry away a false sense of having practiced image interpretation, or
  treat a sourced criterion (Fleischner, eGFR bands, Bosniak) as a calculator. Both are catalog
  violations already, and the proposal states the mitigations before any scenario is built.

## What changes

- Add a `learning/radiology-module-proposal` capability recording that radiology joins the candidate
  set as a `proposed` module, that its scenarios teach non-interpretive decisions and never image
  perception, that its sourced criteria appear only as evidence inside rehearsal, that its contrast and
  safety values are sourced and region-aware, and that it advances only through the module breadth test.
- State the full candidate proposal in this change's design: learner roles and setting, twelve scenario
  proposals each with actions, choices, consequences, and a debrief, the shared capabilities it composes
  and the two it needs built, a sourced formulary, review domains, a negative-transfer analysis, and
  regional variation — the exact shape `docs/module-proposals/radiology.md` will take.

## Explicit non-goals

- No image-interpretation or image-perception scenarios, and no claim that the engine teaches reading.
- No new route, no landing-page card, no "planned" status, and no date. Radiology stays a proposal.
- No weakening of the scenario completion contract, the training-value rule, the runtime-utility
  boundary, or the per-module counts of the sixteen existing modules.
- No dosing calculator, appropriateness lookup, or criterion compute surface. Every score stays inside a
  fictional encounter.
- No implementation in this change: wiring the proposal document into the validator and the About page,
  writing evidence briefs, and building the shell and scenarios are tasks for later changes.

## Success measures

- `openspec validate propose-radiology-module --strict` passes.
- The candidate proposal states at least eight — here twelve — scenario proposals, each naming its
  actions, two distinct choices or timings, observable consequences, and an engine-grounded debrief, and
  none reading as a calculator, lookup, or checklist answer.
- Every clinical value in the proposal names a published source or is labeled a bounded teaching
  convention, and every scenario states what it excludes.
- Radiology appears nowhere as available or planned, carries no date, and the design states exactly what
  it must satisfy to advance.
