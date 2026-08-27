# learning/scenario-quality Delta Specification

## ADDED Requirements

### Requirement: Every Scenario Proves That Simulation Is Necessary

Each proposed scenario SHALL carry a training-value record demonstrating that its primary objective
requires a fictional time-evolving state, incomplete information, learner action, consequence,
reassessment, and causal debrief. An item SHALL NOT enter the playable catalog when its educational
goal is fully satisfied by a standalone calculation, score, classification, checklist, reference,
conversion, lookup, or static answer.

#### Scenario: A static answer is rejected

- **WHEN** a proposed item asks a learner only to enter values and receive a number, category,
  recommendation, code, dose, conversion, or checklist result
- **THEN** it is rejected as a runtime utility rather than padded with animation or a fictional name

#### Scenario: A score can appear only as evidence inside rehearsal

- **WHEN** a sourced score or classification is educationally relevant
- **THEN** its inputs come from the authored fictional patient, the learner must gather or interpret
  those findings within the evolving encounter, later state tests the limitations of the result, and
  no standalone input form, public compute route, API, or real-patient answer is exposed

#### Scenario: Internal calculation remains subordinate to learning

- **WHEN** the engine calculates gas exchange, concentrations, hemodynamics, risk evidence, or state
  transitions
- **THEN** the result changes or explains the fictional patient's response and cannot be invoked as
  a general-purpose work product outside a scenario or sandboxed teaching demonstration

### Requirement: Defaults Are Authored Clinical Content

Every starting value, preselected setting, stocked action, hidden patient trait, scripted delay,
randomization range, and tutor threshold SHALL be declared in an authored-defaults record with its
source, rationale, region, applicability, and educational effect. Browser or framework defaults SHALL
never silently become clinical defaults.

#### Scenario: A preselected control is justified

- **WHEN** a scenario opens with oxygen, ventilator, monitor, infusion, medication, device, or
  assistance settings already selected
- **THEN** the defaults record explains whether the setting represents prior care, equipment state,
  a sourced common starting point, or a deliberate error the learner must discover

#### Scenario: No selection is the safest honest default

- **WHEN** authoritative practice varies or one preselection would imply a universal recommendation
- **THEN** no clinical option is selected, the scenario provides the fictional local context needed
  to choose, and the learner's first action remains observable

#### Scenario: Randomization cannot leave the evidence envelope

- **WHEN** a seed varies patient attributes, event timing, measurements, or response
- **THEN** every generated value stays within the declared source/calibration envelope, preserves
  the same learning objectives and difficulty band, and passes all expert and recovery paths

### Requirement: Actions Have Explicit Intent, Preconditions, And Consequences

Every learner action SHALL declare its educational intent, visible label, prerequisites, accepted
state transition, refusal behavior, timing model, reversibility, event-log representation, objective
evidence, and limitations. A control SHALL NOT exist merely because it is common in the environment.

#### Scenario: An unavailable action teaches scope without becoming a trap

- **WHEN** a learner selects an action excluded by the scenario's fidelity or capability boundary
- **THEN** it is absent or refused with a short scenario-specific reason, mutates no state, is logged
  as refused only when the attempted choice is educationally meaningful, and does not reveal a hidden
  diagnosis

#### Scenario: A procedure does not pretend to teach hands

- **WHEN** a screen action represents a physical procedure
- **THEN** the interface calls it intent or completion within the fictional case, models only sourced
  downstream state, and the prebrief/debrief state that success does not evidence psychomotor skill

#### Scenario: Reversal is not instantaneous by convenience

- **WHEN** an action should have onset, delivery, transport, equipment, or reassessment delay
- **THEN** its consequence follows the declared simulated-time model and never appears instantly only
  to reward the expected button

### Requirement: Each Scenario Contains Productive Uncertainty

