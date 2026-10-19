import { describe, expect, it, vi } from 'vitest';
import {
  HAPTIC_PATTERNS, HapticEngine, hapticsSupported, patternDurationMs,
} from '@platform/audio/haptics';
import { AUDIO_EVENTS, AUDIO_VISUAL_PAIRS } from '@platform/audio/audio-visual-pairs';

describe('alarm vibration patterns', () => {
  it('have the durations the design states and fit inside their repeat interval', () => {
    expect(patternDurationMs(HAPTIC_PATTERNS.high)).toBe(900);
    expect(patternDurationMs(HAPTIC_PATTERNS.medium)).toBe(1000);
    expect(patternDurationMs(HAPTIC_PATTERNS.low)).toBe(150);
    for (const pattern of Object.values(HAPTIC_PATTERNS)) {
      if (pattern.repeatMs !== null) expect(patternDurationMs(pattern)).toBeLessThan(pattern.repeatMs);
    }
  });

  it('are pairwise distinguishable by cadence: pulse count, pulse length, and repetition', () => {
    const signature = (key: keyof typeof HAPTIC_PATTERNS) => {
      const { pattern, repeatMs } = HAPTIC_PATTERNS[key];
      const pulses = pattern.filter((_, index) => index % 2 === 0);
      return `${pulses.length}x${pulses[0]}@${repeatMs}`;
    };
    const signatures = (['high', 'medium', 'low'] as const).map(signature);
    expect(new Set(signatures).size).toBe(3);
  });
});

describe('the haptic engine', () => {
  const target = () => ({ vibrate: vi.fn<(pattern: number | number[]) => boolean>(() => true) });
  const high = { id: 'spo2-low', priority: 'high' as const };

  it('repeats a high alarm every 2 seconds while it sounds, and no faster', () => {
    const device = target();
    const engine = new HapticEngine(device);
    engine.alarm(high, 0);
    engine.alarm(high, 1000);
    engine.alarm(high, 1999);
    engine.alarm(high, 2000);
    expect(device.vibrate).toHaveBeenCalledTimes(2);
    expect(device.vibrate).toHaveBeenLastCalledWith([200, 150, 200, 150, 200]);
  });

  it('switches pattern at once when the priority changes', () => {
    const device = target();
    const engine = new HapticEngine(device);
    engine.alarm({ id: 'map-low', priority: 'medium' }, 0);
    engine.alarm(high, 100);
    expect(device.vibrate).toHaveBeenNthCalledWith(1, [300, 700]);
    expect(device.vibrate).toHaveBeenNthCalledWith(2, [200, 150, 200, 150, 200]);
  });

  it('buzzes a low alarm once at onset, and again only when it re-alarms', () => {
    const device = target();
    const engine = new HapticEngine(device);
    const low = { id: 'temp-low', priority: 'low' as const };
    engine.alarm(low, 0);
    engine.alarm(low, 5000);
    engine.alarm(null, 6000);
    engine.alarm(low, 7000);
    expect(device.vibrate.mock.calls.filter(([pattern]) => Array.isArray(pattern))).toHaveLength(2);
  });

  it('stops at once on silence or pause, and re-arms for the next alarm', () => {
    const device = target();
    const engine = new HapticEngine(device);
    engine.alarm(high, 0);
    engine.alarm(null, 500);
    expect(device.vibrate).toHaveBeenLastCalledWith(0);
    engine.alarm(high, 600);
    expect(device.vibrate).toHaveBeenLastCalledWith([200, 150, 200, 150, 200]);
  });

  it('does nothing, and says it can do nothing, where there is no vibration interface', () => {
    expect(hapticsSupported(undefined)).toBe(false);
    expect(hapticsSupported({})).toBe(false);
    expect(() => new HapticEngine({}).alarm(high, 0)).not.toThrow();
  });
});

describe('vibration is never the only channel', () => {
  it('pairs every haptic pattern with the visual alarm it repeats', () => {
    for (const priority of Object.keys(HAPTIC_PATTERNS)) {
      const event = `haptic-alarm-${priority}`;
      expect(AUDIO_EVENTS).toContain(event);
      expect(AUDIO_VISUAL_PAIRS.find((pair) => pair.audioEvent === event)?.visualLocation).toContain('AlarmRail');
    }
  });
});
