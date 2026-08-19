# platform/safety-and-scope Specification

## Purpose

Draws and enforces the line between a teaching simulator and a clinical tool. Open-SimLab predicts what a virtual patient does; it never advises what to do to a real one. This capability specifies the disclaimers, the technical guards that make misuse structurally hard, and the forward-only boundary of the simulation core.

## Requirements

### Requirement: Not For Clinical Use, Stated Everywhere It Matters

The application SHALL state that it is an educational simulator and not a clinical decision-support tool, a dosing calculator, or a validated device, on first load, in the persistent interface chrome, in the debrief, and in every export.

#### Scenario: First load carries an unmissable statement

- **WHEN** a visitor loads the application for the first time on a device
- **THEN** the not-for-clinical-use statement is displayed and must be acknowledged once before the cockpit becomes interactive, and the acknowledgement is stored locally

#### Scenario: The acknowledgement gates the cockpit, not the document

- **WHEN** a crawler or a scripting-disabled browser fetches a simulator route
- **THEN** the prerendered content and metadata are present in the response, because the acknowledgement gates interaction with the cockpit rather than the delivery of the page

#### Scenario: The landing page does not repeat the gate

- **WHEN** a visitor is on the landing page
- **THEN** the statement appears in the footer as required, and no acknowledgement is demanded, because nothing on that page can be mistaken for clinical guidance

#### Scenario: The statement persists after acknowledgement

- **WHEN** the learner is mid-session
- **THEN** a compact but always-visible marker in the interface chrome continues to identify the application as a simulator

#### Scenario: Exports carry the statement

- **WHEN** any transcript, log, chart image, or CSV is exported
- **THEN** the exported artifact embeds the not-for-clinical-use statement and the engine and model-set versions in its content or metadata

### Requirement: Regulatory Position Is Stated And Maintained

The project SHALL state its regulatory position explicitly: it is educational training software, not a medical device, and it SHALL be designed to stay inside that boundary. The United States Food and Drug Administration lists software intended for health care professionals as an educational tool for medical training — including software that simulates clinical scenarios to train professionals — among examples of software functions that are not medical devices, on the ground that it does not diagnose, treat, or facilitate assessment of a specific patient.

#### Scenario: The position is written down and sourced

- **WHEN** an institutional reviewer asks whether this is a regulated device
- **THEN** the documentation states the position, cites the FDA's published examples of software functions that are not medical devices, notes that classification in other jurisdictions is the adopter's responsibility, and states plainly that the project has not sought and does not hold any device clearance

#### Scenario: A proposed feature that would cross the line is refused

- **WHEN** a feature would accept a specific real patient's data, produce a dose recommendation for a real patient, or otherwise facilitate assessment of a real individual
- **THEN** it is out of scope, and the rationale records that implementing it would change the regulatory classification

#### Scenario: The boundary is testable, not merely promised

- **WHEN** the architecture tests run
- **THEN** they assert that no code path accepts real-patient input and that the target-solving module is reachable only from simulation surfaces, so the regulatory position rests on structure rather than intent

### Requirement: No Real-Patient Data Path

The application SHALL provide no field, import, or integration that accepts identifiable information about a real person.

#### Scenario: Patient setup is scenario-authored only

- **WHEN** the patient setup surface is inspected
- **THEN** it offers scenario selection and virtual-patient parameters only, with no name, identifier, medical record number, date of birth, or free-text clinical note field

#### Scenario: No import of clinical records

- **WHEN** the codebase is audited
- **THEN** there is no code path that reads a clinical record format, and an architecture test fails the build if one is added

### Requirement: The Forward-Only Boundary Is Structural

The simulation kernel SHALL remain forward-only: dose in, prediction out. Any dose-solving or target-seeking logic SHALL live in a separate Open-SimLab module and SHALL be labeled as a simulation feature.

#### Scenario: The kernel module exposes no inverse entry point

- **WHEN** the public interface of the simulation kernel module is enumerated
- **THEN** it contains no function that accepts a target concentration or effect and returns a dose, and an architecture test asserts this

#### Scenario: Quantile targeting is refused

- **WHEN** any surface would let a learner request the dose that keeps a stated percentile of the prediction band below a value
- **THEN** the feature is absent, because quantile targeting is inverse control in statistical dress

#### Scenario: Attribution is accurate

- **WHEN** the application credits its sources
- **THEN** it credits the primary publications each model is transcribed from, states that Open-SimLab transcribed and implemented them itself, and does not imply endorsement or validation by any author or sibling project

### Requirement: Uncertainty Is Never Presented As Precision

Numeric outputs SHALL be displayed with a precision no greater than the underlying model supports, and SHALL be accompanied by their model tier wherever they could be mistaken for a measurement.

#### Scenario: Concentrations are not over-precise

- **WHEN** an effect-site concentration is displayed
- **THEN** it is shown to at most two decimal places with its units, and the model tier is available adjacent to it

#### Scenario: A tier D readout is visually marked

- **WHEN** a value derives from a model auto-tiered to `D` by an envelope violation or from a pedagogical illustrative model
- **THEN** the readout carries a persistent marker distinguishing it from curated in-envelope output

### Requirement: Clinical Content Review Is Delegated To Governance

Every bundled scenario, protocol, drug card, explainer, and debrief text SHALL pass the named clinical review process defined by the clinical governance capability before release. This capability defines the safety boundary; governance defines who signs the content and how currency is maintained.

#### Scenario: The two capabilities do not diverge

- **WHEN** the release build runs
- **THEN** it enforces a single review gate implemented once, and a content item without a current review record is excluded regardless of which capability's requirement is cited
