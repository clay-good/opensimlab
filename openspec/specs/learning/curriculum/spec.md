# learning/curriculum Specification

## Purpose

Turns a pile of scenarios into a course. Defines the competency map an anesthesia learner works through, the order scenarios unlock in, how the application knows what a learner has and has not met, and how it brings back the thing they got wrong three weeks ago — all without a server or an account.

## Requirements

### Requirement: Explicit Competency Map

The anesthesia module SHALL declare a competency map: a named, versioned set of competencies, each with a plain-language statement of what the learner should be able to do, the scenarios that exercise it, and the observable behaviors that evidence it.

#### Scenario: Every competency is observable

- **WHEN** the competency map is inspected
- **THEN** each competency states at least one behavior the engine can detect from a transcript, and the build fails on a competency with no detectable evidence

#### Scenario: A learner can see the whole map

- **WHEN** the learner opens the curriculum view
- **THEN** every competency is listed with its status — not started, in progress, or evidenced — and selecting one shows which scenarios exercise it

#### Scenario: The map covers the first-rotation core

- **WHEN** the shipped map is enumerated
- **THEN** it covers at minimum: preoperative assessment and risk, induction and airway management, maintenance and depth titration, hemodynamic management, fluid and blood management, neuromuscular blockade and reversal, emergence and extubation, and crisis management

### Requirement: Progressive Unlocking With An Escape Hatch

Scenarios SHALL be ordered into a suggested path where later scenarios assume earlier competencies, and the application SHALL recommend the next scenario. Any scenario SHALL nonetheless be openable directly at any time.

#### Scenario: The next step is always obvious

- **WHEN** a learner finishes a scenario
- **THEN** the debrief ends with one recommended next scenario and a one-sentence reason tied to what just happened

#### Scenario: Nothing is locked away

- **WHEN** a learner wants to practice the crisis scenario before completing the induction path
- **THEN** it opens immediately, with a note that it assumes competencies they have not yet evidenced

### Requirement: Evidence Is Derived From Transcripts, Not Self-Reported

Competency status SHALL be computed by replaying stored local transcripts against the competency map's detectable behaviors. There SHALL be no quiz, no self-assessment checkbox, and no completion button.

#### Scenario: Doing the thing is what counts

- **WHEN** a learner correctly manages a hypotensive episode by identifying hypovolemia and giving volume
- **THEN** the hemodynamic management competency gains evidence citing that scenario, that timestamp, and that action

#### Scenario: Evidence requires repetition, not a single lucky run

- **WHEN** a behavior is observed once
- **THEN** the competency shows in progress; **AND WHEN** it is observed in two further separate sessions at least one day apart, it shows evidenced

#### Scenario: Evidence is recomputable and auditable

- **WHEN** the competency map version changes
- **THEN** status is recomputed from the stored transcripts under the new map, and the learner is told which statuses changed and why

### Requirement: Spaced Return To Weak Areas

The application SHALL track which competencies have the weakest or oldest evidence and SHALL surface a short practice suggestion that targets them, using intervals that expand as evidence strengthens.

#### Scenario: A forgotten skill comes back

- **WHEN** a learner has not exercised neuromuscular reversal in 21 days and their prior evidence was weak
- **THEN** the home screen suggests a scenario targeting it, naming what it will practice and its estimated duration

#### Scenario: Suggestions are dismissible and never nagging

- **WHEN** a learner dismisses a practice suggestion
- **THEN** it does not reappear for at least 7 days, and no more than one suggestion is shown at a time

### Requirement: Curriculum Runs Entirely On-Device

All competency computation, progress, and scheduling SHALL happen locally against locally stored transcripts, with no account and no sync.

#### Scenario: Progress survives a browser restart but never leaves

- **WHEN** the learner returns days later on the same device
- **THEN** progress and suggestions are intact, and network recording confirms no request carried any progress data

#### Scenario: Progress is portable by explicit export

- **WHEN** a learner moves to a new device
- **THEN** they can export a progress file and import it, and the application states plainly that this is the only way progress moves

### Requirement: Instructor Mode Without Surveillance

The application SHALL support an instructor workflow in which a learner exports a session and an instructor imports it for review, with no mechanism for an instructor to observe a learner without that deliberate export.

#### Scenario: A learner controls what an instructor sees

- **WHEN** a learner exports a session for review
- **THEN** they see exactly what the file contains before exporting, and can choose to export the debrief summary alone or the full transcript

#### Scenario: An instructor can review a class without any backend

- **WHEN** an instructor imports twenty submitted session files
- **THEN** the review view aggregates them locally into competency coverage and common failure patterns, entirely in the browser
