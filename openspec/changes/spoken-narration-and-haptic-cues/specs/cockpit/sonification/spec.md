# cockpit/sonification Delta Specification

## ADDED Requirements

### Requirement: Spoken Narration Uses Only On-Device Voices

The application SHALL offer opt-in spoken narration of worked-example beats, tutor messages,
alarm announcements, and the on-demand state summary through the browser's speech synthesis
interface, using only voices the platform declares as served from the device. It SHALL never
issue a speech request to a voice not so declared, SHALL state plainly when no on-device voice is
available, SHALL pause with the clock, SHALL offer a rate from 0.8× to 1.5× and a voice choice
that persist on the device, and SHALL ship no audio files.

#### Scenario: A network voice is never used

- **WHEN** the platform's voice list contains voices not declared local
- **THEN** none is selectable or used, verified by a unit test over the voice-selection function
  with a mixed list, and the scenario text is never passed to a non-local voice

#### Scenario: No local voice means no narration, and the learner is told why

- **WHEN** no on-device voice exists in the browser
- **THEN** the narration toggle is present but disabled with the reason that Open Sim Lab does not
  use network voices because the text would leave the device

#### Scenario: Narration follows the demonstration and stops with it

- **WHEN** a worked-example beat changes while narration is on
- **THEN** the new beat is spoken, the previous one is cut, and taking the controls or pausing
  stops speech until the demonstration or the clock resumes

#### Scenario: Priority governs interruption

- **WHEN** a high-priority alarm announcement is issued while a tutor message is being spoken
- **THEN** the alarm announcement interrupts and the tutor message is re-queued; **AND WHEN** a
  medium or low priority announcement is issued, it queues behind the current utterance

#### Scenario: A screen-reader user is not spoken to twice

- **WHEN** the learner has enabled the accessibility live-region announcements on this device
- **THEN** spoken narration of alarm announcements and the state summary is suppressed, and the
  settings surface states the reason

#### Scenario: Speech is a presentation, not an input

- **WHEN** the same transcript is replayed with narration on and off
- **THEN** the state traces are bit-identical and the transcript contains no record of narration

#### Scenario: Narration works offline

- **WHEN** the device is offline after installation and narration is on
- **THEN** every narration source is spoken from the on-device voice, verified by an automated run
  with a stubbed speech interface and recorded in the manual offline audit
