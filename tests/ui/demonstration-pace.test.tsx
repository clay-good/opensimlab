/**
 * @vitest-environment jsdom
 *
 * Reading pace.
 *
 * The beats of a demonstration are spaced by the physiology they narrate, and
 * the viewer is doing something the physiology knows nothing about: reading. At
 * five times speed the induction script put a sixty-eight character line one
 * real second before the next beat and a four-hundred character line two
 * seconds before it, and the observed examples ran a "watch this climb" beat at
 * sixty times speed, which is about a second. Both were unreadable at exactly
 * the moments they existed to teach.
 *
 * What is asserted here is the rule that fixed it: a beat holds the clock for
 * as long as its own narration takes to read, minus whatever reading time its
 * gap already provides, and nothing is held that was already unhurried.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LearnerAction } from '@platform/kernel/protocol';
import { useDemonstration } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration, type ObservedStep } from '@anesthesia/demo/useObservedDemonstration';
import {
  INDUCTION_DEMONSTRATION, MINIMUM_NARRATION_SECONDS, NARRATION_CHARS_PER_SECOND,
  PREPARING_NARRATION, narrationHoldMs, narrationSeconds, setNarrationPace,
} from '@anesthesia/demo/demonstration';

describe('how long a beat needs', () => {
  it('reads at a pace nobody has to hurry to keep up with', () => {
    // 155 words a minute for prose the viewer has never seen, while also
    // looking at a monitor. A faster figure would be a reading test.
    expect(NARRATION_CHARS_PER_SECOND).toBeLessThanOrEqual(15);
    expect(narrationSeconds('x'.repeat(260))).toBeCloseTo(20, 5);
  });

  it('never flashes a short line past the viewer', () => {
    expect(narrationSeconds('Oxygen to 100%.')).toBe(MINIMUM_NARRATION_SECONDS);
  });

  it('holds only the reading time the schedule does not already give', () => {
    expect(narrationHoldMs('x'.repeat(130), 0)).toBe(10_000);
    expect(narrationHoldMs('x'.repeat(130), 4)).toBe(6_000);
    expect(narrationHoldMs('x'.repeat(130), 10)).toBe(0);
    expect(narrationHoldMs('x'.repeat(130), 99)).toBe(0);
  });

  it('holds nothing at all for a caller that drives the clock itself', () => {
    try {
      setNarrationPace('instant');
      expect(narrationHoldMs('x'.repeat(400), 0)).toBe(0);
    } finally {
      setNarrationPace('read');
    }
  });
});

/**
 * The whole script, at the speed the front door sets.
 *
 * The front door promises three minutes. That promise is kept by this sum
 * rather than by the script's last timestamp, which is simulated seconds and
 * says nothing about how long anyone spends watching.
 */
describe('the induction demonstration, timed as a viewer experiences it', () => {
  const SPEED = 5;
  const onScreenSeconds = INDUCTION_DEMONSTRATION.map((beat, index) => {
    const next = INDUCTION_DEMONSTRATION[index + 1];
    const gap = next ? (next.atSecond - beat.atSecond) / SPEED : 0;
    return next ? Math.max(gap, narrationSeconds(beat.narration)) : narrationSeconds(beat.narration);
  });

  it('gives every beat enough time to be read', () => {
    for (const [index, beat] of INDUCTION_DEMONSTRATION.entries()) {
      expect(onScreenSeconds[index], `beat at ${beat.atSecond}s`)
        .toBeGreaterThanOrEqual(narrationSeconds(beat.narration));
    }
  });

  it('still fits the three minutes the front door promises', () => {
    const total = onScreenSeconds.reduce((sum, seconds) => sum + seconds, 0);
    expect(total).toBeLessThanOrEqual(180);
    // And it is not so short that the promise is the wrong one.
    expect(total).toBeGreaterThan(120);
  });
});

