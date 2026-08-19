# engine/validation Specification

## Purpose

Establishes that the simulated patient behaves like the published evidence says a real one does, and states precisely where it does not. Defines the quantitative validation framework, the acceptance thresholds, the expert face-validity process, and the honest accounting of what remains unvalidated. This is the capability that separates "a plausible-looking simulator" from one a residency program can defend using.

## Requirements

### Requirement: Varvel Predictive Performance Framework

Pharmacokinetic accuracy SHALL be quantified using the Varvel framework (Varvel, Donoho, and Shafer, *J Pharmacokinet Biopharm* 1992;20:63–94, PMID 1588504), the field's standard for computer-controlled infusion performance, computed per subject and then pooled:

```
PE_ij        = 100 · (C_obs,ij − C_pred,ij) / C_pred,ij          (prediction is the denominator)
MDPE_i       = median_j(PE_ij)                — bias
MDAPE_i      = median_j(|PE_ij|)              — inaccuracy
wobble_i     = median_j(|PE_ij − MDPE_i|)     — intra-individual variability
divergence_i = slope of |PE_ij| against t_j   — drift of error over time (%/h)
```

#### Scenario: Every implemented model reports its performance

- **WHEN** the validation report is generated
- **THEN** each pharmacokinetic model reports MDPE, MDAPE, wobble, and divergence against an openly available observed-concentration dataset, with the number of subjects and samples stated

#### Scenario: The engine reproduces the published performance of the model it implements

- **WHEN** a model's computed MDPE and MDAPE are compared against the values reported in that model's own publication or its prospective validation study
- **THEN** they agree within the tolerance declared for that model, and a divergence beyond it fails the validation job — because disagreeing with the source paper means the implementation, not the model, is wrong

#### Scenario: Performance is shown to learners, not hidden in a report

- **WHEN** a learner opens a model's detail panel
- **THEN** it states the model's published in-envelope inaccuracy in plain language, for example that predicted concentrations typically fall within a stated percentage of measured ones

### Requirement: Validation Against Open Observed Data

Where an openly licensed dataset of observed concentrations or physiological recordings exists, the project SHALL validate against it and publish the result, naming the dataset, its version, and its license.

#### Scenario: The dataset and the code to reproduce are public

- **WHEN** a reader wants to check a validation claim
- **THEN** the repository contains the analysis script, the dataset reference, and the exact command to reproduce the reported numbers on their own machine

#### Scenario: Absence of data is stated, not glossed

- **WHEN** no open observed dataset exists for a model or a physiological subsystem
- **THEN** the validation report says so explicitly for that item, reports it as unvalidated against observed data, and does not substitute agreement-with-another-model as though it were validation

### Requirement: Physiological Behavior Is Checked Against Published Benchmarks

Physiological subsystems that no concentration dataset can validate SHALL be checked against quantitative benchmarks from the literature, each benchmark encoded as an automated test with its citation.

#### Scenario: Apnea desaturation matches published times

- **WHEN** apnea follows preoxygenation in a healthy 70 kg adult, a moderately ill adult, and an obese adult
- **THEN** the simulated times to an oxygen saturation of 90% fall within a declared tolerance of the values in Benumof, Dagg, and Benumof (*Anesthesiology* 1997;87:979–82, PMID 9357902) — approximately 8, 5, and 2.7 minutes respectively

#### Scenario: Age-adjusted minimum alveolar concentration matches the iso-MAC relationship

- **WHEN** minimum alveolar concentration is computed across ages from 5 to 95 years for sevoflurane, isoflurane, and desflurane
- **THEN** the values reproduce the Nickalls and Mapleson age-related iso-MAC relationship (*Br J Anaesth* 2003;91:170–4) within a declared tolerance

#### Scenario: Neuromuscular recovery matches guideline-relevant thresholds

- **WHEN** rocuronium blockade is reversed with sugammadex at one train-of-four twitch and at a post-tetanic count of one to two
- **THEN** recovery to a train-of-four ratio of 0.9 or greater occurs at doses consistent with the 2023 ASA practice guideline for monitoring and antagonism of neuromuscular blockade, and the test cites that guideline

#### Scenario: A benchmark failure is a build failure

- **WHEN** any physiological benchmark falls outside its declared tolerance
- **THEN** the validation job fails and names the benchmark, its citation, the expected range, and the observed value

### Requirement: Expert Face Validity Review

Before each release, clinicians from the editorial board SHALL run a defined set of scenarios and rate face validity — whether the patient behaves the way a real patient would — against a published rubric, and the ratings SHALL be recorded in the repository.

#### Scenario: Face validity is measured, not asserted

- **WHEN** a release candidate is prepared
- **THEN** at least three independent clinician reviewers complete the face-validity rubric across the core scenarios, their ratings and free-text objections are committed, and any item rated below the acceptance threshold blocks the release or is documented in the limitations register

#### Scenario: Disagreement is preserved, not averaged away

- **WHEN** reviewers disagree about whether a response is realistic
- **THEN** both positions are recorded verbatim, and the resolution — change the model, or document the limitation — is recorded with its rationale

### Requirement: The Simulator Reports Its Own Uncertainty

Where a displayed value rests on a simplification, an out-of-envelope model, or a teaching model, the interface SHALL say so at the point of display rather than only in documentation.

#### Scenario: A teaching model is never mistaken for evidence

- **WHEN** a vasoactive agent driven by a teaching model changes the blood pressure
- **THEN** the affected numeric carries the teaching-model marker, and the Why panel names the simplification in that line

#### Scenario: Precision never exceeds the evidence

- **WHEN** a predicted concentration or index is displayed
- **THEN** its precision is capped at what the model supports, and no value is shown with more significant figures than the source publication reports

### Requirement: Educational Effectiveness Is Evaluated, Not Assumed

The project SHALL define and publish an evaluation plan for whether learners actually learn, using an established framework, and SHALL report results honestly including null results.

#### Scenario: The evaluation plan is public before the data

- **WHEN** the evaluation plan is published
- **THEN** it states the outcome levels being measured, the instruments, the comparison, and the analysis, and it is committed before results are collected

#### Scenario: Prior evidence is cited rather than invented

- **WHEN** the project states that screen-based simulation improves performance
- **THEN** it cites the supporting literature — including Schwid and colleagues' finding that screen-based simulation with debriefing improved subsequent mannequin-simulator performance (PMID 11302037) — and does not present that evidence as being about this product

#### Scenario: Evaluation respects the privacy architecture

- **WHEN** an evaluation study is run
- **THEN** it proceeds through explicit participant consent and locally exported data under the institution's own ethics approval, and the application gains no telemetry to support it

### Requirement: A Public Validation Report

The project SHALL publish a single validation report, regenerated each release, covering model performance, physiological benchmarks, face-validity ratings, known limitations, and the unvalidated list.

#### Scenario: One document answers "should I trust this?"

- **WHEN** a program director asks whether the simulator is accurate enough for their curriculum
- **THEN** the validation report answers with numbers, citations, tolerances, and an explicit unvalidated list, in a document readable in under 15 minutes

#### Scenario: The report cannot silently improve

- **WHEN** a validation number changes between releases
- **THEN** the report shows the previous value alongside the new one and the release notes explain the change
