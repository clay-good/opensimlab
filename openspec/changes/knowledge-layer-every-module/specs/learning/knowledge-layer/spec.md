# learning/knowledge-layer Delta Specification

## MODIFIED Requirements

### Requirement: The Why Panel

At any moment the learner SHALL be able to ask why the patient is doing what it is doing, and
receive an explanation generated from the engine's own data for the current state, never from
generic prewritten text. For a `closed_loop_physiology` scenario the explanation SHALL name the
ranked contributors with their share. For a `state_transition` scenario it SHALL name the current
sourced state, the transition that brought the patient to it, the observation or accepted action
that triggered it with its tick, and the source. For a `branching_encounter` it SHALL name the
branch, the decision or omission that selected it with its tick, and the source of the authored
consequence. The panel SHALL be available in every module.

#### Scenario: The explanation is specific to this patient at this second

- **WHEN** mean arterial pressure has fallen and the learner opens the Why panel on the pressure tile in a closed-loop scenario
- **THEN** it names the ranked contributors with their share — for example propofol-induced vasodilation, positive-pressure ventilation reducing venous return, and blood loss — using this session's actual numbers

#### Scenario: A state transition is explained by its trigger and its source

- **WHEN** a state-transition scenario has moved the patient to a new sourced state and the learner opens the Why panel
- **THEN** it names the previous state, the new state, the observation or accepted action that triggered the transition with its simulated tick, and the source locator for that transition, and says plainly when the transition is an Open Sim Lab teaching convention

#### Scenario: A branch is explained without judging the learner

- **WHEN** a branching encounter has followed a branch selected by an omission
- **THEN** the Why panel states that the expected action was not recorded by the declared threshold and names the authored consequence and its source, and never says the learner forgot, failed, or was unsafe

#### Scenario: The explanation links to the underlying mechanism

- **WHEN** the Why panel names propofol vasodilation
- **THEN** selecting it opens the concept explainer for vasodilation and hypotension, and the drug card for propofol, without ending the session

#### Scenario: The panel is honest about teaching models

- **WHEN** a contributor comes from a teaching model rather than a published one
- **THEN** the Why panel says so in that line, so the learner knows which parts of the explanation rest on published pharmacology

#### Scenario: Hidden state does not leak through the explanation

- **WHEN** a recognition objective's defining observation has not yet been exposed to the learner
- **THEN** the Why panel names only what has been observed, states that the cause is not yet observable, and does not name the hidden diagnosis or transition before the reveal condition

### Requirement: Concept Explainers

Every module SHALL ship a set of at least six concept explainers, each under 250 words, covering the ideas the module's scenarios exercise, each written in plain language with one diagram, one source locator, its own maturity label, and a one-tap "show me" that resolves to a playable scenario in that module or to an addressable sandbox state. The anesthesia module SHALL retain its existing core set.

#### Scenario: The core concept set is present

- **WHEN** the anesthesia explainer set is enumerated
- **THEN** it covers at minimum: hysteresis and effect-site lag, context-sensitive decrement time, minimum alveolar concentration and age, hypnotic–opioid synergy, preoxygenation and safe apnea time, the difference between vasodilation and hypovolemia, train-of-four and reversal, capnogram morphology, alarm artifact versus true change, and depth of anesthesia monitoring and its limits

#### Scenario: Every module meets the floor

- **WHEN** the catalog gate runs
- **THEN** each of the sixteen modules declares at least six explainers, and a module below the floor fails the gate naming the module and the count

#### Scenario: Explainers teach where the evidence is weak

- **WHEN** an explainer covers a bedside test whose published predictive value is poor — airway assessment scores such as the Mallampati classification being the clearest example
- **THEN** it states what the test is used for, states honestly that no single bedside test reliably predicts difficult laryngoscopy, and teaches the resulting behavior: prepare for difficulty you did not predict

#### Scenario: An explainer earns its place by being demonstrable

