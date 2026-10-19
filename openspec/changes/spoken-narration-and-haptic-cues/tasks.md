# Implementation plan: spoken narration and haptic cues

## 1. Speech

- [ ] Write the voice-selection function: wait for the voice list to be ready, filter to local
  voices, prefer the active locale, expose the rest; unit test with mixed local/non-local lists.
- [ ] Add the narration setting with per-source toggles, rate 0.8×–1.5×, voice choice; persist.
- [ ] Drive speech from the existing worked-example beat, tutor display, alarm live-region, and
  state-summary events; implement interruption by priority; pause with the clock.
- [ ] Suppress alarm and summary speech when the live-region announcements are enabled; state why.
- [ ] Disabled-with-reason toggle when no local voice exists.
- [ ] Replay test: narration on/off produces identical traces and transcripts.
- [ ] Automated offline run with a stubbed speech interface; add to the manual offline audit.

## 2. Haptics

- [ ] Define the three patterns; timing test for distinguishability and totals.
- [ ] Drive patterns from alarm state; stop on silence; suppress on pause; re-arm at re-alarm.
- [ ] Disabled-with-reason toggle where the interface is absent.

## 3. Pairing and documentation

- [ ] Extend the audio-visual pairing audit to spoken and haptic events.
- [ ] Document both channels in the accessibility conformance report and the sonification
  documentation, including the on-device-voice rule and its privacy reason.
