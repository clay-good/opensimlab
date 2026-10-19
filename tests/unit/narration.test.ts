import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_NARRATION_SETTINGS, NarrationEngine, isNarrationSettings,
  type NarrationSettings, type SpeechTarget, type UtteranceLike,
} from '@platform/audio/narration';

function harness(settings: Partial<NarrationSettings> = {}) {
  const spoken: UtteranceLike[] = [];
  const target = {
    speak: (utterance: UtteranceLike) => { spoken.push(utterance); },
    cancel: vi.fn<() => void>(), pause: vi.fn<() => void>(), resume: vi.fn<() => void>(),
  } satisfies SpeechTarget;
  const engine = new NarrationEngine(target, (text) => ({ text, rate: 1, voice: null, onend: null }),
    { ...DEFAULT_NARRATION_SETTINGS, enabled: true, ...settings });
  return { engine, target, spoken };
}

describe('spoken narration', () => {
  it('says nothing while off, which is the default', () => {
    const spoken: UtteranceLike[] = [];
    const engine = new NarrationEngine({ speak: (u) => spoken.push(u), cancel: () => {}, pause: () => {}, resume: () => {} },
      (text) => ({ text, rate: 1, voice: null, onend: null }));
    engine.speak('alarm', 'SpO2 low', 'high');
    expect(spoken).toEqual([]);
    expect(DEFAULT_NARRATION_SETTINGS.enabled).toBe(false);
  });

  it('replaces a worked-example beat with the next one, but never cuts off a tutor prompt for a beat', () => {
    const { engine, target, spoken } = harness();
    engine.speak('beat', 'First, call for help.');
    engine.speak('beat', 'Now check the circuit.');
    expect(target.cancel).toHaveBeenCalledTimes(1);
    engine.speak('tutor', 'Consider the airway.');
    engine.speak('beat', 'Next beat.');
    expect(target.cancel).toHaveBeenCalledTimes(1);
    expect(spoken.map((u) => u.text)).toEqual(['First, call for help.', 'Now check the circuit.',
      'Consider the airway.', 'Next beat.']);
  });

  it('lets a high-priority alarm interrupt anything, and queues the rest', () => {
    const { engine, target } = harness();
    engine.speak('tutor', 'A tutor prompt.');
    engine.speak('alarm', 'Medium alarm.', 'normal');
    expect(target.cancel).not.toHaveBeenCalled();
    engine.speak('alarm', 'SpO2 critically low.', 'high');
    expect(target.cancel).toHaveBeenCalledTimes(1);
  });

  it('skips alarms and the summary for a screen-reader user, and respects each source toggle', () => {
    const { engine, spoken } = harness({ screenReader: true,
      sources: { beat: true, tutor: false, alarm: true, summary: true } });
    engine.speak('alarm', 'Alarm.', 'high');
    engine.speak('summary', 'Summary.');
    engine.speak('tutor', 'Tutor.');
    engine.speak('beat', 'Beat.');
    expect(spoken.map((u) => u.text)).toEqual(['Beat.']);
  });

  it('pauses and resumes with the clock, and holds new speech while paused', () => {
    const { engine, target } = harness();
    engine.pause();
    engine.pause();
    expect(target.pause).toHaveBeenCalledTimes(1);
    engine.speak('tutor', 'Queued while paused.');
    expect(target.pause).toHaveBeenCalledTimes(2);
    engine.resume();
    expect(target.resume).toHaveBeenCalledTimes(1);
  });

  it('applies the rate within 0.8x to 1.5x, ignores empty text, and stops when turned off', () => {
    const { engine, target, spoken } = harness({ rate: 1.25 });
    engine.speak('beat', '   ');
    engine.speak('beat', 'Line.');
    expect(spoken).toHaveLength(1);
    expect(spoken[0]!.rate).toBe(1.25);
    engine.configure({ ...DEFAULT_NARRATION_SETTINGS, enabled: false }, null);
    expect(target.cancel).toHaveBeenCalled();
  });

  it('does nothing where the platform has no speech interface', () => {
    const engine = new NarrationEngine(undefined, (text) => ({ text, rate: 1, voice: null, onend: null }),
      { ...DEFAULT_NARRATION_SETTINGS, enabled: true });
    expect(engine.allows('beat')).toBe(false);
    expect(() => engine.speak('beat', 'x')).not.toThrow();
  });

  it('validates stored settings rather than trusting them', () => {
    expect(isNarrationSettings(DEFAULT_NARRATION_SETTINGS)).toBe(true);
    expect(isNarrationSettings({ ...DEFAULT_NARRATION_SETTINGS, rate: 3 })).toBe(false);
    expect(isNarrationSettings({ ...DEFAULT_NARRATION_SETTINGS, sources: { beat: true } })).toBe(false);
    expect(isNarrationSettings('on')).toBe(false);
  });
});
