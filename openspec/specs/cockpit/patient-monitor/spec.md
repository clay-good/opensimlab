# cockpit/patient-monitor Specification

## Purpose

Defines the real-time patient monitor: the sweeping waveform canvas, the numeric readouts, and the alarm system, modeled on the operating-room monitors learners will meet in clinical practice.

## Requirements

### Requirement: Sweeping Waveform Canvas

The monitor SHALL render waveforms on an HTML5 Canvas 2D context using a left-to-right sweep with an erase bar, at a nominal 60 frames per second, degrading gracefully on slower devices without altering the simulation. The canvas SHALL draw only from the sample buffer produced by the waveform synthesis capability and SHALL NOT generate or interpolate physiological signal itself.

#### Scenario: Frame budget is met on target hardware

- **WHEN** five simultaneous traces render on a mid-range 2020 Android device
- **THEN** the 95th-percentile frame time stays under 16.7 ms, measured over a 60-second run

#### Scenario: Low-power devices degrade rendering, not physiology

- **WHEN** sustained frame time exceeds 33 ms for more than 2 seconds
- **THEN** the renderer reduces to 30 frames per second and reduces waveform point density, while the solver continues at the full 100 ms tick and all numeric values stay correct

#### Scenario: Canvas is resolution-aware

- **WHEN** the monitor renders on a display with a device pixel ratio of 2 or 3
- **THEN** the canvas backing store is scaled to match, so traces are crisp rather than blurred, and the layout is unchanged

### Requirement: Monitoring Set Reflects The ASA Basic Monitoring Standards

The monitor SHALL display, at minimum: lead II electrocardiogram with heart rate; arterial pressure with systolic, diastolic, and mean values; capnography with end-tidal carbon dioxide and respiratory rate; pulse oximetry plethysmograph with oxygen saturation; inspired oxygen concentration; temperature; and a predicted depth-of-anesthesia index. A quantitative neuromuscular train-of-four display SHALL appear whenever a blocking agent is on board. This set is chosen so that a learner practices with the parameters the ASA Standards for Basic Anesthetic Monitoring require to be continually evaluated: oxygenation, ventilation, circulation, and temperature.

#### Scenario: The standard's cadence is taught

- **WHEN** a scenario uses non-invasive blood pressure rather than an arterial line
- **THEN** the cuff cycles at an interval the learner sets, defaulting to the 5-minute maximum interval the ASA standard specifies, and the interface shows the time since the last reading

#### Scenario: The monitoring set is justified in the interface

- **WHEN** a learner asks why these parameters are shown
- **THEN** the explainer maps each to the ASA standard's four categories and names the standard and its current revision year

#### Scenario: Morphology is legible at the rendered scale

- **WHEN** traces render at the default sweep speed equivalent to 25 mm/s
- **THEN** the features a learner must read — the dicrotic notch, the capnogram alpha angle, the QRS complex — are each resolved by at least 2 device pixels at the smallest supported region height

#### Scenario: An invalid numeric is invalidated, not smoothed

- **WHEN** the rhythm changes to ventricular fibrillation
- **THEN** the heart rate readout becomes invalid rather than reporting a plausible number derived from fibrillatory noise, and the plethysmogram loses pulsatility within one beat

### Requirement: Encoding Follows The Design System

Trace colors SHALL come from the five physiological trace tokens defined by the design system and SHALL NOT be redefined locally. Color SHALL never be the only channel carrying meaning.

#### Scenario: Every trace is labeled independent of color

- **WHEN** the monitor is viewed in grayscale or by a learner with color vision deficiency
- **THEN** each trace carries a persistent text label and a distinct line style, and each alarm carries a text severity word in addition to its color

#### Scenario: A colorblind-safe alternate palette is available

- **WHEN** the learner selects the deuteranopia-safe palette in settings
- **THEN** all traces and alarm states remain mutually distinguishable, verified by a contrast and confusion-line check in the test suite

### Requirement: Alarm System Follows IEC 60601-1-8 Conventions

The monitor SHALL raise alarms at three priorities modeled on IEC 60601-1-8, the international standard for alarm systems in medical electrical equipment, so that the visual language a learner internalizes here matches the equipment they will meet clinically: **high priority** rendered red and flashing at 1.4–2.8 Hz, **medium priority** rendered amber and flashing at 0.4–0.8 Hz, and **low priority** rendered as a steady amber or neutral indication. Each priority SHALL have visual indication, an optional audible signal, and an acknowledge-and-silence control.

#### Scenario: Priority is distinguishable without reading

- **WHEN** a high-priority and a medium-priority alarm are active together
- **THEN** they differ in color and in flash rate within the stated bands, and the difference is detectable in an automated timing test

#### Scenario: The standard is named, not imitated by guesswork

- **WHEN** the alarm implementation is reviewed
- **THEN** the priority mapping, flash rates, and the rationale cite IEC 60601-1-8, and the documentation states plainly that the simulator follows the standard's conventions for teaching purposes and is not a certified medical device

#### Scenario: High-priority alarm is unmistakable

- **WHEN** oxygen saturation falls below 85%
- **THEN** a high-priority alarm fires with a red banner, the offending numeric flashes, the alarm text names the parameter and value, and an audible tone sounds if audio is enabled

#### Scenario: Silencing is temporary and visible

- **WHEN** the learner silences an active alarm
- **THEN** the audible tone stops for 120 simulated seconds, the visual indication persists in a silenced state, and a countdown to re-alarm is shown

#### Scenario: Alarm fatigue is a teachable event

- **WHEN** more than five alarms are active simultaneously for over 60 simulated seconds
- **THEN** the session records an alarm-burden marker that the debrief can surface, without suppressing any alarm

#### Scenario: An alarm that cannot yet be true does not fire

- **WHEN** a limit describes a departure from an intended state that the session has not yet reached — a depth index above the surgical range on a patient who has been given nothing, who reads about 93 awake
- **THEN** that limit is held until its parameter has been inside its limits at least once in the session, so no alarm greets a visitor on the first frame, and the alarm that matters — lightening after surgical depth was reached — still fires

#### Scenario: Holding an alarm is opt-in and never applies to an emergency

- **WHEN** the alarm set is reviewed
- **THEN** only limits explicitly marked as held behave this way, every other limit fires from a cold start, and a saturation below the high-priority threshold on the first frame alarms immediately

#### Scenario: Audible alarm behavior is owned by the sonification capability

- **WHEN** an alarm's audible signal is specified or implemented
- **THEN** it follows the sonification capability, which owns tone design, opt-in, and volume, and the monitor implements only the visual treatment, so the two cannot diverge

### Requirement: Monitor Reflects Displayed Signal, Not Truth

When a sensor artifact is active, the monitor SHALL display the corrupted signal and SHALL NOT reveal the underlying true value anywhere in the learner-facing interface.

#### Scenario: Truth is hidden during artifact

- **WHEN** arterial line damping is active
- **THEN** no learner-facing element shows the true mean arterial pressure, and only a deliberate clinical action such as cycling the non-invasive cuff or flushing the line reveals the discrepancy

#### Scenario: Debrief reveals the truth afterward

- **WHEN** the session ends and the debrief opens
- **THEN** the true and displayed traces are shown together for the artifact interval, with the artifact interval marked
