# platform/safety-and-scope Delta Specification

## ADDED Requirements

### Requirement: The Product Is Educational Rehearsal, Never A Runtime Work Tool

Every interactive clinical surface SHALL operate on a checked-in or schema-valid fictional scenario
and SHALL be designed to teach observation, prioritization, action, consequence, reassessment, and
reflection. The product SHALL NOT provide standalone calculators, dose or infusion utilities, risk-
score forms, classification pickers, converters, code lookups, patient-specific checklists,
documentation generators, diagnostic outputs, or recommendations for actual work.

#### Scenario: Arbitrary work inputs are structurally absent

- **WHEN** routes, forms, imports, public functions, manifests, Workers, and machine-readable
  interfaces are audited
- **THEN** no surface accepts arbitrary current-patient or current-work values and returns an answer
  intended for use outside the fictional simulation

#### Scenario: Educational calculations stay inside the patient model

- **WHEN** the engine computes a dose effect, score, classification, gas value, concentration,
  hemodynamic value, or treatment consequence
- **THEN** inputs derive from the fictional scenario state, output changes or explains that simulated
  state, and no standalone route, public API, MCP tool, copy-as-clinical-plan action, or real-patient
  mode exposes the computation

#### Scenario: Adding animation does not make a utility educational

- **WHEN** a proposed experience still resolves to entering values and receiving one answer without
  meaningful time, uncertainty, action consequences, reassessment, and debrief
- **THEN** it is rejected even if it includes a patient avatar, waveform, timer, animation, or quiz

### Requirement: Fictional Patient Boundaries Are Machine-Enforced

All patient attributes SHALL originate in versioned authored scenarios or bounded teaching
randomization. Learners SHALL NOT enter names, dates of birth, identifiers, free-text histories,
measurements, medication lists, laboratory results, images, documents, or device feeds describing a
real individual.

#### Scenario: Customization cannot become patient entry

- **WHEN** a learner changes difficulty, region, guidance, seed, or an explicitly educational sandbox
  dimension
- **THEN** every resulting patient remains synthetic and within a declared authored envelope; there
  is no free-form path to reproduce a real patient

#### Scenario: Imports are product artifacts only

- **WHEN** the application imports a file
- **THEN** it accepts only versioned Open Sim Lab transcripts, progress, scenario proposals, or
  instructor-review artifacts with strict schemas and rejects clinical record, image, document, and
  device formats

### Requirement: Copy Never Invites Point-Of-Care Use

Landing, catalog, tutor, debrief, provenance, export, search metadata, and machine-readable copy SHALL
describe practicing, rehearsing, observing, and learning from a fictional patient. It SHALL NOT use
“calculate for your patient,” “determine the dose,” “clinical tool,” “decision support,” “use at the
bedside,” or equivalent execution language.

#### Scenario: Search cannot misclassify the product

- **WHEN** indexable pages and structured data are inspected
- **THEN** they identify educational simulation and training, contain the not-for-clinical-use
  boundary, and do not advertise calculator, clinical decision, or patient-management utility intent

#### Scenario: An export cannot masquerade as a clinical plan

- **WHEN** a transcript, chart, debrief, or image is exported
- **THEN** it visibly identifies the fictional scenario, simulation/content versions, educational
  purpose, and not-for-clinical-use status and omits imperative real-patient instructions

## MODIFIED Requirements

### Requirement: Clinical Review Status Is Delegated To Governance

Every bundled scenario, protocol, drug card, explainer, tutor rule, and debrief text SHALL carry the
exact maturity defined by clinical governance. Preview content MAY release under the preview gates;
only exact-version reviewed or endorsed content may make the corresponding claims.

#### Scenario: Safety and governance use one status function

- **WHEN** the release build evaluates content
- **THEN** it calls one maturity/status implementation, publishes only content meeting its declared
  channel, and cannot treat preview as reviewed because a separate safety flag passed

#### Scenario: The product boundary applies at every maturity

- **WHEN** content advances from preview to reviewed or endorsed
- **THEN** it remains fictional educational rehearsal and gains no real-patient input, calculator,
  runtime utility, or clinical decision-support capability
