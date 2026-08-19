# platform/safety-and-scope Specification

## Purpose

Draws and enforces the line between a teaching simulator and a clinical tool. Open-SimLab predicts what a virtual patient does; it never advises what to do to a real one. This capability specifies the disclaimers, the technical guards that make misuse structurally hard, and the boundary inherited from the forward-only Hypnos dataset.

## Requirements

### Requirement: Not For Clinical Use, Stated Everywhere It Matters

The application SHALL state that it is an educational simulator and not a clinical decision-support tool, a dosing calculator, or a validated device, on first load, in the persistent interface chrome, in the debrief, and in every export.

#### Scenario: First load carries an unmissable statement

- **WHEN** a visitor loads the application for the first time on a device
- **THEN** the not-for-clinical-use statement is displayed and must be acknowledged once before the cockpit becomes interactive, and the acknowledgement is stored locally

#### Scenario: The statement persists after acknowledgement

- **WHEN** the learner is mid-session
- **THEN** a compact but always-visible marker in the interface chrome continues to identify the application as a simulator

#### Scenario: Exports carry the statement

- **WHEN** any transcript, log, chart image, or CSV is exported
- **THEN** the exported artifact embeds the not-for-clinical-use statement and the engine and dataset versions in its content or metadata

### Requirement: No Real-Patient Data Path

The application SHALL provide no field, import, or integration that accepts identifiable information about a real person.

#### Scenario: Patient setup is scenario-authored only

- **WHEN** the patient setup surface is inspected
- **THEN** it offers scenario selection and virtual-patient parameters only, with no name, identifier, medical record number, date of birth, or free-text clinical note field

#### Scenario: No import of clinical records

- **WHEN** the codebase is audited
- **THEN** there is no code path that reads a clinical record format, and an architecture test fails the build if one is added

### Requirement: The Forward-Only Boundary Is Structural

Code derived from or wrapping the Hypnos dataset kernels SHALL remain forward-only: dose in, prediction out. Any dose-solving or target-seeking logic SHALL live in a separate Open-SimLab module and SHALL be labeled as a simulation feature.

#### Scenario: The kernel module exposes no inverse entry point

- **WHEN** the public interface of the Hypnos-derived kernel module is enumerated
- **THEN** it contains no function that accepts a target concentration or effect and returns a dose, and an architecture test asserts this

#### Scenario: Quantile targeting is refused

- **WHEN** any surface would let a learner request the dose that keeps a stated percentile of the prediction band below a value
- **THEN** the feature is absent, because quantile targeting is inverse control in statistical dress

#### Scenario: Upstream attribution is accurate

- **WHEN** the application credits Hypnos
- **THEN** it states that Hypnos supplies forward simulation and curated parameters, and that target-controlled infusion is Open-SimLab's own simulation layer, not a Hypnos capability

### Requirement: Uncertainty Is Never Presented As Precision

Numeric outputs SHALL be displayed with a precision no greater than the underlying model supports, and SHALL be accompanied by their model tier wherever they could be mistaken for a measurement.

#### Scenario: Concentrations are not over-precise

- **WHEN** an effect-site concentration is displayed
- **THEN** it is shown to at most two decimal places with its units, and the model tier is available adjacent to it

#### Scenario: A tier D readout is visually marked

- **WHEN** a value derives from a model auto-tiered to `D` by an envelope violation or from a pedagogical illustrative model
- **THEN** the readout carries a persistent marker distinguishing it from curated in-envelope output

### Requirement: Content Accuracy Review

Every bundled scenario, protocol, and debrief text SHALL be reviewed by a named, credentialed clinician before release, and the review SHALL be recorded in the repository.

#### Scenario: Unreviewed clinical content cannot ship

- **WHEN** a scenario file lacks a `clinical_review` block naming the reviewer, their credential, and the review date
- **THEN** the release build excludes it and the build reports the omission

#### Scenario: Protocol content names its source and vintage

- **WHEN** a crisis protocol is displayed
- **THEN** it names the guideline it derives from and the year of that guideline, so a learner can tell whether it is current
