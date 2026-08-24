# design/catalog-experience Delta Specification

## ADDED Requirements

### Requirement: A Learner Finds A Scenario In Three Interactions

The catalog SHALL expose search, goal paths, and filters for domain, environment, duration,
difficulty, fidelity, maturity, and competency. From the unfiltered catalog, starting a known
scenario or a scenario matching one stated learning need SHALL require no more than three
activation actions.

#### Scenario: Search uses learner language

- **WHEN** a learner searches by an abbreviation, presenting sign, task, competency, environment,
  or official scenario title
- **THEN** matching playable scenarios are returned without requiring the hidden diagnosis

#### Scenario: Filters are shareable but private

- **WHEN** catalog filters are selected
- **THEN** they are represented in the URL using only public filter values and contain no learner
  history, progress, identifier, or transcript data

#### Scenario: Findability is tested with people

- **WHEN** the release usability procedure is run with 20 representative learners
- **THEN** at least 18 locate one named case and one case matching a stated learning need within 30
  seconds, and the anonymized aggregate procedure/result is checked into the release record

### Requirement: Every Card Communicates Scope Before Commitment

Each playable catalog card SHALL display title, domain, environment, estimated duration,
difficulty, fidelity class, maturity, primary practice goal, and no more than three competency tags.

#### Scenario: Maturity is visible without opening details

- **WHEN** preview, source-checked, reviewed, endorsed, and withdrawn-related replacement content
  appear in results
- **THEN** each status is communicated by text and icon, not color alone, before a learner starts

#### Scenario: Discovery is not spoiled

- **WHEN** diagnosis recognition is an objective
- **THEN** the card uses presentation-based wording and hides the diagnosis from title, summary,
  search snippet, image alternative text, and URL until the scenario's reveal condition

#### Scenario: Planned work is not playable inventory

- **WHEN** planned modules or scenarios are shown
- **THEN** they are visually and semantically separated from playable results, promise no date, and
  are excluded from every available/complete count

### Requirement: Environment Shells Share One Interaction Grammar

Operating-room, emergency-department, ICU, ward, delivery-room, neonatal, clinic, and prehospital
surfaces SHALL compose the same patient, clock, workspace, action, tutor, log, help, source,
reporting, pause, and end-session regions.

#### Scenario: Moving domains does not require relearning navigation

- **WHEN** a learner moves between any two environments
- **THEN** Help, Sources and limitations, Report a problem, Tutor, Pause, and End session occupy the
  same semantic landmarks and keyboard order

#### Scenario: Environment-specific controls remain authentic

- **WHEN** an environment does not possess an instrument, medication, procedure, or result channel
- **THEN** the control is absent or explicitly unavailable and is never displayed merely to preserve
  visual symmetry

### Requirement: The Live Frame Preserves Patient-Critical Information

At widths from 320 CSS pixels upward, the current critical patient state, clock, alarm meaning, and
one path to applicable actions SHALL remain usable without horizontal page scrolling.

#### Scenario: Phone actions use one bounded sheet

- **WHEN** the live frame is 320 CSS pixels wide
- **THEN** actions open in a single bottom sheet, no second modal or sheet can open over it, the
  current critical state remains perceivable, and every target meets a 44 by 44 CSS pixel minimum

#### Scenario: Tutor does not obscure deterioration

- **WHEN** a tutor message arrives during a critical change
- **THEN** it does not cover the monitor, alarm summary, or active action confirmation; it is queued
  or placed in its own dismissible region

### Requirement: Depth Appears On Demand

The first catalog and briefing surfaces SHALL prioritize goal, patient, objectives, duration,
prerequisites, maturity, and start action. Detailed model, rubric, counterfactual, source,
limitation, and review records SHALL remain reachable within one additional disclosure from the
surface where they apply.

#### Scenario: Richness does not become panel overload

- **WHEN** a scenario is first opened on a 390 by 844 CSS pixel viewport
- **THEN** no more than one primary action, one secondary demonstration action, and the essential
  briefing information appear before the first disclosure control

#### Scenario: Provenance stays close to a claim

- **WHEN** a learner encounters a clinical explanation, tutor directive, objective outcome, or
  model-driven value
- **THEN** its source, maturity, and relevant limitation are reachable without leaving or resetting
  the scenario

### Requirement: Visual Energy Comes From Physiology And Motion With Meaning

The catalog and tutor SHALL use the neutral design ramp. Saturated color SHALL remain reserved for
physiology, alarm priority, and the focus accent. Animation SHALL represent simulated time, state
transition, spatial continuity, or user action feedback and SHALL honor reduced motion.

#### Scenario: Domain decoration does not compete with alarms

- **WHEN** all module cards and the live monitor are viewed together
- **THEN** domain identity is conveyed by text, neutral iconography, and grouping; no domain color is
  confusable with trace or alarm tokens

#### Scenario: Reduced motion remains equally informative

- **WHEN** reduced motion is active
- **THEN** sweeping, interpolation, and celebratory motion is replaced by static or stepped state
  representations carrying the same labels, values, and announcements
