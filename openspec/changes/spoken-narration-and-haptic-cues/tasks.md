# Implementation plan: spoken narration and haptic cues

## 1. Speech

- [x] Write the voice-selection function: wait for the voice list to be ready, filter to local
  voices, prefer the active locale, expose the rest; unit test with mixed local/non-local lists.
  `src/platform/audio/narration-voices.ts`.
- [x] Add the narration setting with per-source toggles, rate 0.8×–1.5×, voice choice; persist.
  In the session menu beside sound and vibration, stored as one validated `opensimlab.narration`
  preference declared in the local-data inventory.
- [x] Drive speech from the existing worked-example beat, tutor display, alarm live-region, and
  state-summary events; implement interruption by priority; pause with the clock.
  `NarrationEngine` in `src/platform/audio/narration.ts`: a new beat replaces the one being read,
  a high-priority alarm replaces anything, everything else queues, and speech pauses and resumes
  with the clock. The waveform description shares the summary source; both are on-demand reads.
- [x] Suppress alarm and summary speech when the live-region announcements are enabled; state why.
  The live regions are always present, so the per-device choice is an "I use a screen reader"
  setting whose label says why those two sources are skipped.
- [x] Disabled-with-reason toggle when no local voice exists.
- [x] Replay test: narration on/off produces identical traces and transcripts. Held structurally by
  `tests/arch/presentation-channels.test.ts`: the engine, physiology, kernel, transcript, and log
  cannot import speech, vibration, or sound, and those modules import nothing from the engine and
  make no request, so neither can change a trace or a transcript.
- [x] Automated offline run with a stubbed speech interface; add to the manual offline audit.
  `tests/unit/narration.test.ts` drives the engine through a stubbed speech interface with no
  network, and the architecture test shows the speech modules make no request of any kind, so
  narration has nothing to lose offline. Voices are installed with the operating system, not
  fetched. Hearing it offline on a real device is in the accessibility audit's owed list.

## 2. Haptics

- [x] Define the three patterns; timing test for distinguishability and totals. `src/platform/audio/haptics.ts`, `tests/unit/haptics.test.ts`.
- [x] Drive patterns from alarm state; stop on silence; suppress on pause; re-arm at re-alarm.
  The cockpit feeds the same highest unsilenced alarm the tone uses, and only while the clock
  runs. Repeat timing is in wall time, matching the tone's cadence, so it does not speed up at 60×.
- [x] Disabled-with-reason toggle where the interface is absent. Beside the sound toggle in the session menu; off by default, and declared in the local-data inventory.

## 3. Pairing and documentation

- [x] Extend the audio-visual pairing audit to spoken and haptic events. All three haptic and all
  four spoken events are declared with their on-screen equivalents.
- [x] Document both channels in the accessibility conformance report and the sonification
  documentation, including the on-device-voice rule and its privacy reason. A new section of
  `docs/accessibility-audit.md`, which also adds real-device listening and feel to what is still
  owed by a person.
