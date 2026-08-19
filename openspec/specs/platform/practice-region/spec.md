# platform/practice-region Specification

## Purpose

Anesthesia is not practiced identically everywhere, and teaching a learner a technique they cannot legally use where they train is a defect, not a feature. The clearest example: target-controlled infusion is standard practice across the United Kingdom, Europe, Australia, and much of Asia, and TCI pumps are not approved by the United States Food and Drug Administration for routine use. This capability makes the practice region an explicit, first-class setting that changes what is taught, what is available, and how it is labeled.

## Requirements

### Requirement: Practice Region Is Chosen Early And Changeable

The learner SHALL select a practice region on first run, defaulting to a best guess from the browser locale with the guess shown rather than hidden, and SHALL be able to change it at any time from settings.

#### Scenario: The default is a visible guess, not a silent assumption

- **WHEN** a first-time learner reaches the region step
- **THEN** the pre-selected region is shown with the reason ("based on your browser language"), and changing it takes one interaction

#### Scenario: Region is recorded in the transcript

- **WHEN** a session is exported
- **THEN** the transcript records the practice region it ran under, so a debrief reviewed by an instructor elsewhere is interpretable

#### Scenario: An unlisted region degrades to a stated default

- **WHEN** a learner's country has no specific profile
- **THEN** they are offered the closest published profile with an explicit statement of which one they are using and what may differ locally, rather than a silent fallback

### Requirement: Region Governs Technique Availability

Techniques not approved or not in routine use in the selected region SHALL be either unavailable or clearly marked as out-of-region, with the reason stated.

#### Scenario: Target-controlled infusion is honest in the United States

- **WHEN** the practice region is the United States and the learner opens the infusion tray
- **THEN** target-controlled infusion is presented as a learning module marked "not FDA-approved for routine use in the United States", explaining that manual infusion schemes are used instead, and the manual weight-based infusion controls are the default

#### Scenario: Target-controlled infusion is the default where it is standard

- **WHEN** the practice region is the United Kingdom
- **THEN** target-controlled infusion is a first-class control, presented as routine practice, with plasma and effect-site targeting both available

#### Scenario: An out-of-region technique remains learnable

- **WHEN** a learner deliberately opens a technique not used in their region
- **THEN** it works fully so they can understand it, and every screen carries the out-of-region label, because a student may rotate abroad or read literature from elsewhere

### Requirement: Region Governs Formulary And Presentation

The drug formulary, standard concentrations, syringe presentations, and preset doses SHALL come from the region profile.

#### Scenario: Concentrations match local practice

- **WHEN** the region changes
- **THEN** the presented syringe concentrations and preset doses update to that region's common presentations, and the change is announced rather than applied silently mid-session

#### Scenario: An unavailable drug is absent, not silently substituted

- **WHEN** an agent is not available in the selected region
- **THEN** it does not appear in the formulary, and a note explains what is used instead locally

### Requirement: Region Governs Protocol Variant

Where crisis guidance differs between issuing bodies, the region profile SHALL select the applicable guideline and the interface SHALL name it.

#### Scenario: The right airway guideline is taught

- **WHEN** the region is the United States, the protocol follows the ASA difficult airway guideline; **AND WHEN** the region is the United Kingdom, it follows the Difficult Airway Society guidance
- **THEN** in both cases the displayed protocol names its issuing body and version, and both variants pass the same clinical review requirement

#### Scenario: Where guidance agrees, it is not duplicated

- **WHEN** two regions follow substantively identical guidance
- **THEN** one reviewed protocol serves both, with both issuing bodies cited, rather than maintaining divergent copies that can drift

### Requirement: Region Governs Units And Terminology

Unit system, date format, and regional terminology SHALL follow the region profile while remaining independently overridable.

#### Scenario: Terminology matches the learner's training

- **WHEN** the region is the United Kingdom
- **THEN** the interface uses the spellings and terms that region uses in clinical practice, and the same clinical concept keeps one stable internal identifier so scenarios and transcripts stay portable

#### Scenario: Units can be overridden independently of region

- **WHEN** a learner in one region prefers the other unit system
- **THEN** they can set units independently without changing their region's techniques or protocols

### Requirement: Region Profiles Are Data, Reviewed, And Extendable

Each region profile SHALL be a declarative, versioned data file carrying its own clinical review record, and adding a region SHALL require no code change.

#### Scenario: A new region is contributed by a local clinician

- **WHEN** a clinician in an unrepresented country submits a region profile
- **THEN** it is a data file listing formulary, techniques, protocol variants, units, and terminology, it enters the same clinical review process, and it ships without a code change once signed

#### Scenario: Profile coverage and gaps are public

- **WHEN** the region list is inspected
- **THEN** each profile shows its reviewer, review date, and completeness, and regions without a profile are listed as unrepresented rather than omitted

#### Scenario: Initial coverage is stated honestly

- **WHEN** the first release ships
- **THEN** it carries at minimum a United States and a United Kingdom or European profile, states clearly that other regions fall back to the closest profile, and invites contribution
