# cockpit/pkpd-visualizer Specification

## Purpose

Defines the concentration panel: the live plot of plasma and effect-site concentration that makes drug distribution lag, accumulation, and context-sensitive offset visible, which is the single pedagogical idea a static textbook cannot convey.

## Requirements

### Requirement: Dual Concentration Plot

The panel SHALL plot plasma concentration and effect-site concentration for every active drug against elapsed simulated time, with the two curves visually distinguished and a shared time axis with the monitor and the event log.

#### Scenario: Hysteresis is legible

- **WHEN** a propofol bolus is given
- **THEN** the plasma curve spikes and falls while the effect-site curve rises later to a lower peak, and the panel annotates the time-to-peak-effect interval between them

#### Scenario: Multiple drugs share one time axis

- **WHEN** propofol, remifentanil, and rocuronium are all active
- **THEN** each drug is plotted in its own vertical band or with its own axis and units, with no unit mixing on a single axis, and all share the same horizontal time axis

### Requirement: Time-To-Peak-Effect Guidance

The panel SHALL indicate when effect-site concentration is still rising after a bolus, so a learner can see that the effect of the last dose has not yet been fully expressed.

#### Scenario: Redosing during the rise is flagged

- **WHEN** a second bolus is given while effect-site concentration is still climbing toward its peak from the first
- **THEN** the panel marks the interval, and the session records a stacking marker that the debrief can raise as over-dosing driven by impatience rather than by patient response

### Requirement: Context-Sensitive Decrement Time

The panel SHALL compute and display, on demand, the context-sensitive decrement time — the simulated time required for effect-site concentration to fall by a chosen percentage after the infusion stops, given the infusion duration to date.

#### Scenario: Accumulation lengthens offset

- **WHEN** the learner requests the 50% decrement time after 10 minutes of fentanyl infusion and again after 4 hours
- **THEN** the reported time is substantially longer after 4 hours, and the panel explains that peripheral compartment accumulation drives the difference

#### Scenario: Short-acting agents are contrasted

- **WHEN** remifentanil and fentanyl infusions of equal duration are compared
- **THEN** remifentanil's decrement time stays nearly flat with duration while fentanyl's grows, and the comparison is available as a single overlay

### Requirement: Prediction Bands Where Curated

The panel SHALL be able to draw a seeded 5th-to-95th-percentile prediction band for any model that publishes between-subject variability, and SHALL draw a bare line, explicitly named as band-ineligible, for any model that does not.

#### Scenario: Only band-eligible models get a band

- **WHEN** bands are enabled for a propofol case
- **THEN** the model that publishes between-subject variability shows a shaded band drawn with its trace `-fill` token, and models without it are drawn as bare lines and named as band-ineligible with the reason

#### Scenario: Bands are reproducible

- **WHEN** the same case is run twice with the same seed and sample count
- **THEN** the rendered band vertices are identical

### Requirement: Inspection And Export

The panel SHALL support hovering or focusing any time point to read exact values, and SHALL export the plotted series as CSV for offline study.

#### Scenario: Keyboard inspection works without a pointer

- **WHEN** the learner focuses the plot and uses the left and right arrow keys
- **THEN** a readout cursor moves point by point, announcing time, drug, plasma concentration, and effect-site concentration to assistive technology

#### Scenario: Export is local and complete

- **WHEN** the learner exports the series
- **THEN** a CSV is written locally containing time, drug, model id, model tier, plasma concentration, and effect-site concentration with units in the header, and no network request is made
