# learning/knowledge-layer Specification

## Purpose

Answers the question a learner has *at the moment they have it*. The simulator's advantage over a textbook is that when something surprising happens, the explanation can be one interaction away and specific to what just happened on this patient. This capability defines that in-context teaching surface.

## Requirements

### Requirement: The Why Panel

At any moment the learner SHALL be able to ask why the patient is doing what it is doing, and receive an explanation generated from the engine's own attribution data for the current state, not from generic prewritten text.

#### Scenario: The explanation is specific to this patient at this second

- **WHEN** mean arterial pressure has fallen and the learner opens the Why panel on the pressure tile
- **THEN** it names the ranked contributors with their share — for example propofol-induced vasodilation, positive-pressure ventilation reducing venous return, and blood loss — using this session's actual numbers

#### Scenario: The explanation links to the underlying mechanism

- **WHEN** the Why panel names propofol vasodilation
- **THEN** selecting it opens the concept explainer for vasodilation and hypotension, and the drug card for propofol, without ending the session

#### Scenario: The panel is honest about teaching models

- **WHEN** a contributor comes from a teaching model rather than a published one
- **THEN** the Why panel says so in that line, so the learner knows which parts of the explanation rest on published pharmacology

### Requirement: Concept Explainers

The module SHALL ship a set of short concept explainers, each under 250 words, covering the ideas the simulator exercises, each written in plain language with one diagram and a link to the scenario that demonstrates it.

#### Scenario: The core concept set is present

- **WHEN** the explainer set is enumerated
- **THEN** it covers at minimum: hysteresis and effect-site lag, context-sensitive decrement time, minimum alveolar concentration and age, hypnotic–opioid synergy, preoxygenation and safe apnea time, the difference between vasodilation and hypovolemia, train-of-four and reversal, capnogram morphology, alarm artifact versus true change, and depth of anesthesia monitoring and its limits

#### Scenario: An explainer earns its place by being demonstrable

- **WHEN** an explainer is opened
- **THEN** it offers a one-tap "show me" that loads the scenario or the sandbox state that demonstrates the concept live

#### Scenario: Explainers work offline and are translatable

- **WHEN** the device is offline in a non-English locale
- **THEN** the explainer renders fully from the bundle in that locale, with its diagram labels translated

### Requirement: Predict-Then-Observe Prompts

Before a pedagogically important event, the application SHALL be able to ask the learner to predict what will happen, then show them the outcome against their prediction.

#### Scenario: A prediction makes the lesson stick

- **WHEN** a learner is about to give a second propofol bolus while effect-site concentration is still rising
- **THEN** in Guided mode the application asks what they expect the depth index to do, records the answer, and afterward shows the prediction against the actual curve

#### Scenario: Predictions are never scored or stored off-device

- **WHEN** a prediction is answered
- **THEN** it is used only for the immediate comparison and the debrief, is stored locally, and produces no score

#### Scenario: Prompts never block a crisis

- **WHEN** an alarm is active or a crisis is in progress
- **THEN** no prediction prompt appears, because interrupting a learner mid-crisis teaches the wrong reflex

### Requirement: The Sandbox

The application SHALL provide a sandbox mode with no scenario, no crisis, and no scoring, where a learner can give any drug to any patient and watch the curves, so that pharmacology can be explored without a case around it.

#### Scenario: A learner can isolate one variable

- **WHEN** a learner wants to see how age changes propofol requirement
- **THEN** the sandbox lets them hold the dose fixed and vary age, showing the resulting curves overlaid, with the model's envelope enforced

#### Scenario: The sandbox links back into cases

- **WHEN** a learner finishes exploring in the sandbox
- **THEN** the sandbox suggests the scenario where that pharmacology matters clinically

### Requirement: Teaching Text Is Reviewed Clinical Content

Every explainer, drug card, Why-panel template, and debrief phrase SHALL be treated as clinical content subject to the review requirement, and SHALL name the guideline or source it reflects with its year.

#### Scenario: Unreviewed teaching text does not ship

- **WHEN** a teaching string lacks a clinical review record
- **THEN** the release build excludes the surface that would show it and reports the omission

#### Scenario: A learner can tell how current the guidance is

- **WHEN** a crisis protocol or a dosing statement is displayed
- **THEN** it names the guideline and year it reflects, so the learner knows whether to check for a newer one
