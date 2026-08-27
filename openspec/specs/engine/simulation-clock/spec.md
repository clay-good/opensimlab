# engine/simulation-clock Specification

## Purpose

Owns simulated time: how it advances, how the learner controls it, how the solver stays decoupled from the display refresh rate, and how a whole session can be recorded, replayed, and shared as a deterministic transcript.

## Requirements

### Requirement: Fixed Simulation Tick

Simulated time SHALL advance in fixed 100 ms ticks. The tick count since scenario start SHALL be the authoritative clock; wall-clock time SHALL only govern how quickly ticks are requested.

#### Scenario: One tick, one solver step

- **WHEN** the simulation runs for 60 simulated seconds at any speed
- **THEN** exactly 600 solver steps have executed and the tick counter reads 600

#### Scenario: Display time is derived, not stored

- **WHEN** the top bar shows elapsed time
- **THEN** it is rendered from the tick counter as `HH:MM:SS`, and no separate time value is maintained that could drift from it

### Requirement: Transport Controls

The application SHALL provide play, pause, single-step, and reset controls, plus speed multipliers of 1×, 2×, 5×, and 60×. Single-step SHALL advance exactly one simulated second (10 ticks).

#### Scenario: Pause freezes physiology but not the interface

- **WHEN** the learner pauses
- **THEN** the tick counter stops, waveform sweep stops, all state values hold, and the interface remains fully interactive for inspection, panning the graph, and reading the log

#### Scenario: Speed change does not alter the trajectory

- **WHEN** a scenario is run once entirely at 1× and once entirely at 60×
- **THEN** the state vectors at equal tick counts are identical to within 1e-9, because speed changes only how often ticks are requested

#### Scenario: Doses queued while paused apply at the resumed tick

- **WHEN** the learner administers a bolus while paused and then resumes
- **THEN** the bolus is recorded at the paused tick and takes effect from that tick forward, and the event log shows that simulated time

#### Scenario: Reset requires confirmation and clears state

- **WHEN** the learner selects reset
- **THEN** a confirmation is requested; on confirmation the tick counter returns to zero, the patient returns to scenario baseline, the event log is cleared, and any in-progress infusion is stopped

### Requirement: Solver Runs Off The Main Thread

The physiological solver SHALL execute in a Web Worker, communicating with the interface by transferring state snapshots, so that solver work never blocks rendering or input.

#### Scenario: Interface stays responsive at high speed

- **WHEN** the simulation runs at 60× on a mid-range 2020 Android device
- **THEN** the main thread long-task duration stays under 50 ms at the 95th percentile and input latency stays under 100 ms

#### Scenario: Worker failure degrades safely

- **WHEN** the Web Worker terminates unexpectedly
- **THEN** the simulation pauses, an error banner explains what happened, the session transcript is preserved, and the learner is offered a resume that replays the transcript into a fresh worker

### Requirement: Catch-Up Is Bounded

When the browser throttles or suspends timers, the engine SHALL cap the number of ticks executed in a single catch-up pass so that a backgrounded tab cannot silently fast-forward the patient.

#### Scenario: Backgrounded tab does not skip ahead

- **WHEN** the tab is hidden for 10 minutes at 1× speed and then made visible
- **THEN** at most 5 simulated seconds of catch-up are executed, a notice states that the simulation was paused while hidden, and the learner may choose to resume or reset
- **AND** subsequent animation frames do not advance the internal clock until the learner explicitly resumes; resuming dismisses the notice

### Requirement: Deterministic Session Transcript

Every session SHALL be recordable as a transcript containing the scenario id and version, the pharmacology model-set revision, the engine version, the random seed, and the ordered list of learner actions with their tick timestamps. Replaying a transcript SHALL reproduce the session exactly.

#### Scenario: Transcript replays bit-identically

- **WHEN** a transcript is replayed on a different device and browser
- **THEN** the SHA-256 hash of the resulting 100 ms state trace equals the hash recorded at capture time

#### Scenario: Transcript is portable and private

- **WHEN** a learner exports a transcript
- **THEN** it is a single JSON file downloaded locally, containing no identifiers, no device information, and no network calls

#### Scenario: Version mismatch is reported, not guessed

- **WHEN** a transcript recorded under an earlier engine or model-set version is replayed
- **THEN** the application states which versions differ and offers either a faithful replay under the recorded versions if bundled or a clearly-labeled best-effort replay, never a silent replay under different numbers
