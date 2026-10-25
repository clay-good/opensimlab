# learning/radiology-module-proposal Delta Specification

## ADDED Requirements

### Requirement: Radiology Joins The Candidate Set As A Proposal, Not A Promise

The repository SHALL hold a radiology module proposal document declaring its learner roles and setting,
at least eight scenario proposals each passing the scenario training-value rule, the shared capabilities
it composes and those it needs built, a formulary with a source or declared teaching model for every
agent, its review domains, a negative-transfer analysis, its regional variation, and a status of
`proposed`, `breadth-test-passed`, `planned`, or `declined`. Radiology SHALL appear on the landing page
only at status `planned`, SHALL carry no date, quarter, or countdown anywhere, and SHALL be counted in
the playable total only when its scenarios pass every scenario gate.

#### Scenario: Radiology is listed as proposed, never planned

- **WHEN** the landing page and About page render while radiology is at status `proposed`
- **THEN** no radiology card appears as available or planned on the landing page, and the About page
  lists radiology under proposed with its status and no date

#### Scenario: A radiology count is earned, not typed

- **WHEN** radiology is at status `proposed` or `breadth-test-passed`
- **THEN** no reader-visible scenario or module count includes radiology, and the playable total is
  unchanged until radiology scenarios pass every gate

#### Scenario: The proposal states what would advance it

- **WHEN** the radiology proposal document is read
- **THEN** it names the shell and communication capabilities still to be built, the review domains, the
  formulary sources, and the negative-transfer mitigations required before it can reach `planned`

### Requirement: Radiology Scenarios Teach Non-Interpretive Decisions, Not Image Perception

Every radiology scenario SHALL teach a time-evolving decision — acute-event management, communication,
a contrast or safety decision, follow-up ownership, or procedural safety — and SHALL NOT require a
learner to detect, localize, or characterize a finding from an image. Any finding a scenario depends on
SHALL be supplied as an authored fact in a handed record, never as pixels to interpret.

#### Scenario: A perception task fails the module

- **WHEN** a proposed radiology scenario asks the learner to find or characterize a finding from an
  image
- **THEN** it does not count toward the module's scenarios, and the proposal must replace it with a
  decision scenario or withdraw it

#### Scenario: A finding is given, and the decision is the lesson

- **WHEN** a scenario needs a radiographic finding to drive the decision
- **THEN** the finding is stated in the record the learner is handed, the objectives assess the
  action taken on it, and no objective claims to assess image reading

#### Scenario: The module never claims to teach reading

- **WHEN** the radiology prebrief, debrief, and scope documentation render
- **THEN** they state that the module teaches non-interpretive decisions, that findings are authored,
  and that screen success is not evidence of image-interpretation skill

### Requirement: Radiology Criteria Appear Only As Evidence Inside Rehearsal

A sourced radiology criterion, score, or classification — including Fleischner follow-up intervals,
estimated glomerular filtration rate thresholds, the Bosniak classification, and peri-procedural
bleeding-risk tiers — SHALL be supplied by the authored fictional patient, interpreted within the
evolving encounter, and tested for its limitations by later state. No standalone input form, compute
route, lookup, or appropriateness surface SHALL be exposed.

#### Scenario: A criterion calculator is rejected

- **WHEN** a proposed radiology scenario is primarily a form that returns a follow-up interval, a
  clearance value, a class, a tier, or an appropriateness rating
- **THEN** it is rejected as a runtime utility and does not count toward the module's scenarios

#### Scenario: A criterion's inputs come from the patient

- **WHEN** a scenario uses Fleischner, eGFR, Bosniak, or a bleeding-risk tier
- **THEN** the fictional patient supplies the size, function, morphology, or risk, the learner
  interprets it in context, and later state tests a limitation such as a guideline exclusion

#### Scenario: A guideline exclusion is honored

- **WHEN** a Fleischner-based scenario is authored
- **THEN** it excludes immunocompromised patients and patients with known primary cancer, as the
  Fleischner Society 2017 guideline itself does, rather than applying the interval universally

### Requirement: Radiology Contrast And Safety Values Are Sourced And Region-Aware

Every contrast, reaction, kidney, and safety value a radiology scenario uses SHALL name a published
source or be labeled a bounded Open Sim Lab teaching convention with its derivation and limitation.
Where guidance differs between supported regions, the scenario SHALL show a visible regional variant or
omit the disputed action rather than invent a universal rule.

#### Scenario: A contrast-reaction dose is sourced, not invented

- **WHEN** a contrast-reaction scenario delivers epinephrine
- **THEN** its dose, route, and timing cite the ACR Manual on Contrast Media or the ACR
  contrast-reaction card, and the debrief names the source rather than presenting a dosing calculator

#### Scenario: A kidney threshold shows its region

- **WHEN** an iodinated-contrast-and-kidney scenario sets an eGFR threshold or a metformin rule
- **THEN** it cites the 2020 ACR–National Kidney Foundation consensus for the United States variant and
  shows, not averages, where ESUR guidance differs

#### Scenario: An unsourced safety value blocks completion

- **WHEN** a radiology scenario introduces a threshold, interval, or dose without a source or a labeled
  teaching convention
- **THEN** the scenario cannot reach complete status, and the gate names the unsourced value

### Requirement: The Module Breadth Test Governs Radiology's Advance

Radiology SHALL advance from `proposed` to `breadth-test-passed` only when every required section of its
proposal is complete and at least eight scenario proposals each name their actions, two distinct choices
or timings, observable consequences, and an engine-grounded debrief without reading as a calculator,
lookup, or checklist answer. It SHALL advance to `planned` only when the breadth test has passed and its
first evidence briefs exist, and to available only when its scenarios pass every scenario gate.

#### Scenario: An incomplete section holds radiology at proposed

- **WHEN** any required section of the radiology proposal reads "Not yet written" or is absent
- **THEN** radiology's status cannot advance past `proposed`, and the breadth-test check names the
  missing section

#### Scenario: Planned needs evidence briefs

- **WHEN** radiology's breadth test has passed but no evidence brief exists
- **THEN** radiology stays at `breadth-test-passed`, is not shown as planned, and the check names the
  missing briefs

#### Scenario: Scenarios advance only through the gates

- **WHEN** a radiology scenario is authored and claims complete status
- **THEN** it is counted only after passing the schema, source, objective, action, progression,
  debrief, limitation, fixture, defaults, training-value, hazard, state-space, accessibility, offline,
  replay, and reporting checks that every scenario passes
