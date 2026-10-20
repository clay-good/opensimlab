# Design: two more channels, same rules

## 1. Speech

The platform's speech synthesis interface exposes a voice list in which each voice declares
whether it is served from the device. The product's voice selector filters to those voices, picks
the first matching the active locale, and offers the rest as choices. If no local voice matches
the locale, narration is offered in the nearest local voice with a notice, and if no local voice
exists at all the narration toggle is present but disabled with the reason: "No on-device voice
is available in this browser. Open Sim Lab does not use network voices, because the text would
leave your device." The list is read after the platform signals it is ready, because some
browsers populate it asynchronously.

What is spoken, each as its own opt-in within the narration setting:

| Source | When | Interrupts? |
| --- | --- | --- |
| Worked-example beat | as the narration line changes | the previous beat, yes |
| Tutor message | when it is displayed, not when it becomes eligible | no; queued behind a beat |
| Alarm announcement | the same polite-live-region text the screen reader receives | high priority interrupts; others queue |
| State summary | on the existing shortcut | no |

Speech is paused with the clock and resumes with it, so a learner who pauses to think is not
spoken over. Rate is selectable from 0.8× to 1.5× and remembered on the device. Speech is never
the only channel: the text it reads is on screen, and the screen reader's own announcements are
unaffected, so a screen-reader user who enables narration hears nothing twice — narration is
suppressed when the accessibility summary live region is active, which is a per-device choice
the learner makes once.

Determinism is untouched: speech is a presentation of text the engine already produced, driven
by the same events, and the transcript records nothing about it.

## 2. Haptics

The vibration interface takes a pattern of on/off durations in milliseconds. Patterns per
priority, chosen to mirror the IEC 60601-1-8 flash cadence the visual channel already uses:

| Priority | Pattern (ms) | Repeats |
| --- | --- | --- |
| High | 200 on, 150 off, 200 on, 150 off, 200 on | every 2.0 s while active and unsilenced |
| Medium | 300 on, 700 off | every 1.5 s while active and unsilenced |
| Low | 150 on | once at onset |

Silencing an alarm stops its pattern for the same 120 simulated seconds as the tone. Haptics are
suppressed while the clock is paused. The setting is present on every platform; where the
interface is absent (iOS Safari, most desktops), the toggle is disabled with the reason, so a
learner is told rather than left to wonder. A unit test asserts each pattern's total duration and
that the three are pairwise distinguishable by cadence.

## 3. Pairing

The audio-visual pairing audit already asserts that every audible event has a visual one. It is
extended so every spoken and every haptic event is paired with the same visual and textual event,
which makes "never the only channel" a test rather than a promise.

## 4. Alternatives considered

- **Shipping recorded narration.** Rejected: audio files would break the download budget and the
  "no audio assets" rule, and could not follow a take-the-controls branch.
- **Allowing network voices with a warning.** Rejected: the privacy architecture has no
  opt-in-to-leak path, and the project does not know what a given vendor's voice sends.
- **A single generic vibration for all alarms.** Rejected: priority discrimination is the point
  of the alarm standard the product teaches.
