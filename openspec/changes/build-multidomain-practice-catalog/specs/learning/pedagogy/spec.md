# learning/pedagogy Delta Specification

## MODIFIED Requirements

### Requirement: Progressive Guidance Uses The Private Tutor Contract

The application SHALL offer Guided, Coached, and Unassisted modes through the deterministic
assistance ladder defined by `learning/private-tutor`. Guidance SHALL never alter physiology,
available actions, objectives, or terminal conditions.

#### Scenario: Guided mode escalates transparently

- **WHEN** an authored trigger remains unmet
- **THEN** the tutor progresses from the smallest eligible intervention toward a direct simulated
  action only after declared cooldown and escalation conditions

#### Scenario: Unassisted mode is silent and complete

- **WHEN** the learner selects Unassisted
- **THEN** no in-session assistance appears, all controls and patient behavior remain identical, and
  the full reflective debrief remains available afterward

#### Scenario: Guidance labels match maturity

- **WHEN** a scenario is preview, source-checked, reviewed, or endorsed
- **THEN** its tutor guidance carries the same status and resolves to the exact tutor rule/version

### Requirement: Debrief Prepares The Next Rehearsal

Every PEARLS debrief SHALL conclude with options to repeat the whole scenario, replay a declared
decision point, or begin one locally recommended related scenario, while preserving the learner's
reflection-first sequence.

#### Scenario: Repetition follows explanation

- **WHEN** the learner completes reflection and analysis
- **THEN** the debrief names one observable behavior worth rehearsing, offers the applicable repeat
  options, and explains why the recommendation follows from local evidence

#### Scenario: A replay branch preserves history

- **WHEN** the learner rehearses from a decision point
- **THEN** the original transcript remains unchanged, the branch identifies its parent and tick, and
  self-comparison reports behavior/state differences without a score or competence claim

### Requirement: Simulation-Lab Preparation Claims Stay Transferable

Open Sim Lab SHALL describe itself as preparation for supervised simulation and SHALL teach
transferable observation, prioritization, action sequencing, reassessment, and explanation. It SHALL
not claim to reproduce or guarantee performance on a named commercial simulator unless an exact,
current, publicly documented mapping has been independently evaluated.

#### Scenario: The learner knows what transfers

- **WHEN** a preparation path begins
- **THEN** it states which cognitive and monitoring behaviors are rehearsed and that physical
  controls, psychomotor technique, team interaction, local policy, and vendor behavior may differ

#### Scenario: Nominative reference implies no endorsement

- **WHEN** documentation names a commercial simulation system for compatibility or comparison
- **THEN** it uses the mark only to identify the product, cites the public basis, and states that no
  sponsorship, affiliation, or exact-replica claim exists

### Requirement: Product Energy Supports Psychological Safety

The interface MAY use meaningful motion, responsive patient state, recovery acknowledgment, private
personal improvement, and bounded challenge to make practice engaging. It SHALL preserve the safe-
container language and SHALL not reward harm, shame hesitation, or make patient death celebratory.

#### Scenario: Challenge remains respectful

- **WHEN** a scenario deteriorates rapidly or ends in death
- **THEN** urgency is communicated through patient state and sourced alarms, not taunts or spectacle,
  and the debrief begins with the existing psychological-safety sequence

#### Scenario: Progress is private mastery

- **WHEN** an improvement is displayed
- **THEN** it names the learner's own observable behavior and modeled consequence, remains on-device,
  and is not expressed as a leaderboard, percentile, global rank, or arbitrary point total
