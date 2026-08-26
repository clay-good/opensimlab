# learning/multidomain-catalog Delta Specification

## ADDED Requirements

### Requirement: The Public Catalog Targets 256 Complete Scenarios

The release catalog SHALL target exactly 256 playable scenarios distributed across the 16 modules
and counts defined in the change design. Only a scenario satisfying the complete-scenario and
scenario-quality contracts may be included in the playable total. A release SHALL publish a smaller
honest count rather than waive a gate to reach 256.

#### Scenario: The catalog count is mechanically honest

- **WHEN** the catalog gate runs
- **THEN** the completed target contains exactly 256 unique playable scenario IDs and the required
  per-module counts
- **AND** every counted item passes schema, source, objective, action, progression, debrief,
  limitation, fixture, defaults, training-value, hazard, state-space, accessibility, offline,
  replay, and reporting checks

#### Scenario: A placeholder is not a scenario

- **WHEN** a planned card, static vignette, multiple-choice question, prerecorded demonstration,
  cosmetic monitor animation, or scenario with fewer than three meaningful learner actions is
  registered
- **THEN** the gate excludes it from the playable count and names every unsatisfied completion field

#### Scenario: Repeated syndromes teach distinct work

- **WHEN** two scenarios share a syndrome or engine capability
- **THEN** their environment, learner role, prior information, action availability, objective
  evidence, or debrief focus differs materially
- **AND** a distinctness test rejects mere retitling of identical state, actions, and objectives

#### Scenario: Seizure labs own different phases of care

- **WHEN** pediatric status epilepticus is added alongside adult first-line and critical-care
  refractory-status lessons
- **THEN** it begins after 2 supplied documented appropriate first-line doses and teaches immediate
  qualified second-line ownership with concurrent airway, cause, and refractory-boundary review
- **AND** it stops before learner drug selection or delivery, airway procedures, EEG interpretation,
  continuous anesthetic management, durable seizure-control claims, disposition, or outcome

#### Scenario: Quality beats the target date

- **WHEN** fewer than 256 planned scenarios pass every gate at release time
- **THEN** the catalog reports only the passing playable count, identifies remaining titles as
  planned, and does not weaken thresholds, copy existing scenarios, or reclassify static content

### Requirement: Every Scenario Declares A Complete Learning Contract

Every playable scenario SHALL declare stable identity, module, environment, estimated duration,
difficulty, prerequisites, practice regions, fidelity class, content and capability versions,
maturity, a bounded fictional patient, 2–5 observable objectives, a deterministic seed policy,
accepted and refused actions, progression, stop conditions, sources, limitations, tutor behavior,
debrief behavior, regression fixtures, a training-value record, an authored-defaults record, a
hazard analysis, and a complete state-space verification matrix.

#### Scenario: Objectives can be observed

- **WHEN** a scenario is validated
- **THEN** each objective maps to accepted/refused actions, state observations, timing windows, or
  explicitly declared authored evidence
- **AND** no objective claims to assess a thought, physical examination, psychomotor act, teamwork,
  or communication quality that the browser cannot observe

#### Scenario: The patient changes for modeled reasons

- **WHEN** a scenario advances or an accepted action is applied
- **THEN** every displayed patient change is attributable to a shared continuous model, a declared
  sourced state transition, or an explicit bounded scenario event
- **AND** clinical outcomes are never produced by changing display values without changing canonical
  patient state

#### Scenario: Three reference courses remain reproducible

- **WHEN** the expert, common-error, and recovery transcripts are replayed under the declared engine
  and content versions
- **THEN** their accepted/refused actions, objective evidence, terminal state, and trace hashes match
  the checked-in fixtures

### Requirement: Fidelity Is Declared And Never Overstated

Each scenario SHALL be classified as `closed_loop_physiology`, `state_transition`, or
`branching_encounter`, and the interface, debrief, and claims SHALL stay within the declared class.

#### Scenario: A discrete model does not imply continuous precision

- **WHEN** a state-transition scenario advances from one sourced condition to another
- **THEN** the interface names the meaningful state and evidence without drawing unsupported
  continuously varying physiology or presenting interpolation as an individual prediction

#### Scenario: A branching encounter remains a simulation

- **WHEN** a branching encounter is inspected
- **THEN** time, observation selection, action order, omission, and disposition create consequences
- **AND** the encounter is not reducible to a scored multiple-choice answer

### Requirement: Scenarios Compose Shared Capabilities

Cross-domain physiology, observations, actions, units, events, and debrief attribution SHALL be
implemented as versioned shared capabilities. A scenario SHALL NOT copy a capability into its own
script to obtain different behavior.

#### Scenario: A shared treatment behaves consistently

