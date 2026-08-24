# learning/private-tutor Delta Specification

## ADDED Requirements

### Requirement: The Tutor Is Deterministic, Authored, And Offline

The private tutor SHALL operate entirely from checked-in rules and local session state. It SHALL
make no network request, invoke no runtime generative model, and invent no clinical explanation.

#### Scenario: A tutor course is reproducible

- **WHEN** the same scenario, seed, transcript, tutor-rule version, and guidance level are replayed
- **THEN** the same tutor interventions become eligible at the same simulated ticks with identical
  content

#### Scenario: Network loss changes nothing

- **WHEN** a learner completes briefing, scenario, reflection, debrief, recommendation, and targeted
  repetition with no network
- **THEN** the complete tutor experience remains available from installed assets

#### Scenario: A tutor rule is auditable

- **WHEN** an educator opens the provenance of a hint, directive, explanation, or recommendation
- **THEN** they can inspect its trigger, assistance level, source, content version, maturity,
  applicability, and suppression conditions

### Requirement: Assistance Uses A Six-Level Ladder

Tutor interventions SHALL use the ordered levels Orient, Notice, Connect, Prioritize, Direct, and
Explain. A rule SHALL declare one level and SHALL NOT present a specific action as a neutral
observation.

#### Scenario: The tutor starts with the smallest useful intervention

- **WHEN** a learner misses an authored observation threshold and no urgent teaching boundary is
  crossed
- **THEN** the tutor offers the lowest eligible assistance level and waits the rule's declared
  cooldown before escalating

#### Scenario: A direct prompt is transparent

- **WHEN** the tutor reaches Direct
- **THEN** it names the simulated action, explains why the current modeled state makes it relevant,
  and links to the source/limitation record

#### Scenario: Assistance does not spam

- **WHEN** a tutor intervention is displayed
- **THEN** rules for the same objective remain suppressed for at least 30 simulated seconds unless a
  separately declared urgent condition occurs
- **AND** no more than one tutor message requests attention at a time

### Requirement: Guidance Never Changes The Patient

Guided, Coached, and Unassisted modes SHALL differ only in tutor presentation. They SHALL use
identical engine state, available actions, event timing, scenario objectives, and terminal rules.

#### Scenario: All guidance levels produce the same trace

- **WHEN** an identical learner transcript is replayed in all three modes
- **THEN** canonical patient-state trace hashes, accepted/refused actions, and objective evidence are
  identical

#### Scenario: Unassisted means silent practice

- **WHEN** Unassisted mode is active
- **THEN** no Orient, Notice, Connect, Prioritize, or Direct intervention appears during the scenario
- **AND** Explain remains available after the learner's reflection in debrief

#### Scenario: Coached mode preserves productive struggle

- **WHEN** Coached mode is active
- **THEN** it begins no earlier than Notice, withholds Direct until the scenario's authored escalation
  condition, and permits the learner to dismiss any nonurgent prompt

### Requirement: The Tutor Observes Only Observable Behavior

Tutor triggers and feedback SHALL derive only from canonical state, accepted/refused actions,
timing, observations the learner deliberately opened, and the current scenario context. The tutor
SHALL NOT claim to know attention, intent, confidence, knowledge, emotion, or physical skill.

#### Scenario: Missing action is described honestly

- **WHEN** an expected simulated action is absent
- **THEN** the tutor says the action was not recorded by the threshold and never says the learner
  forgot, failed to understand, panicked, or was unsafe

#### Scenario: Hidden data does not leak through a hint

- **WHEN** a diagnosis or event is intended to be discovered and its defining observation has not
  been exposed to the learner
- **THEN** the tutor cannot name the diagnosis or use hidden state in learner-facing wording before
  the declared reveal condition

### Requirement: Preparation Paths Organize Rehearsal Around Goals

The catalog SHALL provide the 10 preparation paths defined in the design. Each path SHALL declare a
version, ordered scenarios, prerequisites, target competencies, estimated time, supported learner
roles, and limitations.

#### Scenario: A first-lab learner gets a bounded plan

- **WHEN** a learner selects “My first simulation lab”
- **THEN** they receive a finite ordered path with total estimated duration, the next scenario, the
  behaviors it rehearses, and an explicit statement that the path does not teach psychomotor or team
  performance

#### Scenario: Nothing is locked

- **WHEN** a learner opens any scenario outside the recommended order
- **THEN** it opens immediately and lists unmet assumed prerequisites without blocking practice

#### Scenario: Recommendation is locally explainable

- **WHEN** the tutor recommends a next or repeated scenario
- **THEN** it gives one reason based on the learner's selected goal, local objective evidence,
  recency, or declared prerequisite
- **AND** the learner can dismiss the recommendation for at least 7 days on that device

### Requirement: The Tutor Supports Deliberate Repetition

After debrief, the learner SHALL be able to restart the whole scenario, replay from a declared
decision point, or open a related scenario. Comparisons SHALL use only that learner's local attempts.

#### Scenario: A decision point can be rehearsed

- **WHEN** a scenario marks a replay-safe decision point and the learner selects targeted repetition
- **THEN** the engine reconstructs the exact deterministic state from the transcript, identifies that
  this is a rehearsal branch, and permits a different action without overwriting the original run

#### Scenario: Improvement is behavior-specific

- **WHEN** two local attempts are compared
- **THEN** the interface may report changes in recognition time, action order, physiologic exposure,
  unnecessary actions, or recovery
- **AND** it produces no composite score, percentile, rank, or claim of clinical competence

### Requirement: Motivation Rewards Mastery Without Manipulation

The tutor MAY acknowledge completion, recovery, persistence, explanation, and personal improvement.
It SHALL NOT use public comparison, variable rewards, streak loss, paid unlocks, arbitrary points,
or spectacle around patient harm.

#### Scenario: Recovery is celebrated accurately

- **WHEN** a learner recognizes and recovers from a modeled deterioration after an earlier error
- **THEN** the tutor names the observable recovery behavior and its patient consequence rather than
  awarding generic points

#### Scenario: Returning after time away has no penalty

- **WHEN** a learner returns after any number of days
- **THEN** no streak is shown as lost, no content is relocked, and the next suggestion is framed as an
  opportunity rather than a failure

### Requirement: Tutor Authority Cannot Exceed Content Maturity

Every tutor rule and explanation SHALL carry content maturity and SHALL be invalidated by a clinical
change to its scenario, objective, expected action, timing, or explanation.

#### Scenario: Preview guidance remains preview

- **WHEN** a preview scenario presents a hint or explanation
- **THEN** the tutor surface carries the same preview status and does not use reviewed or endorsed
  language

#### Scenario: Changed guidance loses stale review

- **WHEN** a clinically meaningful tutor rule changes
- **THEN** its prior review and any derived organizational endorsement no longer cover the new
  content version
