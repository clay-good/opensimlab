/** @vitest-environment jsdom */
/**
 * The transcript scrubber (learning/facilitation → bookmarks and scrubbing).
 *
 * The two properties that matter are the ones a mouse-only check would miss:
 * it is operable from the keyboard, and what it selects is announced rather
 * than only drawn. A range input gives the first for free, which is why one is
 * used rather than a custom control — so the test's job is to prove it really
 * is a range input over the recorded ticks, and that the announcement follows.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { HistorySample } from '@platform/session/session-store';
import {
  sampleAt, scrubbedSummary, TranscriptScrubber,
} from '@anesthesia/ui/TranscriptScrubber';

const sample = (tick: number, state: Record<string, number>): HistorySample =>
  ({ tick, state, concentrations: [] });

const history: readonly HistorySample[] = [
  sample(0, { heartRateBpm: 70, meanArterialMmHg: 90, spo2Percent: 98 }),
  sample(600, { heartRateBpm: 112, meanArterialMmHg: 54, spo2Percent: 88 }),
  sample(1200, { heartRateBpm: 88, meanArterialMmHg: 76, spo2Percent: 96 }),
];

const render = (tick: number, samples: readonly HistorySample[] = history) =>
  renderToStaticMarkup(createElement(TranscriptScrubber, {
    history: samples, tick, onTick: () => {},
  }));

describe('the transcript scrubber', () => {
  it('is a range input over the recorded ticks, so the keyboard drives it', () => {
    const markup = render(600);
    expect(markup).toContain('type="range"');
    expect(markup).toContain('min="0"');
    expect(markup).toContain('max="1200"');
    expect(markup).toContain('value="600"');
    // Labelled, because a slider announced as "slider" and nothing else is not
    // operable by someone who cannot see what it sits under.
    expect(markup).toContain('for="transcript-scrubber"');
    expect(markup).toContain('id="transcript-scrubber"');
  });

  it('announces the selected moment politely, not assertively', () => {
    const markup = render(600);
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain('heart rate 112');
  });

  it('reads the latest sample at or before the tick, never the next one', () => {
    expect(sampleAt(history, 0)?.tick).toBe(0);
    expect(sampleAt(history, 599)?.tick).toBe(0);
    expect(sampleAt(history, 600)?.tick).toBe(600);
    expect(sampleAt(history, 5000)?.tick).toBe(1200);
    // Before the first recorded tick it shows the first, rather than nothing.
    expect(sampleAt(history, -10)?.tick).toBe(0);
  });

  it('says the moment and only the parameters the sample actually has', () => {
    expect(scrubbedSummary(history, 600))
      .toBe('At 00:01:00: heart rate 112, mean arterial pressure 54, oxygen saturation 88.');
    const sparse = [sample(0, { heartRateBpm: 70 })];
    expect(scrubbedSummary(sparse, 0)).toBe('At 00:00:00: heart rate 70.');
    const none = [sample(0, {})];
    expect(scrubbedSummary(none, 0)).toContain('recorded no numbers');
  });

  it('ignores a value the run did not really record', () => {
    const broken = [sample(0, { heartRateBpm: Number.NaN, spo2Percent: 97 })];
    expect(scrubbedSummary(broken, 0)).toBe('At 00:00:00: oxygen saturation 97.');
  });

  /** A run with nothing in it, or one tick long, has nothing to move through. */
  it('renders nothing rather than a dead control', () => {
    expect(render(0, [])).toBe('');
    expect(render(0, [sample(0, { heartRateBpm: 70 })])).toBe('');
  });

  it('clamps a cursor outside the run to the run', () => {
    expect(render(99_999)).toContain('value="1200"');
    expect(render(-5)).toContain('value="0"');
  });
});
