/** Acceptance tests for cockpit/sonification. */
import { describe, expect, it } from 'vitest';
import {
  ALARM_BURSTS, DEFAULT_AUDIO_SETTINGS, EXTENDED_CUES, MAX_SIMULTANEOUS_CUES, PULSE_TONE,
  burstDurationSeconds, cycleSeconds, pulseToneFrequency,
} from '@platform/audio/sonification';
import { AUDIO_EVENTS, AUDIO_VISUAL_PAIRS } from '@platform/audio/audio-visual-pairs';

describe('Requirement: Variable-Pitch Pulse Tone', () => {
  it('Scenario: Pitch mapping is documented and testable', () => {
    // The mapping is declared with its range and is monotonic across the whole of it.
    expect(PULSE_TONE.referenceHz).toBeGreaterThan(0);
    expect(PULSE_TONE.floorHz).toBeLessThan(PULSE_TONE.referenceHz);
    let previous = -1;
    for (let saturation = 0; saturation <= 100; saturation += 0.25) {
      const frequency = pulseToneFrequency(saturation);
      expect(frequency).toBeGreaterThanOrEqual(previous);
      previous = frequency;
    }
  });

  it('Scenario: Desaturation is audible before it is read', () => {
    // Pitch falls monotonically as saturation falls from 99% to 92%, per ISO 80601-2-61.
    const at99 = pulseToneFrequency(99);
    const at92 = pulseToneFrequency(92);
    expect(at92).toBeLessThan(at99);
    for (let saturation = 99; saturation >= 92; saturation -= 1) {
      expect(pulseToneFrequency(saturation - 1)).toBeLessThan(pulseToneFrequency(saturation));
    }
    // The change is perceptible: at least a semitone across those seven points.
    expect(at99 / at92).toBeGreaterThan(Math.pow(2, 1 / 12));
  });

  it('never falls below its declared floor', () => {
    expect(pulseToneFrequency(0)).toBe(PULSE_TONE.floorHz);
    expect(pulseToneFrequency(-50)).toBe(PULSE_TONE.floorHz);
    expect(pulseToneFrequency(100)).toBe(PULSE_TONE.referenceHz);
    expect(pulseToneFrequency(500)).toBe(PULSE_TONE.referenceHz);
  });
});

describe('Requirement: Alarm Tones Follow The Clinical Standard', () => {
  it('Scenario: Priority is identifiable without looking', () => {
    // Higher priority is more urgent in both rate and pattern.
    expect(ALARM_BURSTS.high.pulses).toBeGreaterThan(ALARM_BURSTS.medium.pulses);
    expect(ALARM_BURSTS.high.burstIntervalSeconds).toBeLessThan(ALARM_BURSTS.medium.burstIntervalSeconds);
    expect(ALARM_BURSTS.medium.burstIntervalSeconds).toBeLessThan(ALARM_BURSTS.low.burstIntervalSeconds);
    expect(ALARM_BURSTS.high.burstsPerCycle).toBeGreaterThan(ALARM_BURSTS.medium.burstsPerCycle);
  });

  it('keeps every frequency inside the standard\'s stated range', () => {
    for (const pattern of Object.values(ALARM_BURSTS)) {
      // IEC 60601-1-8 places the fundamental between 150 and 1000 Hz.
      expect(pattern.frequencyHz).toBeGreaterThanOrEqual(150);
      expect(pattern.frequencyHz).toBeLessThanOrEqual(1000);
      expect(burstDurationSeconds(pattern)).toBeLessThan(pattern.burstIntervalSeconds);
      // And the whole CYCLE finishes before the next one starts. The line above
      // measures one burst, so a pattern with two bursts per cycle passed it
      // while overlapping itself: high priority occupies 1.80s and its gate
      // re-fired at 1.2s, which turned five-then-five-then-pause into a
      // continuous tone. The loudest thing in the product was a rounding error
      // that looked like a design decision.
      const spacing = burstDurationSeconds(pattern) + pattern.gapSeconds * 2;
      const occupied = (pattern.burstsPerCycle - 1) * spacing + burstDurationSeconds(pattern);
      expect(cycleSeconds(pattern), 'a cycle re-fires while still sounding')
        .toBeGreaterThanOrEqual(occupied);
    }
  });
});

describe('Requirement: Audio Is Opt-In, Explained, And Never Required', () => {
  it('begins disabled', () => {
    expect(DEFAULT_AUDIO_SETTINGS.enabled).toBe(false);
  });

  it('controls pulse tone and alarm volumes independently, with a mute for each', () => {
    expect(DEFAULT_AUDIO_SETTINGS.pulseVolume).not.toBe(DEFAULT_AUDIO_SETTINGS.alarmVolume);
    expect(DEFAULT_AUDIO_SETTINGS.pulseMuted).toBe(false);
    expect(DEFAULT_AUDIO_SETTINGS.alarmMuted).toBe(false);
  });

  it('Scenario: Every sound has a visual equivalent', () => {
    // The audit: every audio event this build can emit has a declared visual pair.
    const paired = new Set(AUDIO_VISUAL_PAIRS.map((pair) => pair.audioEvent));
    for (const event of AUDIO_EVENTS) {
      expect(paired.has(event), `${event} has no declared visual equivalent`).toBe(true);
    }
    // And no pair describes an event that does not exist.
    for (const pair of AUDIO_VISUAL_PAIRS) {
      expect(AUDIO_EVENTS).toContain(pair.audioEvent);
      expect(pair.visualEquivalent.length).toBeGreaterThan(20);
      expect(pair.visualLocation.length).toBeGreaterThan(5);
    }
  });
});

describe('Requirement: Sonification Is A First-Class Accessibility Channel', () => {
  it('Scenario: Extended sonification is distinguishable from clinical realism', () => {
    for (const cue of EXTENDED_CUES) {
      // Timbrally distinct from the sine-wave clinical tones.
      expect(['triangle', 'sawtooth', 'square']).toContain(cue.timbre);
      // And documented as an Open Sim Lab affordance.
      expect(cue.description).toContain('Open Sim Lab');
    }
  });

  it('Scenario: Sonification does not overwhelm', () => {
    expect(MAX_SIMULTANEOUS_CUES).toBe(3);
    expect(EXTENDED_CUES.length).toBeGreaterThanOrEqual(MAX_SIMULTANEOUS_CUES);
    // Each cue can be enabled or disabled individually.
    expect(new Set(EXTENDED_CUES.map((c) => c.id)).size).toBe(EXTENDED_CUES.length);
  });
});

describe('Requirement: Audio Is Cheap And Offline', () => {
  it('Scenario: No audio assets are downloaded', async () => {
    // Everything is synthesized: the module references no audio file at all.
    const source = await import('@platform/audio/sonification?raw');
    const text = String((source as { default: string }).default);
    expect(text).not.toMatch(/\.(mp3|wav|ogg|m4a|flac|aac)\b/);
    expect(text).toContain('createOscillator');
  });
});