The patient and event SHALL provide enough evidence for a learner to act while preserving uncertainty
that requires observation and reassessment. Hidden state SHALL never be leaked through titles,
controls, tutor copy, event names, accessibility text, logs, loading chunks, or source labels.

#### Scenario: The diagnosis is not the scenario's answer key

- **WHEN** recognition is an objective
- **THEN** the learner-facing title and early interface describe the presentation, the relevant
  actions are not named after the diagnosis, and provenance revealing the diagnosis is gated until
  the authored reveal condition or debrief

#### Scenario: Uncertainty has a fair evidence path

- **WHEN** a learner follows the expert transcript
- **THEN** all observations required for the expected action are available before its objective
  threshold, without requiring an unprompted hidden control or knowledge unique to the author

#### Scenario: A distractor is clinically plausible

- **WHEN** a scenario offers information or an action path that is not central to the final model
- **THEN** it arises from the fictional presentation, does not depend on trivia, and the debrief
  explains why it was less supported rather than calling it a trick

### Requirement: Objective Windows Are Evidence-Based And Robust

Each objective SHALL define earliest and latest evaluation ticks, accepted evidence alternatives,
grace behavior, dependencies, and why timing matters. A threshold SHALL be sourced, derived from the
modeled patient, or labeled as an educational convention.

#### Scenario: One arbitrary second cannot determine success

- **WHEN** authoritative guidance does not specify an exact time
- **THEN** the evaluator uses a justified interval or ordered behavior, reports actual delay, and
  does not convert a one-tick boundary into pass/fail language

#### Scenario: Equivalent safe paths remain equivalent

- **WHEN** regional guidance or expert review identifies multiple acceptable action sequences
- **THEN** objective evidence accepts each declared path, records meaningful differences, and tutor
  guidance does not force one merely because it was authored first

#### Scenario: Outcome is not mistaken for reasoning

- **WHEN** stochastic variation or patient reserve yields a favorable outcome after weak actions, or
  a poor outcome despite appropriate actions
- **THEN** the debrief separates observed behavior from modeled outcome and never infers intent or
  competence from survival alone

### Requirement: Every Scenario Has A Hazard Analysis

Before playable status, each scenario SHALL analyze premature diagnostic closure, cue leakage,
negative transfer to real care, unsupported precision, omitted alternatives, invalid actions,
model-boundary crossing, catastrophic outcome framing, accessibility-specific misunderstanding, and
regional practice variation. Every identified material hazard SHALL have a mitigation, limitation,
test, or explicit acceptance rationale.

#### Scenario: Negative transfer blocks completion

- **WHEN** an omitted physical, team, diagnostic, or treatment step could cause a learner to carry an
  unsafe simplified sequence into practice
- **THEN** the scenario remains incomplete until the step is modeled, the scenario is narrowed to end
  before it, or the limitation is presented at the decision point and verified in debrief testing

#### Scenario: A catastrophic branch remains educational

- **WHEN** the fictional patient arrests, sustains permanent harm, or dies
- **THEN** the branch follows declared physiology/state rules, avoids spectacle, preserves a path to
  reflection, names uncertainty, and is not used as punishment for exploring a reasonable choice

#### Scenario: Accessibility cannot change the inferred diagnosis

- **WHEN** a clue is conveyed by waveform, color, motion, pitch, spatial asymmetry, or timing
- **THEN** at least one nonvisual/noncolor representation conveys the same uncertainty without adding
  a stronger diagnostic label than sighted learners receive

### Requirement: Scenario Verification Covers A State-Space Matrix

Every scenario SHALL define and pass a minimum verification matrix: expert path, common error,
recovery after error, no-action course, unsafe/refused action, boundary timing, every supported
region, minimum and maximum seeded variation, every guidance level, keyboard-only, screen-reader,
reduced-motion, phone, offline, resume/replay, and report-context capture.

#### Scenario: The no-action course is intentional