- **WHEN** an explainer is opened
- **THEN** it offers a one-tap "show me" that loads the scenario or the sandbox state that demonstrates the concept live, and the catalog gate fails on a "show me" that resolves to nothing playable

#### Scenario: Explainers work offline and are translatable

- **WHEN** the device is offline in a non-English locale
- **THEN** the explainer renders fully from the bundle in that locale, with its diagram labels translated

#### Scenario: An explainer is a unit of reviewable content

- **WHEN** the review-status page renders
- **THEN** every explainer is listed by module with its maturity label and its source, under the same no-count-without-the-list rule as scenarios

### Requirement: The Sandbox

The application SHALL provide a sandbox mode with no scenario, no crisis, no objectives, no tutor, and no scoring, where a learner can give any modeled drug to any in-envelope patient and watch the curves, and can drive the shared respiratory, hemodynamic, fluid, and electrolyte capabilities directly and watch the resulting state over simulated time. The sandbox SHALL be forward-only, SHALL expose no target or dose-solving control, SHALL accept only scenario-authored patient presets, and SHALL make every state addressable by a URL carrying only the model, preset, and inputs.

#### Scenario: A learner can isolate one variable

- **WHEN** a learner wants to see how age changes propofol requirement
- **THEN** the sandbox lets them hold the dose fixed and vary age, showing the resulting curves overlaid, with the model's envelope enforced and out-of-envelope curves drawn dimmed and dashed

#### Scenario: Physiology can be explored without a case

- **WHEN** a learner sets inspired oxygen, minute ventilation, and then apnea on the healthy adult preset
- **THEN** end-tidal carbon dioxide and saturation follow the shared respiratory capability, the time to a saturation of 90% matches the Benumof benchmark the validation suite asserts, and each input states whether it drives a published or a teaching model

#### Scenario: The sandbox cannot be turned into a calculator

- **WHEN** the sandbox's controls and its module interface are enumerated
- **THEN** there is no target-concentration field, no dose-for-effect control, no quantile targeting, and no free-text patient field, and the architecture test that keeps inverse control out of the kernel covers the sandbox module

#### Scenario: A sandbox state is a link

- **WHEN** an explainer's "show me" or a facilitator's teaching point targets a sandbox state
- **THEN** a URL carrying only the model, the preset, and the inputs reproduces that state exactly, and the URL carries no transcript, progress, or identifier

#### Scenario: The sandbox links back into cases

- **WHEN** a learner finishes exploring in the sandbox
- **THEN** the sandbox suggests the scenario where that pharmacology or physiology matters clinically, drawn from the explainers that demonstrate it

## ADDED Requirements

### Requirement: Intervention Cards Cover Every Shared Formulary

Every agent, fluid, blood component, oxygen device, or device action in a module's shared
formulary SHALL have a learner-facing intervention card stating its class, mechanism, what it is
for in this module, onset and duration, what to watch on the monitor after giving it, the main
adverse effects to anticipate, contraindications, its source locator, whether it is driven by a
published model or a teaching model, and its maturity label. A card SHALL NOT state a dose as a
recommendation for a real patient.

#### Scenario: A card answers the question a student actually has

- **WHEN** a learner opens the card for transcutaneous pacing before using it in the cardiology module
- **THEN** the card states what it is for, what mechanical capture looks like on the monitor, what to watch after capture, the main hazards, and the source, and names the modeled response as a teaching model

#### Scenario: A formulary agent without a card fails the build

- **WHEN** a module's formulary lists an agent with no card
- **THEN** the catalog gate fails naming the module and the agent

#### Scenario: Cards are reachable from the action tray without losing the session

- **WHEN** the learner opens a card from any module's action tray
- **THEN** it opens as a Drawer over the Analysis region, the simulation continues or stays paused as it was, and closing returns focus to the invoking control

#### Scenario: A card never reads as a prescription

- **WHEN** a card's text is checked by the preview safety-scope rule
- **THEN** no sentence addresses a dose to a real patient, and a card that does fails the sources and safety-scope gates for that item
