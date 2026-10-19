# platform/adoption Delta Specification

## MODIFIED Requirements

### Requirement: Curriculum Mapping To Recognized Frameworks

Every scenario in every module SHALL declare its mapping to published training frameworks that
apply to its declared learner roles, from a versioned framework registry containing at minimum:
the ACGME Anesthesiology Milestones 2.0; the ACGME Milestones 2.0 for emergency medicine,
pediatrics, internal medicine, obstetrics and gynecology, and neurology; the Council on
Accreditation standards and NBCRNA content domains; the AAMC Core Entrustable Professional
Activities for Entering Residency; the RCoA 2021 curriculum Stage 1 domains and key capabilities;
and the NCSBN Clinical Judgment Measurement Model. Mappings SHALL be data, not prose, so they can
be filtered and exported, and each framework record SHALL carry its issuing body, its version or
year, a transcribed-or-summarised fidelity label, and a `review_by` date no more than 24 months
after it was last checked.

#### Scenario: A program director filters by milestone

- **WHEN** a program director selects an ACGME subcompetency in the curriculum view
- **THEN** every scenario mapped to it is listed with its objectives and duration, and the mapping is exportable as CSV for their program documentation

#### Scenario: Mappings state their framework version

- **WHEN** a mapping is displayed
- **THEN** it names the framework and its version or year, so a reader can tell whether it reflects the current published framework

#### Scenario: An unmapped scenario is visible as unmapped

- **WHEN** a scenario has no framework mapping
- **THEN** it is listed as unmapped rather than omitted, so coverage claims stay honest

#### Scenario: Every module's learners have a framework

- **WHEN** the framework registry is checked against the catalog
- **THEN** every scenario declares at least one mapping to a framework whose applicability intersects its declared learner roles, and the build reports by name every scenario that does not

#### Scenario: A framework is kept current like a guideline

- **WHEN** a framework record passes its `review_by` date
- **THEN** the build emits a warning and the governance dashboard lists the framework as due for re-check, in the same list as overdue guideline content

#### Scenario: Only names are transcribed

- **WHEN** a framework record is marked verbatim
- **THEN** its items are short identifying names only — an EPA title, a client-needs category, a function name — and any descriptor longer than a name is summarised and the record's fidelity label says so

## ADDED Requirements

### Requirement: Nursing Scenarios Map To The Clinical Judgment Measurement Model

Every scenario declaring a nursing learner role SHALL map each objective to at least one of the
six NCSBN Clinical Judgment Measurement Model functions — recognize cues, analyze cues,
prioritize hypotheses, generate solutions, take action, evaluate outcomes — naming the observable
evidence that satisfies it. The debrief SHALL report each function as exercised, evidenced, or
not exercised for the run, SHALL produce no composite, and SHALL quote NCSBN's own statement that
the model measures entry-level decision-making and does not define clinical judgment.

#### Scenario: Each function has named evidence

- **WHEN** a nursing scenario's objective maps to "evaluate outcomes"
- **THEN** the mapping names the reassessment action or observation that evidences it, and a
  mapping with no named evidence fails the build

#### Scenario: The debrief shows coverage, not a score

- **WHEN** a nursing scenario's debrief renders
- **THEN** the six functions are listed with exercised, evidenced, or not exercised for this run,
  each with the evidence tick where evidenced, and no count, percentage, or composite appears

#### Scenario: The model's own scope is stated

- **WHEN** the NCJMM mapping is displayed anywhere
- **THEN** NCSBN's statement of the model's scope is shown with its citation, and the surface
  states that NCSBN has not reviewed or endorsed the mapping

### Requirement: Learners Can Filter The Catalog By Examination Blueprint

The catalog SHALL offer a "preparing for" filter over a versioned set of public examination
blueprints — at minimum the NCLEX-RN Test Plan client-needs categories, the USMLE Step 2 CK
content outline systems and physician tasks, and the Primary FRCA syllabus — listing the
scenarios mapped to each category. The filter SHALL carry only public values in the URL, SHALL
make no claim about examination performance, and SHALL state that no examining body has reviewed
or endorsed the mapping.

#### Scenario: A student finds the labs that touch a blueprint category

- **WHEN** a learner selects the NCLEX-RN Test Plan and the category Physiological Adaptation
- **THEN** every scenario mapped to that category is listed, grouped under it, with its duration and
  maturity, and selecting one opens its briefing

#### Scenario: No outcome is promised

- **WHEN** the blueprint filter surface is linted
- **THEN** it contains no statement about passing, scoring, or readiness for the examination, and
  the lint fails the build on such a statement

#### Scenario: The blueprint version is visible

- **WHEN** a blueprint is selected
- **THEN** its issuing body and version or effective date are shown — for example the NCLEX-RN Test
  Plan effective April 1, 2026 — and a blueprint past its `review_by` date is marked as due for
  re-check

### Requirement: Every Mapping Surface Carries The Non-Endorsement Statement

The curriculum view, the blueprint filter, the debrief's framework coverage, every exported
mapping, and the facilitator guide's mapping section SHALL carry two statements: that simulated
practice is not clinical time and satisfies no requirement of any body, and that no accrediting,
licensing, or examining body has reviewed or endorsed the mapping or the content.

#### Scenario: The statements are present everywhere a mapping is

- **WHEN** the routes and exports that display mappings are enumerated
- **THEN** each carries both statements verbatim, verified by an automated test that fails on any
  mapping surface without them

#### Scenario: Structured data makes no mapping claim

- **WHEN** a scenario briefing's `LearningResource` structured data is generated
- **THEN** its `teaches` and `educationalAlignment` properties name framework categories only with
  the framework as the alignment's target, and assert no endorsement, accreditation, or outcome