- **WHEN** the same capability version, fictional patient state, region, and accepted action are
  replayed in two scenarios
- **THEN** the canonical physiological transition is identical unless a declared scenario factor
  modifies it

#### Scenario: A capability change identifies its blast radius

- **WHEN** a shared capability version changes
- **THEN** the release gate enumerates every affected scenario, requires intentional fixture updates,
  and records the behavioral change in the release notes

### Requirement: Catalog Breadth Follows Demonstrated Engine Value

A module SHALL include only work where simulated time, responsive state, monitoring, intervention,
reassessment, prioritization, or disposition adds educational value beyond static prose or a quiz.

#### Scenario: A proposed domain has no meaningful simulation

- **WHEN** an author cannot define at least three meaningful actions, two distinct choices or
  timings, observable consequences, and a debrief grounded in the engine or sourced transitions
- **THEN** the proposal remains outside the playable catalog regardless of topic importance

#### Scenario: Unsupported breadth remains visible

- **WHEN** a medically important domain is omitted
- **THEN** the public scope documentation states why browser simulation does not yet add value or
  which shared capability is missing, rather than representing the catalog as comprehensive medicine

#### Scenario: Runtime utility proposals remain outside the product

- **WHEN** a proposed item is primarily a calculator, score, classification, conversion, reference,
  lookup, checklist answer, documentation generator, or patient-specific recommendation
- **THEN** it is rejected without comparing it to an external catalog because it fails Open Sim
  Lab's intrinsic fictional time-evolving rehearsal boundary

#### Scenario: A formula supports rather than becomes the lesson

- **WHEN** a scenario uses a formula, score, or classification
- **THEN** the fictional patient supplies its inputs, later state tests interpretation or
  limitations, the learner still observes/acts/reassesses, and no standalone compute surface exists

### Requirement: Domain Packs Preserve A Small Local-First Application

The catalog SHALL partition scenario assets into versioned static domain packs with integrity
metadata. Opening one module SHALL NOT require downloading every other module.

#### Scenario: One module installs atomically

- **WHEN** a learner elects to make a domain available offline
- **THEN** all required scenarios, tutor rules, citations, examples, and shared compatible
  capabilities are cached as one verified pack before it is marked available

#### Scenario: A failed pack update preserves practice

- **WHEN** any asset in a new pack fails download or integrity verification
- **THEN** the prior complete pack remains active, the partial pack is not selected, and exported
  transcripts remain readable

#### Scenario: Pack compatibility is explicit

- **WHEN** a pack requires a capability version unavailable in the running shell
- **THEN** it is not loaded and the interface offers the compatible shell update without attempting
  a best-effort simulation

### Requirement: Every Scenario Begins With An Evidence Brief

Before implementation, each scenario SHALL have a checked-in evidence brief naming the target
learner, educational objective, environment, practice regions, primary or authoritative sources and
locators, disputed practice, modeled variables, calibration targets, exclusions, unsafe-inference
risks, copyright boundary, and required reviewer domains.

#### Scenario: A number has traceable origin

- **WHEN** a scenario introduces a dose, threshold, timing window, physiologic target, or action
  sequence
- **THEN** the evidence brief identifies the source and exact locator or labels the value as a
  bounded Open Sim Lab teaching convention with its derivation and limitation

#### Scenario: Regional disagreement is not averaged away

- **WHEN** authoritative guidance differs between supported regions
- **THEN** the evidence brief records the disagreement and the scenario selects a visible regional
  variant or omits the disputed action rather than inventing a universal rule

### Requirement: New Scenario Families Have Capability And Review Preconditions

The 8 newest scenario families defined in the design SHALL not begin implementation
until their named shared capability, evidence brief, review domains, and negative-transfer boundary
are declared.

#### Scenario: Equipment failures are not display tricks

- **WHEN** circle-system rebreathing, tube migration, or tracheostomy obstruction is authored
- **THEN** equipment state changes canonical gas flow or ventilation, downstream physiology follows
  shared models, assessment evidence precedes treatment, and physical troubleshooting skill is
  explicitly out of scope

#### Scenario: Rare syndromes preserve diagnostic uncertainty

- **WHEN** aortic syndrome, autonomic dysreflexia, methemoglobinemia, or cytokine-release syndrome is
  authored
- **THEN** the early presentation has at least one plausible alternative, confirmatory evidence is
  not leaked, escalation is bounded to the learner role, and debrief distinguishes recognition from
  definitive diagnosis

#### Scenario: Neonatal deterioration uses neonatal state

- **WHEN** tension pneumothorax during neonatal respiratory support is authored
- **THEN** it composes neonatal transition and respiratory-support capabilities rather than scaling
  an adult profile, and its review domains include neonatology and neonatal resuscitation
