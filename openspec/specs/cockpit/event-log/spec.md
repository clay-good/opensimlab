# cockpit/event-log Specification

## Purpose

Defines the chronological record of everything that happened in a session — learner actions, scenario events, alarms, and engine notices — which serves simultaneously as an in-session reference, the debrief substrate, and the portable session transcript.

## Requirements

### Requirement: Complete Chronological Record

Every learner action, scripted event, injected crisis, alarm transition, and engine warning SHALL be appended to the event log with its simulated tick, a severity, a category, and a human-readable message.

#### Scenario: A dose appears immediately and completely

- **WHEN** 100 mg of propofol is administered at simulated time 4 minutes 12 seconds
- **THEN** the log shows an entry timestamped `00:04:12` naming the drug, dose, units, route, and the active model id, and the entry appears within one animation frame of the action

#### Scenario: Nothing that changes state is unlogged

- **WHEN** the session transcript is compared against the state trace
- **THEN** every discontinuity in the state trace attributable to an input has a corresponding log entry, verified by an automated audit test

### Requirement: Severity And Filtering

Log entries SHALL carry one of the severities `info`, `advisory`, `warning`, `critical`, or `artifact`, and the learner SHALL be able to filter by severity and by category.

#### Scenario: Critical events remain findable in a busy log

- **WHEN** the log holds more than 200 entries and the learner filters to critical
- **THEN** only critical entries are shown, the filter state is visible, and clearing it restores full chronology

#### Scenario: Sensor artifacts are visually distinct from physiological events

- **WHEN** an artifact entry and a warning entry are both present
- **THEN** they are distinguishable by text label and by icon, not by color alone

### Requirement: Log Is Synchronized With The Other Panels

Selecting a log entry SHALL move the concentration panel cursor and the monitor review cursor to that simulated time.

#### Scenario: Cross-panel navigation

- **WHEN** the learner selects the log entry for a hemorrhage event
- **THEN** the concentration panel and the waveform review both scroll to that tick, and the selection is announced to assistive technology

### Requirement: Export And Retention

The log SHALL be exportable as JSON and as plain text, and SHALL be retained in browser local storage only for the current and most recent session unless the learner explicitly saves it.

#### Scenario: Export happens entirely on-device

- **WHEN** the learner exports the log
- **THEN** a file is written by the browser's download mechanism with no network request, verified by an automated test that fails on any outbound request during export

#### Scenario: Clearing is complete

- **WHEN** the learner chooses "clear all local data"
- **THEN** every stored log, transcript, and preference is removed from local storage and IndexedDB, and the application confirms what was removed
