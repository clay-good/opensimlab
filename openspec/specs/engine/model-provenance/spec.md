# engine/model-provenance Specification

## Purpose

Governs how Open-SimLab ingests, tiers, cites, and constrains the pharmacological models it simulates, so that every number a learner sees can be traced to a published source, carries an honest confidence label, and is refused when the virtual patient falls outside the model's derivation envelope.

## Requirements

### Requirement: Hypnos Dataset Is The Single Source Of Truth

Model parameters SHALL be loaded from a vendored, version-pinned copy of the Hypnos dataset JSON (`dataset/models/*.json`, `dataset/drugs/*.json`, `dataset/covariate_equations/*.json`). Parameter values SHALL NOT be hand-typed into application source.

#### Scenario: Hard-coded parameters fail lint

- **WHEN** a numeric PK or PD parameter literal appears outside the vendored dataset directory
- **THEN** the custom `no-inline-pkpd-constants` lint rule fails the build, naming the file and line

#### Scenario: The pinned dataset version is displayed

- **WHEN** a learner opens the "About the models" panel
- **THEN** the panel shows the Hypnos dataset version (for example `0.9.0`), the upstream commit hash, and a link to the upstream repository

#### Scenario: A dataset upgrade is a reviewable diff

- **WHEN** the vendored dataset is re-synced from upstream
- **THEN** the sync script regenerates the golden parity vectors and the pull request shows both the dataset diff and any resulting change in simulated output

### Requirement: Confidence Tiers Are Surfaced, Never Hidden

Every model SHALL carry its Hypnos tier (`A`, `B`, `C`, or `D`) and its `review_status`. The UI SHALL display the tier wherever the model drives a visible number.

#### Scenario: Tier badge accompanies the concentration curve

- **WHEN** the PK/PD visualizer plots a curve for `hypnotics_iv.propofol.marsh_1991`
- **THEN** the curve legend shows "Tier B" and a tooltip gives the tier rationale text from the dataset

#### Scenario: An unverified parameter is labeled

- **WHEN** a model in use has any parameter with `review_status` of `unverified` or `pending_human_review`
- **THEN** the model detail panel shows an "unverified transcription" notice naming the affected parameters

### Requirement: Applicability Envelopes Are Enforced

Before a model is used for a virtual patient, the engine SHALL evaluate the model's applicability envelope (age, weight, BMI, sex, and any model-specific bound) and its documented failure modes. A patient outside the envelope SHALL cause the model to be auto-tiered to `D` and visually greyed, matching the behavior of the Hypnos `compare()` API.

#### Scenario: Schnider is excluded for a morbidly obese patient

- **WHEN** the virtual patient is 40 y, 140 kg, 172 cm, male (BMI 47.3) and propofol is selected
- **THEN** `hypnotics_iv.propofol.schnider_1998` is greyed out, tiered `D`, and annotated with both the envelope violation (`bmi=47.3 outside [20, 42]`) and the documented James-LBM inversion failure mode

#### Scenario: A pediatric model is excluded from an adult case

- **WHEN** the virtual patient is an adult and `hypnotics_iv.propofol.paedfusor_2005` is offered
- **THEN** the model is tiered `D` with the reason "pediatric model used in an adult" and cannot become the active model without an explicit override

#### Scenario: An override is deliberate and labeled

- **WHEN** an instructor explicitly enables an out-of-envelope model in the scenario authoring tool
- **THEN** the simulation runs, and every affected readout carries a persistent "out of envelope" marker for the whole session

### Requirement: Citations Are One Click Away

Each model SHALL expose its primary citation and source locator, rendered as human-readable text plus a resolvable identifier (DOI or PMID) where the dataset provides one.

#### Scenario: Learner inspects a drug curve's source

- **WHEN** a learner selects "Where does this come from?" on the remifentanil curve
- **THEN** the panel shows the model label, the citation key (for example `minto-1997-remifentanil`), the full reference, the source locator (table or appendix), and a link that resolves offline to the bundled citation record

### Requirement: Model Divergence View

The application SHALL offer a divergence view that overlays every eligible model for the selected drug on the same virtual patient and dose history, greys out envelope violations, and reports the peak spread and the driver pair — the two models furthest apart at the instant of peak disagreement.

#### Scenario: Elderly propofol case shows a large spread

- **WHEN** the divergence view runs for a 72 y, 60 kg, 162 cm female with a standard induction bolus
- **THEN** the view reports the peak effect-site spread in both absolute and relative terms, names the driver pair, and shows each included model's published in-envelope MDAPE

#### Scenario: Out-of-envelope MDAPE is never attached to an included model

- **WHEN** a model is shown as included
- **THEN** the inaccuracy badge reports only the in-envelope MDAPE, never the model's documented out-of-envelope or failure-mode figure

### Requirement: Never Synthesize Missing Parameters

The engine SHALL NOT borrow, impute, average, or invent a parameter that a model does not publish. A missing value SHALL be reported as missing.

#### Scenario: No between-subject variability means no prediction band

- **WHEN** prediction bands are enabled and the active model has `variability_status: none`
- **THEN** the model is drawn as a bare median line, is named in the output as excluded from the band math, and no band is drawn from a sibling model's Ω

#### Scenario: Effect bands declare what they omit

- **WHEN** an effect-space band is drawn by propagating PK between-subject variability through the Hill link
- **THEN** the band is labeled a lower bound on true effect spread, because pharmacodynamic parameter variability is not curated

### Requirement: Models Without A Curated Source Are Quarantined

Agents required by the simulation but absent from the Hypnos dataset — notably the vasoactive drugs phenylephrine and epinephrine — SHALL be implemented as clearly separated pedagogical response models, stored outside the vendored dataset, tiered `D`, and labeled "illustrative, not a published population model."

#### Scenario: Phenylephrine is visibly illustrative

- **WHEN** a learner administers a phenylephrine bolus
- **THEN** the mean arterial pressure response comes from the pedagogical model, the event log entry carries an "illustrative model" marker, and the model detail panel explains that no curated population PK model backs this agent

#### Scenario: Pedagogical models cannot enter the divergence view

- **WHEN** the divergence view is opened for a drug served only by a pedagogical model
- **THEN** the view reports that no curated models are available for comparison rather than presenting the illustrative model as a curated option
