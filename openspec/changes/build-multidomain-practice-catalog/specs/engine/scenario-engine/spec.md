# engine/scenario-engine Delta Specification

## ADDED Requirements

### Requirement: Scenario Compilation Proves Reachability And Completeness

Before a scenario enters a domain pack, a compiler SHALL resolve its capability versions, defaults,
patient fields, actions, observations, events, tutor rules, objectives, stop conditions, debrief
claims, sources, and limitations into one immutable manifest and SHALL reject unreachable or orphaned
elements.

#### Scenario: Every objective can be reached and missed

- **WHEN** a scenario compiles
- **THEN** each objective has at least one valid transcript that produces evidence and one valid
  transcript that does not, unless it is explicitly an observation-only objective with documented
  rationale

#### Scenario: Every action has a purpose

- **WHEN** an action is declared
- **THEN** at least one reachable state accepts or meaningfully refuses it, its consequence/refusal is
  logged, and at least one scenario objective, recovery path, distractor rationale, or environment-
  authenticity record justifies its presence

#### Scenario: Dead events fail before play

- **WHEN** a scripted/conditional event has an impossible predicate, missing capability, unreachable
  prerequisite, or no observable/state consequence
- **THEN** compilation fails with the element ID, dependency chain, and violated rule

### Requirement: Scenario State Is Immutable Outside Declared Transitions

All patient, equipment, environment, tutor, and objective changes SHALL occur through typed,
exhaustive, deterministic transitions recorded in the transcript. Rendering, catalog, help,
reporting, and debrief surfaces SHALL not mutate canonical simulation state.

#### Scenario: Opening teaching surfaces cannot rescue or harm the patient

- **WHEN** a learner opens/closes Help, Sources, Why, Tutor, Report a problem, or a catalog drawer
- **THEN** canonical patient/equipment state and simulated time remain unchanged except for an
  explicitly logged local pause requested by the surface

#### Scenario: Rejected transitions are inert

- **WHEN** an action fails type, range, precondition, region, equipment, route, duplicate, or scenario
  scope validation
- **THEN** patient/equipment state is byte-identical, the refusal is deterministic, and the log uses
  a stable reason code plus learner-facing explanation

### Requirement: Synthetic Patient Generation Is Bounded And Reproducible

Patient variation SHALL be generated only from authored finite distributions or ranges in the
scenario, keyed by the public seed. It SHALL not sample production users, external data, locale,
time, device properties, or unbounded combinations.

#### Scenario: The same seed is the same patient everywhere

- **WHEN** the same scenario/content/capability versions and seed run on supported browsers and
  devices
- **THEN** all synthetic patient attributes, event times, random draws, and trace hashes match

#### Scenario: Extreme seeds remain teachable

- **WHEN** minimum, maximum, and every discrete boundary seed class is evaluated
- **THEN** required evidence remains obtainable before objective deadlines, model envelopes remain
  valid, and the difficulty does not cross its declared band

### Requirement: Scenario Time Has A Declared Educational Bound

Every scenario SHALL declare briefing estimate, expected active interval, maximum simulated time,
pause behavior, acceleration-safe periods, and terminal conditions. No scenario SHALL continue
indefinitely because an event or objective was missed.

#### Scenario: Maximum time ends coherently

- **WHEN** the maximum simulated time is reached without another terminal condition
- **THEN** the scenario ends with a declared handoff, stabilization, deterioration, or scope boundary
  and the debrief distinguishes timeout from a clinical outcome

#### Scenario: Speed does not skip evidence

- **WHEN** the learner uses an allowed acceleration multiplier
- **THEN** events, tutor thresholds, objective windows, alarms, and state transitions process every
  crossed tick deterministically and no required observation is visible for less than its declared
  minimum real-time access interval

## MODIFIED Requirements

### Requirement: Declarative Scenario Format Includes Quality Records

A scenario SHALL be a declarative document validated against a published schema and SHALL include or
resolve stable metadata, fictional patient, environment/equipment, capability bindings, observations,
actions/formulary, events, objectives, tutor rules, stop conditions, debrief rubric, defaults record,
training-value record, hazard analysis, verification matrix, source record, maturity, and limitations.

#### Scenario: An educator can author without executable code

- **WHEN** an educator writes a scenario using the published schema and browser validator
- **THEN** it compiles and runs without application-source changes and cannot embed functions,
  expressions, network locations, HTML, scripts, or arbitrary executable strings

#### Scenario: Missing quality evidence is a schema error

- **WHEN** a scenario omits a quality record or references an unknown record/version
- **THEN** compilation fails before the scenario can appear as playable and names the missing JSON
  pointer and expected record