- **WHEN** the learner performs no action through the terminal bound
- **THEN** the resulting state, tutor behavior, end condition, debrief, psychological-safety copy,
  and trace hash are checked in and clinically plausible within the declared model

#### Scenario: Recovery is possible when the lesson promises recovery

- **WHEN** a common-error path crosses the authored recovery point but remains within a recoverable
  state
- **THEN** at least one declared recovery transcript reaches its bounded target without hidden state
  mutation or tutor-only action

#### Scenario: Unsupported seeds cannot hide behind one golden trace

- **WHEN** seeded variation is enabled
- **THEN** property or enumerated boundary tests prove objective reachability, tutor truthfulness,
  event ordering, and safe state bounds across the entire declared seed domain

### Requirement: Debriefs Separate Fact, Model, Convention, And Uncertainty

Every causal debrief statement SHALL identify whether it comes from recorded learner behavior,
canonical engine state, published model, sourced discrete transition, authored educational
convention, or counterfactual. It SHALL state material uncertainty and model exclusions close to the
claim.

#### Scenario: A counterfactual does not overclaim causality

- **WHEN** the engine replays one changed action
- **THEN** the debrief says what this model predicts under that isolated change, preserves all other
  transcript choices, and does not claim what would happen to an actual patient

#### Scenario: Authored convention is visible

- **WHEN** a score window, device behavior, response calibration, or state transition is an Open Sim
  Lab teaching convention rather than a validated patient model
- **THEN** the debrief names it as such and provides the rationale and limitation in one interaction

### Requirement: Scenario Complexity Has A Budget

Each scenario SHALL declare target learner level, prerequisite count, new concept count, simultaneous
signal count, action-set size, and estimated active time. Complexity SHALL be reduced or split when a
novice cannot identify the next meaningful observation without searching unrelated controls.

#### Scenario: A beginner case has one primary lesson

- **WHEN** difficulty is `introductory`
- **THEN** it introduces no more than one primary causal mechanism, no more than three new controls,
  and no more than two concurrent abnormal signal families before the learner acts

#### Scenario: Advanced complexity remains inspectable

- **WHEN** a scenario combines multiple diagnoses or failures
- **THEN** each contributor has an observable evidence path, attribution is separable in debrief, and
  removal of any contributor yields a distinct tested course

### Requirement: Scenario Quality Is Auditable Over Time

Each playable scenario SHALL expose its completion contract, defaults record, training-value record,
hazard analysis, verification matrix, known limitations, corrections, and review maturity in public
machine-readable form.

#### Scenario: A quality regression is visible

- **WHEN** a capability, source, review, or content change invalidates any quality record
- **THEN** the scenario loses complete status or applicable maturity automatically and the catalog
  names the failed gate rather than retaining its prior count

#### Scenario: Scenario count cannot outrank quality

- **WHEN** the planned release date arrives with fewer than 256 scenarios passing every gate
- **THEN** the product publishes the smaller honest playable count and does not waive, hide, or
  weaken a requirement to reach the target

#### Scenario: Partial evidence stays inspectable without becoming completion

- **WHEN** a scenario has valid exact-version training-value, defaults, or hazard records but
  lacks any required verification evidence
- **THEN** its public audit exposes the supplied record bodies, leaves absent records missing,
  and does not count it playable or infer independent review from structural validity

#### Scenario: Catalog and release reject the same invalid registry

- **WHEN** the shared quality registry contains malformed data, an unknown module or scenario,
  a stale version, or duplicate evidence for one module/scenario/version/kind
- **THEN** both catalog generation and release evaluation stop before using partial results,
  including in development mode, rather than silently discarding or overwriting the record

#### Scenario: Evidence is data rather than executable behavior

- **WHEN** a record or imported audit supplies getters, array overrides, sparse entries,
  non-finite scalar values, or a presence flag without its matching valid payload
- **THEN** validation rejects it without treating that behavior as evidence; source references
  remain inert text and are not fetched or executed by ingestion
