# platform/accessibility Delta Specification

## ADDED Requirements

### Requirement: Haptic Alarm Cues Where The Device Supports Them

The application SHALL offer opt-in haptic alarm cues through the vibration interface with a
distinct pattern per IEC 60601-1-8 priority: high priority three 200 ms pulses separated by
150 ms repeating every 2.0 s, medium priority one 300 ms pulse repeating every 1.5 s, and low
priority one 150 ms pulse at onset only. Cues SHALL stop when the alarm is silenced for the
same 120 simulated seconds as the tone, SHALL be suppressed while the clock is paused, SHALL
never be the only channel for any alarm, and SHALL be stated as unavailable on platforms without
the interface.

#### Scenario: Priority is distinguishable by touch alone

- **WHEN** the three patterns are compared
- **THEN** they differ in pulse count, pulse duration, and repeat interval as stated, verified by a
  timing test on the pattern definitions

#### Scenario: Silence silences the pocket too

- **WHEN** an active alarm is silenced
- **THEN** its haptic pattern stops within one repeat interval and resumes with the audible
  re-alarm after 120 simulated seconds

#### Scenario: An unsupported platform is told, not ignored

- **WHEN** the browser exposes no vibration interface
- **THEN** the haptics toggle is present but disabled with the reason, and no error occurs

#### Scenario: Every haptic event has a visual and textual pair

- **WHEN** the audio-visual pairing audit runs
- **THEN** every haptic event and every spoken event is paired with the same visual and textual
  event as its audible counterpart, and an unpaired event fails the build
