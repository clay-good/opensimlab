# cockpit/event-log Delta Specification

## ADDED Requirements

### Requirement: The Event Log Records Observation, Intent, Acceptance, And Effect Separately

The log SHALL distinguish what became observable, what the learner requested, whether it was
accepted/refused, when delivery/procedure completed, and what modeled effect followed. It SHALL not
collapse request into delivery or temporal association into causation.

#### Scenario: Infusion delay remains visible

- **WHEN** a learner starts an infusion with modeled startup or dead-space delay
- **THEN** request, pump-running state, first delivered amount, and subsequent modeled effect are
  separate timestamped events

#### Scenario: Equipment artifact does not rewrite true physiology

- **WHEN** displayed monitoring differs from canonical patient state
- **THEN** the log records signal/device status only after it becomes observable or is assessed and
  never records a false patient event as true physiology

### Requirement: Live Log Wording Cannot Leak Hidden State

Each event type SHALL have live-safe and debrief/provenance representations. The live representation
SHALL reveal no hidden diagnosis, trigger, unrevealed patient state, or objective judgment.

#### Scenario: Script names stay internal

- **WHEN** an internal event ID contains a diagnosis or expected action
- **THEN** the live log uses an authored presentation label and the diagnostic label appears only
  after the reveal condition or in debrief

### Requirement: Logs Are Neutral Evidence, Not Scores

The log SHALL use factual language and SHALL not label actions correct, incorrect, good, bad, safe,
unsafe, passed, or failed during the scenario.

#### Scenario: Debrief interpretation preserves the original record

- **WHEN** the debrief interprets timing or consequences
- **THEN** it references immutable event IDs/ticks and adds analysis separately without rewriting the
  event record
