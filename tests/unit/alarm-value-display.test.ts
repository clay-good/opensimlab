/**
 * The number an alarm prints has to agree with the alarm.
 *
 * The mean-arterial-pressure alarm fires below 65 mmHg and printed its value to
 * the nearest whole number, so 64.6 was announced as "Mean arterial pressure
 * low: MAP 65mmHg" — a message saying the limit was crossed beside a number
 * saying it was not. It showed up in a real session's debrief timeline, which is
 * where a learner reads it most carefully.
 */
import { describe, expect, it } from 'vitest';
import { AlarmEngine, DEFAULT_LIMITS, formatBreachedValue } from '@platform/alarms/alarms';

const limit = (id: string) => DEFAULT_LIMITS.find((entry) => entry.id === id)!;

describe('printing a breached value', () => {
  it('does not round a low breach up onto its own threshold', () => {
    const map = limit('map-low');
    expect(map.low).toBe(65);
    expect(formatBreachedValue(64.6, map)).toBe('64.6');
    expect(formatBreachedValue(64.9, map)).toBe('64.9');
  });

  it('does not round a high breach down onto its own threshold', () => {
    const tachycardia = limit('heart-rate-high');
    expect(tachycardia.high).toBe(120);
    expect(formatBreachedValue(120.4, tachycardia)).toBe('120.4');
  });

  it('leaves every other value whole, because most of them read fine', () => {
    const map = limit('map-low');
    expect(formatBreachedValue(58, map)).toBe('58');
    expect(formatBreachedValue(57.4, map)).toBe('57');
    expect(formatBreachedValue(62.5, map)).toBe('63');
  });

  it('reads consistently in the message a learner actually sees', () => {
    const engine = new AlarmEngine();
    const alarms = engine.evaluate(
      { meanArterialMmHg: 64.6, heartRateBpm: 70, spo2Percent: 98, etco2MmHg: 38 }, 0,
    ).active;
    const message = alarms.find((alarm) => alarm.id === 'map-low')!.message;
    expect(message).toContain('64.6');
    expect(message).not.toContain('65mmHg');
  });

  it('still reads whole when the value is comfortably past the limit', () => {
    const engine = new AlarmEngine();
    const message = engine.evaluate(
      { meanArterialMmHg: 51.2, heartRateBpm: 70, spo2Percent: 98, etco2MmHg: 38 }, 0,
    ).active.find((alarm) => alarm.id === 'map-low')!.message;
    expect(message).toContain('51mmHg');
  });

  it('never prints a number on the wrong side of any default limit', () => {
    // Swept across every limit rather than the two that were noticed.
    for (const entry of DEFAULT_LIMITS) {
      for (const offset of [0.1, 0.4, 0.45, 0.49, 1, 3]) {
        if (entry.low !== undefined) {
          const value = entry.low - offset;
          expect(Number(formatBreachedValue(value, entry)), `${entry.id} at ${value}`)
            .toBeLessThan(entry.low);
        }
        if (entry.high !== undefined) {
          const value = entry.high + offset;
          expect(Number(formatBreachedValue(value, entry)), `${entry.id} at ${value}`)
            .toBeGreaterThan(entry.high);
        }
      }
    }
  });
});
