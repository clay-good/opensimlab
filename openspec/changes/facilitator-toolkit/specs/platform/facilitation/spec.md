# platform/facilitation Delta Specification

## ADDED Requirements

### Requirement: A Facilitator Guide Is Generated For Every Scenario

The application SHALL render, for every playable scenario, a facilitator guide generated entirely
from the scenario's declared data and the engine's attribution, containing in order: at-a-glance
metadata with the maturity label and content note, learning objectives, framework mappings, the
patient, prebrief content covering the fiction contract, orientation, and what is not modeled,
the authored timeline, expected actions per objective with windows and region variants, the
common-error and recovery paths, PEARLS-phase debrief prompts, pause points and bookmarks,
limitations, sources with locators, and provenance. The guide SHALL be prerendered, printable,
reachable offline, and marked `noindex`.

#### Scenario: The guide contains no hand-written text

- **WHEN** the guide generator is inspected
- **THEN** every sentence it emits is drawn from a scenario field, a source-register entry, an
  engine attribution, or a fixed template with no free prose, and a test fails the build on a
  template string containing a clinical claim

#### Scenario: A missing field is shown as missing

- **WHEN** a scenario lacks a field a guide section needs
- **THEN** the section renders as absent with its name, and the catalog gate reports the scenario
  and the field, rather than the guide reading as complete

#### Scenario: Debrief prompts follow the objectives

- **WHEN** the analysis-phase prompts are generated
- **THEN** there is one prompt per objective naming the observable behaviour it evidences and the
  physiological or sourced consequence the engine attributes to it, and the prompts are ordered by
  the PEARLS phases: reactions, description, analysis, summary and application

#### Scenario: The guide says what it is

- **WHEN** the guide renders or prints
- **THEN** every page carries the not-for-clinical-use statement, the maturity label, the content
  version, and the statement that the material has not been clinically reviewed where that is its
  status

#### Scenario: The guide renders offline for the whole catalog

- **WHEN** the application is installed and offline
- **THEN** the guide for every scenario in an installed pack renders from the bundle, verified by an
  automated run over the catalog

### Requirement: Discussion Pause Points Stop The Clock For The Room

A scenario MAY declare pause points, each a tick or a one-comparison state predicate, a question
of at most 200 characters, and an interface region. When classroom mode is on, reaching a pause
point SHALL pause the clock once, show the question without covering the monitor, highlight the
region, and resume on one action. Pause points SHALL change no patient state, SHALL be
edge-triggered and consumed, SHALL be recorded in the transcript, and SHALL be inert when
classroom mode is off.

#### Scenario: The room is asked, the patient is not touched

- **WHEN** a pause point fires
- **THEN** the tick counter stops, the state hash before and after the pause is identical, the
  question is shown in a region that leaves the monitor and alarm rail visible, and resume
  continues from the same tick

#### Scenario: A pause point fires exactly once

- **WHEN** a predicate pause point's condition holds continuously for several minutes
- **THEN** it fires on the transition into that state and never again in that session, and a
  replay of the transcript reproduces the pause at the same tick

#### Scenario: The grammar cannot execute anything

- **WHEN** a pause-point predicate is read
- **THEN** it is parsed by the same one-comparison grammar as timeline events, and anything else is
  refused with a message naming what to write instead

#### Scenario: Classroom mode and tutor guidance are exclusive

- **WHEN** classroom mode is turned on
- **THEN** the guidance level is set to Unassisted and tutor interventions are absent, and turning
  classroom mode off restores the previous guidance level

### Requirement: Bookmarks And Scrubbing Reach A Teaching Point Without Replaying In Real Time

Every playable scenario SHALL declare at least one bookmark naming a label, a tick, and the
reference transcript it lies on. Jumping to a bookmark SHALL replay that transcript through the
engine to that tick on-device and hand control to the instructor at that exact state. A completed
transcript SHALL be scrubbable to any tick, moving the monitor review, concentration panel, and
log cursors together.

#### Scenario: A bookmark is a replay, not a snapshot

- **WHEN** an instructor jumps to a bookmark
- **THEN** the state at arrival equals the reference transcript's state hash at that tick, replay
  completes within 2 seconds on the reference device, and the session continues live from there

#### Scenario: A bookmark the transcript never reaches fails the build

- **WHEN** a bookmark's tick lies beyond the end of its reference transcript
- **THEN** the catalog gate fails naming the scenario and the bookmark

#### Scenario: Scrubbing moves every panel together

- **WHEN** the instructor drags the scrubber over a completed transcript
- **THEN** the waveform review, the concentration panel, and the event log all show the selected
  tick, the selection is announced to assistive technology, and the scrubber is operable by
  keyboard with arrow keys moving one simulated second

### Requirement: A Mannequin Run Sheet Can Be Exported From Any Scenario

The application SHALL export any playable scenario as a modality-neutral run sheet listing each
authored state or timeline event, the transition triggers between them, the expected learner
actions with windows, the cues a facilitator provides, and the monitor values at each state under
the expert transcript, in plain text and in JSON with identical fields. The sheet SHALL carry the
scenario's licence, the not-for-clinical-use statement, the maturity label, the content version,
and the sources, and SHALL state that every value is a model output under the reference path and
not a prediction for any patient.

#### Scenario: Every declared state appears

- **WHEN** a run sheet is exported for a state-transition scenario
- **THEN** every declared state and every transition with its trigger appears in order, verified by
  a test over every state-transition scenario in the catalog

#### Scenario: Closed-loop vitals are sampled at the events

- **WHEN** a run sheet is exported for a closed-loop scenario
- **THEN** each timeline event lists the vital signs the engine produces at that tick under the
  expert transcript, each marked as a model output, and no interpolated value between events is
  presented as a state

#### Scenario: The sheet leaves with its labels

- **WHEN** the plain-text and JSON sheets are inspected
- **THEN** both carry the licence, the not-for-clinical-use statement, the maturity label, the
  content version, and the sources, and neither carries a transcript, a learner identifier, or a
  real-world timestamp

#### Scenario: No vendor format is produced

- **WHEN** the export surface is enumerated
- **THEN** it offers plain text and JSON only, and the documentation states that the sheet is for a
  facilitator to adapt and does not claim validation for any mannequin or vendor system
