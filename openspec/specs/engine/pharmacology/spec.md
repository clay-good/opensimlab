# engine/pharmacology Specification

## Purpose

Owns the drug knowledge in Open Sim Lab: the model parameters transcribed from the primary literature into this repository, the applicability envelopes that keep a model from being used on a patient it was never derived for, and the citations that let a learner check the source. Open Sim Lab owns these numbers outright — there is no external dataset dependency.

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

### Requirement: Initial Model Set Is Named And Cited

The anesthesia module SHALL ship at minimum the following models, each implemented from the named primary publication:

| Drug | Model | Primary source |
| --- | --- | --- |
| Propofol | Marsh 1991 | Marsh, White, Morton, Kenny. *Br J Anaesth* 1991 |
| Propofol | Schnider 1998 | Schnider et al. *Anesthesiology* 1998 |
| Propofol | Eleveld 2018 (general purpose, birth to elderly) | Eleveld, Colin, Absalom, Struys. *Br J Anaesth* 2018;120:942–59 |
| Propofol | Paedfusor / Kataria (pediatric) | Absalom & Kenny 2005; Kataria et al. 1994 |
| Remifentanil | Minto 1997 | Minto et al. *Anesthesiology* 1997;86:10–23 (PMID 9009935) and 86:24–33 (PMID 9009936) |
| Remifentanil | Eleveld 2017 | Eleveld et al. *Br J Anaesth* 2017 |
| Fentanyl | Shafer 1990 | Shafer et al. *Anesthesiology* 1990 |
| Dexmedetomidine | Hannivoort 2015 | Hannivoort et al. *Anesthesiology* 2015 |
| Rocuronium | Wierda 1991 with train-of-four pharmacodynamics | Wierda et al. 1991 |
| Succinylcholine | Roy 2004 | Roy et al. 2004 |
| Sevoflurane, isoflurane, desflurane | Age-related iso-MAC | Nickalls & Mapleson. *Br J Anaesth* 2003;91:170–4 |
| Propofol + remifentanil | Response-surface interaction | Published hypnotic–opioid response-surface model |
| Depth of anesthesia | Eleveld smoothly blended asymmetric sigmoid | Eleveld et al. *Br J Anaesth* 2018 |

Every entry SHALL resolve to an executable kernel and a full citation with a resolvable identifier.

#### Scenario: Every shipped drug has a working model and a citation

- **WHEN** the drug formulary is enumerated
- **THEN** each entry resolves to an implemented model with an executable kernel and a citation carrying a digital object identifier or PubMed identifier, and the build fails if any entry lacks either

#### Scenario: Model choice per patient is defensible

- **WHEN** a scenario declares an adult patient and does not name a propofol model
- **THEN** Eleveld 2018 is selected as the default because it is the only shipped adult model derived across a broad population including obesity and old age, and the choice and its reason are recorded in the transcript

#### Scenario: A drug the module needs but literature does not cover is labeled

- **WHEN** phenylephrine, ephedrine, or epinephrine is administered
- **THEN** the response comes from an Open Sim Lab teaching model, the interface labels it **Teaching model** with a one-sentence explanation, and it is visually distinct from a published model

### Requirement: Three Plain-Language Confidence Labels

Each model SHALL carry exactly one of three learner-facing labels: **Published** (a peer-reviewed population model used within its derivation envelope), **Out of range** (a published model applied to a patient outside its envelope), or **Teaching model** (an Open Sim Lab construction with no population source). Alphabetic tier codes SHALL NOT be shown to learners.

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

### Requirement: Transcription Is Double-Sourced And Independently Checked

Every parameter SHALL be transcribed from the primary publication and independently checked against a second source before it is marked verified. Acceptable second sources are the paper's own erratum or corrigendum, an independent published implementation, or an open reference implementation such as the Open TCI initiative's archived model files. The check SHALL be performed by a different person than the transcriber and recorded.

#### Scenario: A parameter carries its transcription record

- **WHEN** a model parameter is inspected in source
- **THEN** it records the primary source locator (table, page, or appendix), the second source consulted, the checker, and the date, and any parameter missing that record is marked unverified in the interface

#### Scenario: A known corrigendum is applied

- **WHEN** a source publication has issued a corrigendum affecting parameters — as the Eleveld 2018 propofol paper did
- **THEN** the corrected values are used, the corrigendum is cited alongside the original, and a test asserts the corrected value specifically

#### Scenario: Unverified parameters are visible, not silent

- **WHEN** any active model contains an unverified parameter
- **THEN** the model detail panel names that parameter as pending independent check, so a clinician evaluating the tool knows exactly what has and has not been double-checked

### Requirement: Known Failure Modes Are Encoded, Not Just Documented

Where a publication or the subsequent literature documents a specific failure mode of a model, that failure mode SHALL be encoded as an executable predicate that demotes the model, not merely described in prose.

#### Scenario: The James lean-body-mass inversion is caught

- **WHEN** a patient's body habitus enters the range where the James 1976 lean body mass equation inverts, affecting Schnider 1998 propofol and Minto 1997 remifentanil
- **THEN** the affected model is demoted to **Out of range**, the reason names the equation and the non-physical behavior it produces, and an in-range alternative is offered

#### Scenario: The failure is demonstrable to a learner

- **WHEN** a learner overrides the demotion to see what happens
- **THEN** the resulting non-physical curve is displayed with an explanation of why it is wrong, turning the failure mode into the lesson

### Requirement: The Depth Index Is A Model Prediction, Not A Monitor Reading

The depth-of-anesthesia value SHALL be presented as a **predicted** index derived from a published pharmacodynamic model, on the 0–100 scale those models are calibrated to, and SHALL NOT be presented as the output of any commercial monitor. Trademarked monitor names SHALL be used only nominatively, to identify the scale a published model was fitted to, and never as the name of the application's own display.

#### Scenario: The index is labeled as predicted

- **WHEN** the depth index is displayed
- **THEN** it is labeled as a predicted index with its source model named, and its detail panel states that it is computed from effect-site concentration rather than measured from an electroencephalogram

#### Scenario: No commercial monitor is imitated or implied

- **WHEN** the interface and marketing text are reviewed
- **THEN** no trademarked monitor name is used as a product name, a display label, or a logo, and any reference appears only as a citation of the scale a published model targets

#### Scenario: The limitations of depth monitoring are taught

- **WHEN** a learner opens the depth index explainer
- **THEN** it states that processed-electroencephalogram indices behave differently with ketamine, nitrous oxide, and in the elderly, are susceptible to electromyographic artifact, and that large trials have not shown a single index to be uniformly superior to end-tidal agent guidance for preventing awareness

### Requirement: Drug Cards Teach The Drug, Not Just The Math

Each drug SHALL have a learner-facing card containing its class, mechanism, typical induction and maintenance dosing, onset and duration, the main adverse effects a student must anticipate, contraindications, and what to watch on the monitor after giving it.

#### Scenario: A card answers the question a student actually has

- **WHEN** a learner opens the rocuronium card before giving it
- **THEN** the card states the intubating dose, the expected onset, the expected duration, that it has no analgesic or hypnotic effect, the reversal options, and that the train-of-four display is the thing to watch

#### Scenario: Cards are reachable from the syringe without losing the session

- **WHEN** the learner opens a card from the syringe tray
- **THEN** it opens as a Drawer over the Analysis region, the simulation continues or stays paused as it was, and closing returns focus to the syringe