describe('the clock waits for the reader', () => {
  let container: HTMLDivElement;
  let root: Root;
  let paused: number;
  let played: number;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    paused = 0;
    played = 0;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    setNarrationPace('read');
  });

  describe('driving the scripted induction', () => {
    let advance: (() => void) | undefined;
    let finished: number;

    function Harness({ second, active = true }: { readonly second: number; readonly active?: boolean }) {
      const demonstration = useDemonstration({
        active,
        tick: Math.round(second * TICKS_PER_SECOND),
        act: () => {},
        pause: () => { paused += 1; },
        play: () => { played += 1; },
        speed: 5,
        onFinished: () => { finished += 1; },
      });
      advance = demonstration.onAdvance;
      return null;
    }

    beforeEach(() => { advance = undefined; finished = 0; });

    const show = (second: number, active = true) =>
      act(() => { root.render(createElement(Harness, { second, active })); });

    it('stops on the opening beat, which has two seconds of gap and eight of words', () => {
      show(0);
      expect(paused).toBe(1);
      expect(played).toBe(0);
      // Eight seconds of reading, less the two the gap provides.
      act(() => { vi.advanceTimersByTime(5_000); });
      expect(played).toBe(0);
      act(() => { vi.advanceTimersByTime(2_000); });
      expect(played).toBe(1);
    });

    it('lets a viewer who reads faster than that get on with it', () => {
      show(0);
      expect(advance).toBeTypeOf('function');
      act(() => { advance!(); });
      expect(played).toBe(1);
      // And the timer it replaced does not then play a second time.
      act(() => { vi.advanceTimersByTime(30_000); });
      expect(played).toBe(1);
    });

    it('does not stop at a beat the schedule already leaves time for', () => {
      show(0);
      act(() => { vi.advanceTimersByTime(10_000); });
      const before = paused;
      // The oxygen beat has 21.6 real seconds before the next one and needs 10.
      show(12);
      expect(paused).toBe(before);
      expect(advance).toBeUndefined();
    });

    it('holds nothing when the caller drives the clock itself', () => {
      setNarrationPace('instant');
      show(0);
      expect(paused).toBe(0);
      expect(advance).toBeUndefined();
      show(220);
      expect(paused).toBe(0);
    });

    it('hands the controls back at the closing beat rather than holding the clock', () => {
      // The ending is held by the cockpit, which keeps the strip on screen while
      // the clock is already stopped. The script itself is over.
      setNarrationPace('instant');
      show(0);
      show(INDUCTION_DEMONSTRATION[INDUCTION_DEMONSTRATION.length - 1]!.atSecond + 1);
      expect(finished).toBe(1);
    });

    it('forgets a hold when the viewer takes the controls', () => {
      show(0);
      expect(paused).toBe(1);
      show(0, false);
      act(() => { vi.advanceTimersByTime(30_000); });
      expect(played).toBe(0);
      expect(advance).toBeUndefined();
    });
  });

  describe('driving an observed example', () => {
    let step: ObservedStep;
    let advance: (() => void) | undefined;
    let performed: Omit<LearnerAction, 'tick'>[];

    function Harness({ current, running = true }: { readonly current: ObservedStep; readonly running?: boolean }) {
      const demonstration = useObservedDemonstration({
        active: true,
        running,
        step: current,
        actionType: 'lesson-response',
        act: (action) => { performed.push(action); },
        pause: () => { paused += 1; },
        play: () => { played += 1; },
        onFinished: () => {},
      });
      advance = demonstration.onAdvance;
      return null;
    }

    beforeEach(() => {
      advance = undefined;
      performed = [];
      step = { id: 'watching', narration: 'x'.repeat(130), focus: 'monitor', progress: 0.2 };
    });

    const show = (current: ObservedStep, running = true) =>
      act(() => { root.render(createElement(Harness, { current, running })); });

    it('stops the clock on a beat with nothing to click, then runs on', () => {
      show(step);
      expect(paused).toBe(1);
      act(() => { vi.advanceTimersByTime(9_000); });
      expect(played).toBe(0);
      act(() => { vi.advanceTimersByTime(1_500); });
      expect(played).toBe(1);
    });

    it('does not offer Continue for a beat that has nothing to continue', () => {
      show(step);
      expect(advance).toBeUndefined();
    });

    it('waits on the viewer, not a timer, at a beat that acts', () => {
      show({ ...step, id: 'decision', action: 'declare-something' });
      expect(paused).toBe(1);
      act(() => { vi.advanceTimersByTime(60_000); });
      expect(played).toBe(0);
      expect(advance).toBeTypeOf('function');
      act(() => { advance!(); });
      expect(performed).toEqual([{ type: 'lesson-response', payload: { action: 'declare-something' } }]);
      expect(played).toBe(1);
    });

    it('never holds the preparing beat, which is waiting for its first snapshot', () => {
      show({ id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 });
      expect(paused).toBe(0);
      act(() => { vi.advanceTimersByTime(30_000); });
      expect(played).toBe(0);
    });

    it('holds each beat once, however often the snapshot is refreshed', () => {
      show(step);
      show({ ...step, progress: 0.25 });
      show({ ...step, progress: 0.3 });
      expect(paused).toBe(1);
      act(() => { vi.advanceTimersByTime(11_000); });
      expect(played).toBe(1);
    });
  });
});
