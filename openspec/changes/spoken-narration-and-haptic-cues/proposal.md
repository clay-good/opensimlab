# Spoken narration and haptic alarm cues, on-device only

## Summary

The product already treats sound as a first-class channel: the variable-pitch pulse tone, the
IEC 60601-1-8 alarm patterns, and an extended sonification mode for learners who cannot see the
traces. Two cheap channels are missing. Nothing in the product speaks: the worked-example
narration, the tutor's messages, and the on-demand state summary reach a learner only as text or
through their own screen reader. And nothing in the product vibrates: on a phone in a pocket or
a noisy ward corridor, a high-priority alarm has no channel at all when the learner looks away.

This change adds opt-in spoken narration through the browser's own speech synthesis, restricted
to voices that run on the device, and opt-in haptic alarm cues through the vibration interface
where the platform offers one. Both are additional channels, never the only one, both begin
disabled, both are synthesised rather than shipped, and both are honest about where they do not
work.

## Why

- **Narration is written to be heard.** A worked example narrates a beat at a time while the
  learner watches the monitor. Reading narration and watching a capnogram compete for the same
  eyes. Speech lets the eyes stay on the trace, which is the whole point of the demonstration.
- **A screen reader is not the only learner who benefits from speech.** Learners with dyslexia,
  learners reading in a second language, and learners on a small phone all read narration slower
  than they could hear it. The accessibility capability's on-demand state summary is already
  structured text; speaking it is one call.
- **The privacy line is specific and must be held.** Chrome's voice list can include voices that
  are fetched from, and may be rendered by, Google's servers when a network is available; local
  voices are flagged by the platform. Speaking narration through a network voice would send
  scenario text off the device, which the privacy architecture forbids even when the text is not
  learner data. The requirement therefore admits only voices the platform marks as local, and
  says so to the learner when none is available.
- **Haptics are the one alarm channel that reaches a learner who is neither looking nor
  listening.** The vibration interface is supported on Android browsers and absent on iOS Safari;
  a pattern per priority that mirrors the standard's flash cadence gives a phone learner the
  same priority discrimination the visual and audible channels carry.

## What changes

- Add spoken narration, opt-in, for worked-example beats, tutor messages, alarm announcements,
  and the on-demand state summary, using only on-device voices, with rate and voice selectable
  and remembered, and a plain statement when no local voice exists for the locale.
- Add haptic alarm cues, opt-in, with a distinct pattern per IEC priority, silenced with the
  alarm, and a plain statement on platforms without the interface.
- Keep every spoken or haptic cue paired with a visual and textual one, verified by the existing
  audio-visual pairing audit extended to the new channels.

## Explicit non-goals

- No shipped audio files, no cloud speech, no voice that the platform does not mark local.
- No speech recognition or voice control of the cockpit.
- No change to the pulse tone, the alarm tones, or the extended sonification mode.
- No narration of clinical content that is not already on screen as text.

## Success measures

- With narration on and the device offline, every worked-example beat, tutor message, alarm
  announcement, and state summary is spoken from a local voice, verified by an automated run
  with a stubbed speech interface and by a manual offline audit.
- No speech request is ever issued to a voice whose local flag is false, verified by a unit test
  over the voice-selection function.
- Every haptic pattern is distinguishable by duration and cadence per priority and stops when
  the alarm is silenced, verified by a timing test on the pattern definitions.
- The audio-visual pairing audit passes with speech and haptics included.
