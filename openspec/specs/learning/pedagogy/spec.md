# learning/pedagogy Specification

## Purpose

Defines how Open-SimLab teaches rather than merely simulates: onboarding a learner who has never seen an anesthesia machine, stating learning objectives, guiding without hand-holding, and closing every session with a debrief that explains what the patient did and why.

## Requirements

### Requirement: Immediate First Run Without Instruction

A first-time visitor SHALL reach a running simulation with a clear next action without an account, a tutorial gate, or a settings decision.

#### Scenario: A learner acts within thirty seconds

- **WHEN** a first-time visitor loads `/anesthesia` on a mid-range phone
- **THEN** a default scenario is running or ready, a single prominent next action is offered, and usability testing shows the median first meaningful action occurring within 30 seconds

#### Scenario: Guidance can be dismissed permanently

- **WHEN** a returning learner dismisses the introductory overlay
- **THEN** it does not reappear on subsequent visits on that device, and it remains reachable from a help control

### Requirement: Stated Learning Objectives

Every scenario SHALL declare its learning objectives in learner-facing language before the session and SHALL evaluate against those same objectives in the debrief.

#### Scenario: Objectives are visible before and after

- **WHEN** a learner opens a scenario
- **THEN** its objectives are shown on the briefing screen, and the debrief addresses each one by name with an outcome

### Requirement: Progressive Guidance Levels

The application SHALL offer three guidance levels — Guided, Coached, and Unassisted — that change how much prompting the learner receives without changing the underlying physiology.

#### Scenario: Guided mode prompts the next step

- **WHEN** a learner in Guided mode has not begun preoxygenation 60 simulated seconds into an induction scenario
- **THEN** a non-blocking prompt suggests the next step and explains why it matters

#### Scenario: Unassisted mode is silent

- **WHEN** the same situation occurs in Unassisted mode
- **THEN** no prompt appears, the patient behaves identically, and the omission is recorded for the debrief

#### Scenario: Guidance level never alters the patient

- **WHEN** the same transcript is replayed under each guidance level
- **THEN** the state traces are identical, proving guidance is presentational only

### Requirement: Structured Debrief

Every session SHALL end with a debrief containing: a timeline of key events, the objectives with an outcome for each, the physiological attribution for the major state changes, the specific decision points with what happened and what the alternatives would have produced, and links to the underlying models and citations.

#### Scenario: Debrief explains a hypotensive episode causally

- **WHEN** mean arterial pressure fell below 55 mmHg for more than 2 simulated minutes
- **THEN** the debrief names the episode, gives its duration, ranks its physiological contributors, names the learner action or inaction that preceded it, and states the alternative action and its predicted effect

#### Scenario: Counterfactual is computed, not asserted

- **WHEN** the debrief claims that giving a vasopressor 60 seconds earlier would have shortened the episode
- **THEN** that claim is produced by re-running the deterministic engine on the modified transcript, and the counterfactual trace is available to inspect

#### Scenario: Debrief works offline

- **WHEN** the device has no network connection
- **THEN** the full debrief, including citations and model detail, renders from bundled data

### Requirement: Scoring Is Formative, Not Ranked

Session assessment SHALL report specific, actionable findings against the scenario rubric. It SHALL NOT produce a single composite score, a pass or fail verdict, a percentile, or a leaderboard.

#### Scenario: Findings are specific

- **WHEN** a learner stacked propofol boluses before peak effect
- **THEN** the debrief names the behavior, shows the concentration curve interval where it happened, and explains the hysteresis principle, rather than deducting points

#### Scenario: No comparison to other learners exists

- **WHEN** the assessment surface is inspected
- **THEN** no ranking, percentile, or cross-learner comparison is present anywhere, because no learner data ever leaves the device to be compared

### Requirement: The Four Core Competencies Are Explicitly Taught

The bundled curriculum SHALL contain at least one scenario and one debrief treatment for each of: drug hysteresis and lag, sensor literacy and artifact discrimination, context-sensitive offset and accumulation, and crisis resource management under time pressure.

#### Scenario: Hysteresis competency is exercised

- **WHEN** the hysteresis scenario is completed
- **THEN** the debrief reports the learner's redosing intervals against time-to-peak-effect and states whether doses were stacked

#### Scenario: Sensor literacy competency is exercised

- **WHEN** the artifact scenario is completed
- **THEN** the debrief reports whether the learner cross-verified other parameters before treating the artifactual reading, and how long the artifact went unrecognized

#### Scenario: Crisis competency is exercised

- **WHEN** a crisis scenario is completed
- **THEN** the debrief compares the learner's action sequence against the scenario's published protocol steps, reporting each step as performed on time, performed late with the delay, or omitted

### Requirement: Practice Is Repeatable And Comparable To Oneself

A learner SHALL be able to replay the same scenario and compare their own runs on-device.

#### Scenario: Self-comparison across attempts

- **WHEN** a learner completes the same scenario a second time on the same device
- **THEN** the debrief can overlay both runs on the same axes, showing where the trajectories differ, using only locally stored transcripts
