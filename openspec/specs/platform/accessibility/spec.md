# platform/accessibility Specification

## Purpose

Makes the simulator usable by every medical student, including those who navigate by keyboard, use a screen reader, have low vision or a color vision deficiency, are sensitive to motion, or work on a small phone. Accessibility here is an admissions question: an inaccessible simulator excludes learners from a competency their training requires.

## Requirements

### Requirement: WCAG 2.2 Level AA Conformance

The application SHALL conform to WCAG 2.2 Level AA, and conformance SHALL be verified by automated checks in continuous integration plus a documented manual audit before each release.

#### Scenario: Automated checks gate the build

- **WHEN** an automated accessibility scan runs against every primary view
- **THEN** zero serious or critical violations are reported, and any new violation fails the build

#### Scenario: Manual audit covers what automation cannot

- **WHEN** a release is prepared
- **THEN** a recorded manual audit covers keyboard-only completion of a full scenario, screen reader narration of the monitor and cockpit, and 400% zoom reflow, with results committed to the repository

### Requirement: Complete Keyboard Operation

Every function SHALL be operable by keyboard alone, with a visible focus indicator meeting contrast requirements, a logical focus order, no keyboard traps, and documented shortcuts for time-critical actions.

#### Scenario: A crisis is manageable by keyboard alone

- **WHEN** a keyboard-only learner runs the cardiac arrest scenario
- **THEN** compressions, drug administration, and defibrillation are all reachable and executable within the scenario's time pressure, and the shortcut reference is available without leaving the cockpit

#### Scenario: Focus is never lost

- **WHEN** a modal opens and closes, or a panel is swapped
- **THEN** focus moves into the new context on open and returns to the invoking control on close

### Requirement: Screen Reader Access To Live Physiology

Continuously changing vital signs SHALL be available to assistive technology without flooding it, through a polite live region that announces on clinically meaningful change and an on-demand full-state summary.

#### Scenario: Meaningful change is announced, noise is not

- **WHEN** heart rate drifts by one beat per minute repeatedly
- **THEN** no announcement is made; **AND WHEN** heart rate crosses an alarm threshold, a polite announcement names the parameter, the value, and the severity

#### Scenario: Full state is available on demand

- **WHEN** the learner activates the state summary shortcut
- **THEN** all current vital signs, active infusions, ventilator settings, and active alarms are read as structured text

#### Scenario: Waveforms have a non-visual equivalent

- **WHEN** a screen reader user reaches a waveform
- **THEN** a text description of the current morphology is available, naming the rhythm, the capnogram shape, and any artifact, rather than an empty canvas

#### Scenario: Sound carries continuous state where text cannot

- **WHEN** a learner cannot see the traces
- **THEN** the extended sonification mode defined by the sonification capability lets them track saturation and rate continuously, and a documented manual audit confirms a full scenario is completable using sound and screen reader alone

### Requirement: Vision Accommodations

The interface SHALL meet a 4.5:1 contrast ratio for normal text and 3:1 for large text and meaningful graphics, SHALL reflow without horizontal scrolling at 320 CSS pixels width and at 400% zoom, and SHALL provide a high-contrast theme and a colorblind-safe palette.

#### Scenario: Reflow at extreme zoom

- **WHEN** the page is zoomed to 400% at a 1280 pixel viewport
- **THEN** no content requires two-dimensional scrolling and every control remains reachable

#### Scenario: Text can be enlarged independently

- **WHEN** the learner increases the interface text scale to 200%
- **THEN** all labels, numerics, and log entries remain fully readable without truncation or overlap

### Requirement: Motion And Audio Accommodations

The application SHALL respect the operating system reduced-motion preference, SHALL never convey information by motion alone, and SHALL never require audio.

#### Scenario: Reduced motion stops decorative animation

- **WHEN** the operating system requests reduced motion
- **THEN** decorative transitions are removed, the waveform sweep is replaced by a stepped update that conveys the same data, and no information is lost

#### Scenario: Audio is optional in every case

- **WHEN** the device has no audio output or the learner is deaf or hard of hearing
- **THEN** every alarm, prompt, and cue is fully conveyed visually and textually, verified by the automated audit that pairs every audio event with a visual event

### Requirement: Cognitive And Language Load

Interface text SHALL be plain, terminology SHALL be defined on first use, and every abbreviation SHALL expand on focus or hover.

#### Scenario: Jargon is explained in place

- **WHEN** a learner focuses the abbreviation for train-of-four ratio
- **THEN** the expansion and a one-sentence explanation appear, without navigating away from the cockpit
