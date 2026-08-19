# cockpit/patient-monitor Specification

## Purpose

Defines the real-time patient monitor: the sweeping waveform canvas, the numeric readouts, and the alarm system, modeled on the operating-room monitors learners will meet in clinical practice.

## Requirements

### Requirement: Sweeping Waveform Canvas

The monitor SHALL render waveforms on an HTML5 Canvas 2D context using a left-to-right sweep with an erase bar, at a nominal 60 frames per second, degrading gracefully on slower devices without altering the simulation.

#### Scenario: Frame budget is met on target hardware

- **WHEN** five simultaneous traces render on a mid-range 2020 Android device
- **THEN** the 95th-percentile frame time stays under 16.7 ms, measured over a 60-second run

#### Scenario: Low-power devices degrade rendering, not physiology

- **WHEN** sustained frame time exceeds 33 ms for more than 2 seconds
- **THEN** the renderer reduces to 30 frames per second and reduces waveform point density, while the solver continues at the full 100 ms tick and all numeric values stay correct

#### Scenario: Canvas is resolution-aware

- **WHEN** the monitor renders on a display with a device pixel ratio of 2 or 3
- **THEN** the canvas backing store is scaled to match, so traces are crisp rather than blurred, and the layout is unchanged

### Requirement: Required Traces And Readouts

The monitor SHALL display, at minimum: lead II electrocardiogram with heart rate; invasive arterial pressure with systolic, diastolic, and mean values; capnography with end-tidal carbon dioxide and respiratory rate; pulse oximetry plethysmograph with oxygen saturation; and a depth-of-anesthesia index. A neuromuscular train-of-four display SHALL appear whenever a blocking agent is on board.

#### Scenario: Waveform morphology reflects state

- **WHEN** the patient is hypovolemic and mechanically ventilated
- **THEN** the arterial waveform shows increased systolic pressure variation synchronized with the ventilator cycle, rather than a fixed repeating template

#### Scenario: Capnogram shape is diagnostic

- **WHEN** bronchospasm is active
- **THEN** the capnogram expiratory upstroke becomes sloped rather than square, and the shape change is visible before the end-tidal number changes materially

#### Scenario: Arrhythmias render as real morphology

- **WHEN** the rhythm changes to ventricular fibrillation
- **THEN** the electrocardiogram renders a fibrillatory waveform, the heart rate readout becomes invalid rather than showing a plausible number, and the pulse oximetry plethysmograph loses pulsatility

### Requirement: Encoding Follows The Design System

Trace colors SHALL come from the five physiological trace tokens defined by the design system and SHALL NOT be redefined locally. Color SHALL never be the only channel carrying meaning.

#### Scenario: Every trace is labeled independent of color

- **WHEN** the monitor is viewed in grayscale or by a learner with color vision deficiency
- **THEN** each trace carries a persistent text label and a distinct line style, and each alarm carries a text severity word in addition to its color

#### Scenario: A colorblind-safe alternate palette is available

- **WHEN** the learner selects the deuteranopia-safe palette in settings
- **THEN** all traces and alarm states remain mutually distinguishable, verified by a contrast and confusion-line check in the test suite

### Requirement: Alarm System

The monitor SHALL raise alarms with three severities — advisory, warning, and critical — based on configurable threshold and rate-of-change rules, with visual indication, an optional audible tone, and an acknowledge-and-silence control.

#### Scenario: Critical alarm is unmistakable

- **WHEN** oxygen saturation falls below 90%
- **THEN** a critical alarm fires with a red banner, the offending numeric flashes, the alarm text names the parameter and value, and an audible tone sounds if audio is enabled

#### Scenario: Silencing is temporary and visible

- **WHEN** the learner silences an active alarm
- **THEN** the audible tone stops for 120 simulated seconds, the visual indication persists in a silenced state, and a countdown to re-alarm is shown

#### Scenario: Alarm fatigue is a teachable event

- **WHEN** more than five alarms are active simultaneously for over 60 simulated seconds
- **THEN** the session records an alarm-burden marker that the debrief can surface, without suppressing any alarm

#### Scenario: Audio is off by default and never required

- **WHEN** the application first loads
- **THEN** audible alarms are off, all alarm information is fully available visually, and enabling audio requires a deliberate learner action satisfying browser autoplay rules

### Requirement: Monitor Reflects Displayed Signal, Not Truth

When a sensor artifact is active, the monitor SHALL display the corrupted signal and SHALL NOT reveal the underlying true value anywhere in the learner-facing interface.

#### Scenario: Truth is hidden during artifact

- **WHEN** arterial line damping is active
- **THEN** no learner-facing element shows the true mean arterial pressure, and only a deliberate clinical action such as cycling the non-invasive cuff or flushing the line reveals the discrepancy

#### Scenario: Debrief reveals the truth afterward

- **WHEN** the session ends and the debrief opens
- **THEN** the true and displayed traces are shown together for the artifact interval, with the artifact interval marked
