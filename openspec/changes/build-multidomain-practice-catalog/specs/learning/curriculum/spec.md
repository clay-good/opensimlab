# learning/curriculum Delta Specification

## MODIFIED Requirements

### Requirement: Competency Maps Span Modules And Preparation Paths

The product SHALL maintain versioned competency maps for every playable module and cross-module
preparation path. Each competency SHALL state learner-facing behavior, detectable evidence,
scenarios, prerequisites, external-framework mappings where applicable, maturity coverage, and what
the browser cannot assess.

#### Scenario: A path crosses specialties without losing traceability

- **WHEN** the shock-and-perfusion path includes anesthesia, emergency, ICU, obstetric, and pediatric
  scenarios
- **THEN** each scenario maps its role-specific objective to shared and module-specific competencies
  without claiming that evidence in one population proves competence in another

#### Scenario: Preview evidence is labeled

- **WHEN** local progress derives from a preview scenario
- **THEN** the progress view names that maturity and does not represent the evidence as reviewed or
  institution-endorsed curriculum completion

#### Scenario: Unsupported skills remain out of scope

- **WHEN** a framework competency requires psychomotor technique, physical examination, team
  communication quality, or supervised assessment
- **THEN** the map states the external assessment required and does not infer it from screen actions

### Requirement: Recommended Progression Is Goal-Based And Never Locked

The curriculum SHALL recommend scenarios using the learner's chosen preparation goal, declared
prerequisites, local objective evidence, difficulty, and recency. Every scenario SHALL remain directly
openable.

#### Scenario: Recommendation gives one inspectable reason

- **WHEN** a next scenario or repetition is suggested
- **THEN** the interface names the local evidence, prerequisite, recency, or chosen goal responsible
  and allows dismissal for at least 7 days

#### Scenario: No server computes progression

- **WHEN** recommendations and competency state are produced
- **THEN** computation uses local manifests and local transcripts only and network inspection shows
  no progress or recommendation request

### Requirement: Institutional Curriculum Claims Use Reviewed Scope

A public adoption pack or course mapping that claims clinical review SHALL include only current
exact-version reviewed content within the applicable region. Preview content MAY be listed separately
as optional preview material but SHALL not satisfy reviewed coverage.

#### Scenario: A framework row cannot be padded by preview cases

- **WHEN** an institution generates reviewed coverage for an accreditation or curriculum framework
- **THEN** only clinically reviewed or appropriately institution-endorsed scenarios count toward the
  coverage result and every excluded preview scenario remains listed separately

#### Scenario: A pinned course remains reproducible

- **WHEN** an educator pins a static release and reviewed-only pack for a course
- **THEN** every learner link resolves to the same content/capability versions, maturity records,
  sources, and corrections without requiring an account
