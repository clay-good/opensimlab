# platform/accessibility Delta Specification

## ADDED Requirements

### Requirement: Every Teaching Cue Has Equivalent Uncertainty Across Modalities

Any clue conveyed through waveform shape, color, motion, sound, pitch, spatial relationship, trend,
or visual artifact SHALL have at least one keyboard and screen-reader-accessible representation that
conveys the same observation without naming a diagnosis or interpretation earlier than the visual
surface does.

#### Scenario: Alternative text does not become an answer key

- **WHEN** a waveform or device trace is intentionally abnormal
- **THEN** its accessible summary describes observable morphology, signal quality, value, and change
  using the scenario's reveal rules and does not announce the hidden cause

#### Scenario: Sound is optional but equivalent

- **WHEN** a clinical change is perceptible through pitch or alarm sound
- **THEN** the same timing and priority are available through text/value/state and vibration is never
  required

### Requirement: Time Pressure Remains Adjustable Without Changing Objectives

Learners SHALL be able to pause non-assessment practice, extend real-time control time, and inspect
the interface without advancing simulated time. Unassisted assessment links MAY disable pause only
when declared before start and SHALL provide an untimed equivalent practice mode.

#### Scenario: Motor or reading speed does not alter the patient

- **WHEN** an accessibility timing accommodation is active
- **THEN** canonical simulated tick, event order, objective windows in simulated time, and patient
  response remain identical while real-world interaction time expands

### Requirement: Complex Controls Have A Nonvisual State Model

Ventilators, pumps, defibrillators, monitors, airway/equipment states, fetal traces, and trend panels
SHALL expose programmatic names, current values, units, status, relationships, pending changes,
confirmation state, and errors without requiring canvas inspection or pointer geometry.

#### Scenario: Device failure is discoverable nonvisually

- **WHEN** a scenario introduces sampling obstruction, transducer artifact, circuit failure, tube
  migration, tracheostomy obstruction, or pump delivery delay
- **THEN** screen-reader users receive the same observable device/signal evidence and must perform the
  same assessment actions rather than receiving the cause automatically
