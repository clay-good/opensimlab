# platform/module-contract Delta Specification

## ADDED Requirements

### Requirement: Modules Declare A Versioned Capability Manifest

Each module SHALL declare the exact shared capabilities, environment instruments, observations,
actions, units, tutor features, debrief features, and domain packs it consumes. Specialty modules
SHALL NOT fork or shadow a shared capability to tune one scenario privately.

#### Scenario: A missing capability fails registration

- **WHEN** a module or scenario references an absent/incompatible capability version
- **THEN** registration fails with the module, scenario, requested version, available versions, and
  dependency path rather than degrading to scripted display behavior

#### Scenario: A specialty variation is explicit

- **WHEN** pediatric, neonatal, obstetric, geriatric, or other population behavior differs
- **THEN** it is a sourced shared capability variant with its own envelope and tests, not a local
  multiplier hidden in the module

### Requirement: Every Module Inherits The Educational Product Boundary

Module registration SHALL reject routes or exports whose primary interaction is a standalone
calculator, score, classification, conversion, lookup, reference, checklist answer, documentation
generator, real-patient input, or clinical recommendation.

#### Scenario: A module cannot redefine the product

- **WHEN** a specialty package attempts to expose arbitrary data entry and one-shot work output
- **THEN** registration fails even if the package is medically accurate, offline, or labeled
  educational

#### Scenario: Internal score use remains allowed

- **WHEN** a fictional scenario computes a sourced score/classification from authored patient state
  to teach interpretation over time
- **THEN** it remains inside the scenario capability manifest and has no standalone route or public
  compute export

### Requirement: Module Quality Is Reported Without Aggregate Hiding

Each module SHALL publish playable/planned counts, fidelity mix, maturity mix, review gaps,
capability coverage, source currency, correction count, withdrawn items, average active duration,
and completion-contract failures by scenario ID.

#### Scenario: A large module cannot hide shallow breadth

- **WHEN** a module summary is rendered
- **THEN** total titles are separated from playable complete scenarios and every failed/incomplete
  scenario is listed with its current blocking gate
