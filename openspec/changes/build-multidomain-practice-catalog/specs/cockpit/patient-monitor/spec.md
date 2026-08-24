# cockpit/patient-monitor Delta Specification

## ADDED Requirements

### Requirement: Patient State, Sensor State, And Display State Remain Separate

Every monitored parameter SHALL distinguish canonical patient state, sensor/transducer/probe state,
signal-processing/display state, and learner-visible quality indicators. A scenario SHALL not create
artifact by changing patient physiology or create physiology by changing only a displayed number.

#### Scenario: Cross-check can discover artifact

- **WHEN** one sensor is damped, displaced, misleveled, obstructed, disconnected, delayed, or noisy
- **THEN** at least one independent declared observation remains available, signal quality changes
  coherently, and treating the display alone cannot secretly normalize canonical physiology

#### Scenario: A true change propagates coherently

- **WHEN** canonical physiology changes
- **THEN** every functioning sensor responds according to its declared sampling, transport, and
  processing delay while failed/artifactual sensors retain their declared behavior

### Requirement: Monitor Defaults Match Environment And Standards

Displayed parameters, alarm enablement, ranges, delays, sweep speeds, units, and signal-quality
indicators SHALL derive from the environment/scenario defaults record and applicable monitoring
standards or declared teaching conventions.

#### Scenario: One monitor layout is not universal

- **WHEN** operating-room, ICU, ward, emergency, delivery, neonatal, and prehospital scenarios load
- **THEN** each shows only instruments plausibly present and the provenance names any simplified or
  simulated device behavior

### Requirement: Monitor Interpretation Is Observable But Not Diagnosed Automatically

Learners SHALL be able to inspect trend, quality, waveform, numeric, alarm, and comparison evidence.
The live monitor SHALL not label a diagnostic pattern unless diagnosis display is a sourced property
of the fictional device and is part of the scenario's declared evidence.

#### Scenario: Artifact scenarios teach verification

- **WHEN** a signal becomes implausible or discordant
- **THEN** the interface offers the same ordinary assessment/cross-check actions as the environment,
  not a special “fix artifact” control that reveals the cause
