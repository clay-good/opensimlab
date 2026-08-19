# engine/pharmacology Specification

## Purpose

Owns the drug knowledge in Open-SimLab: the model parameters transcribed from the primary literature into this repository, the applicability envelopes that keep a model from being used on a patient it was never derived for, and the citations that let a learner check the source. Open-SimLab owns these numbers outright — there is no external dataset dependency.

## Requirements

### Requirement: Parameters Live In This Repository As Typed Source

Every pharmacokinetic and pharmacodynamic parameter SHALL be declared in a typed TypeScript module under `src/pharmacology/models/`, one file per model, transcribed by hand from the primary publication. There SHALL be no external dataset package, no vendored dataset directory, no build-time fetch, and no runtime dependency on any sibling project.

#### Scenario: The dependency graph is clean

- **WHEN** the dependency manifest and the import graph are inspected
- **THEN** no package or path reference to Hypnos or any other pharmacology dataset exists, and the pharmacology modules import nothing outside this repository

#### Scenario: A model file is self-describing

- **WHEN** a model file is opened
- **THEN** it declares in one typed object: the model id, drug, structure, every parameter with value and units, the covariate equations as executable code, the effect-site rate constant, the applicability envelope, the known failure modes, the citation, and the human-readable notes shown to learners

#### Scenario: Transcription is verified against published reference values

- **WHEN** the test suite runs
- **THEN** each model asserts the published reference-individual parameter values and at least one published concentration-time point from its source paper, so a mistyped digit fails immediately

### Requirement: Initial Drug Coverage

The anesthesia module SHALL ship with, at minimum: propofol (Marsh 1991, Schnider 1998, Eleveld 2018, and a pediatric model), remifentanil (Minto 1997, Eleveld 2017), fentanyl (Shafer 1990), dexmedetomidine (Hannivoort 2015), rocuronium, succinylcholine, sugammadex, neostigmine, sevoflurane with age-adjusted minimum alveolar concentration, and the propofol–remifentanil interaction surface.

#### Scenario: Every shipped drug has a working model and a citation

- **WHEN** the drug formulary is enumerated
- **THEN** each entry resolves to an implemented model with an executable kernel and a resolvable citation, and the build fails if any formulary entry lacks either

#### Scenario: A drug the module needs but literature does not cover is labeled

- **WHEN** phenylephrine, ephedrine, or epinephrine is administered
- **THEN** the response comes from an Open-SimLab teaching model, the interface labels it **Teaching model** with a one-sentence explanation, and it is visually distinct from a published model

### Requirement: Three Plain-Language Confidence Labels

Each model SHALL carry exactly one of three learner-facing labels: **Published** (a peer-reviewed population model used within its derivation envelope), **Out of range** (a published model applied to a patient outside its envelope), or **Teaching model** (an Open-SimLab construction with no population source). Alphabetic tier codes SHALL NOT be shown to learners.

#### Scenario: The label is visible wherever the model drives a number

- **WHEN** a concentration curve or a drug-derived vital is displayed
- **THEN** the model's label is shown adjacent to it, and selecting the label opens the model detail

#### Scenario: Out-of-range output is unmistakable

- **WHEN** a model is applied outside its envelope
- **THEN** the curve is drawn dimmed with a dashed stroke, the **Out of range** label states which covariate is out of bounds and by how much, and every derived numeric carries a persistent marker

### Requirement: Applicability Envelopes Are Enforced

Each model SHALL declare bounds for age, weight, height, body mass index, and sex, plus any documented failure mode. Before a model becomes active for a patient the engine SHALL evaluate the envelope, and a violation SHALL demote the model to **Out of range**.

#### Scenario: Schnider is refused for a morbidly obese patient

- **WHEN** the patient is 40 y, 140 kg, 172 cm, male (body mass index 47.3) and propofol is selected
- **THEN** Schnider 1998 is demoted to **Out of range**, the reason names both the body mass index bound and the lean-body-mass equation failure, and Eleveld 2018 is offered as the in-range alternative

#### Scenario: A pediatric patient gets a pediatric model

- **WHEN** the patient is a 6-year-old child
- **THEN** the pediatric propofol model is selected by default and adult-only models are demoted with the reason stated

#### Scenario: The learner may override, deliberately and visibly

- **WHEN** the learner explicitly chooses an out-of-range model
- **THEN** the simulation runs so the learner can see what goes wrong, and the out-of-range marking persists for the whole session and appears in the debrief

### Requirement: Citations Resolve Offline

Every model SHALL carry a full citation with authors, title, journal, year, and a digital object identifier or PubMed identifier where one exists, bundled so it renders with no network.

#### Scenario: A learner checks a source in a basement with no signal

- **WHEN** the learner opens the model detail offline
- **THEN** the full citation, the source table or figure the parameters came from, and a plain-language summary of what the study did all render from the bundle

### Requirement: The Model Lens

The application SHALL provide an advanced surface, the **Model Lens**, that overlays every available model for the selected drug on the same patient and dose history, dims those out of range, and states the peak spread between them and which two models drive it.

#### Scenario: The lens shows that model choice matters

- **WHEN** the lens runs for a 72 y, 60 kg, 162 cm female given a standard induction bolus of propofol
- **THEN** it overlays the eligible models, reports the peak effect-site spread in absolute and relative terms, names the two models furthest apart, and offers a one-paragraph explanation of why this matters clinically

#### Scenario: The lens is opt-in and never the default

- **WHEN** a first-time learner loads a scenario
- **THEN** a single model is active and the lens is closed, because model-selection risk is a second-order lesson that would obscure the first-order one

### Requirement: Missing Values Are Reported, Never Invented

The engine SHALL NOT borrow a parameter from a sibling model, impute a plausible value, or average across models. A parameter a publication does not give SHALL be treated as absent.

#### Scenario: An absent effect-site rate constant blocks effect-site output

- **WHEN** a model publishes no effect-site rate constant
- **THEN** the plasma curve is shown alone, the effect-site curve is absent with a stated reason, and no substituted constant is used

#### Scenario: An absent variability estimate means no band

- **WHEN** prediction bands are enabled and the active model publishes no between-subject variability
- **THEN** a bare line is drawn, the model is named as band-ineligible with the reason, and no band is borrowed from another model

### Requirement: Drug Cards Teach The Drug, Not Just The Math

Each drug SHALL have a learner-facing card containing its class, mechanism, typical induction and maintenance dosing, onset and duration, the main adverse effects a student must anticipate, contraindications, and what to watch on the monitor after giving it.

#### Scenario: A card answers the question a student actually has

- **WHEN** a learner opens the rocuronium card before giving it
- **THEN** the card states the intubating dose, the expected onset, the expected duration, that it has no analgesic or hypnotic effect, the reversal options, and that the train-of-four display is the thing to watch

#### Scenario: Cards are reachable from the syringe without losing the session

- **WHEN** the learner opens a card from the syringe tray
- **THEN** it opens as a Drawer over the Analysis region, the simulation continues or stays paused as it was, and closing returns focus to the syringe
