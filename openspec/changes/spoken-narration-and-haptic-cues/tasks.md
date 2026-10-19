# Implementation plan: spoken narration and haptic cues

## 1. Speech

- [x] Write the voice-selection function: wait for the voice list to be ready, filter to local
  voices, prefer the active locale, expose the rest; unit test with mixed local/non-local lists.
  `src/platform/audio/narration-voices.ts`. Nothing speaks yet; the setting and the drivers below
  are next.
- [ ] Add the narration setting with per-source toggles, rate 0.8×–1.5×, voice choice; persist.
- [ ] Drive speech from the existing worked-example beat, tutor display, alarm live-region, and
  state-summary events; implement interruption by priority; pause with the clock.
- [ ] Suppress alarm and summary speech when the live-region announcements are enabled; state why.
- [ ] Disabled-with-reason toggle when no local voice exists.
- [ ] Replay test: narration on/off produces identical traces and transcripts.
- [ ] Automated offline run with a stubbed speech interface; add to the manual offline audit.

## 2. Haptics

- [x] Define the three patterns; timing test for distinguishability and totals. `src/platform/audio/haptics.ts`, `tests/unit/haptics.test.ts`.
- [x] Drive patterns from alarm state; stop on silence; suppress on pause; re-arm at re-alarm.
  The cockpit feeds the same highest unsilenced alarm the tone uses, and only while the clock
  runs. Repeat timing is in wall time, matching the tone's cadence, so it does not speed up at 60×.
- [x] Disabled-with-reason toggle where the interface is absent. Beside the sound toggle in the session menu; off by default, and declared in the local-data inventory.

## 3. Pairing and documentation

- [ ] Extend the audio-visual pairing audit to spoken and haptic events. Haptic events are paired; spoken events join when narration speaks.
- [ ] Document both channels in the accessibility conformance report and the sonification
  documentation, including the on-device-voice rule and its privacy reason.
