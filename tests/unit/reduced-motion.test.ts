/**
 * Reduced motion has to change what moves, not just be declared.
 *
 * A headless-Chrome check on 2026-09-25 measured it end to end: over two
 * seconds the landing ECG painted 40 distinct frames with no preference and 1
 * with `reduce`, and the cockpit sweep painted 40 and 9. These tests hold the
 * sweep's mechanism; tests/ui/landing-reduced-motion.test.tsx holds the hero's.
 */
import { describe, expect, it, vi } from 'vitest';
import { PIXELS_PER_SECOND, SweepRenderer } from '@platform/render/sweep-renderer';

function renderer(): SweepRenderer {
  const context = new Proxy({}, { get: () => () => undefined }) as unknown as CanvasRenderingContext2D;
  const canvas = { getContext: () => context, style: {} } as unknown as HTMLCanvasElement;
  return new SweepRenderer(canvas, { background: '#000', gridColor: '#111', artifactHatch: '#222' });
}

/** Paint calls over one second of 60 Hz frames. */
function paintsPerSecond(reduced: boolean): number[] {
  const sweep = renderer();
  sweep.setReducedMotion(reduced);
  const paint = vi.spyOn(sweep as unknown as { paintColumns(columns: number): void }, 'paintColumns');
  for (let frame = 1; frame <= 60; frame += 1) sweep.render(frame * (1000 / 60), 1000 / 60);
  return paint.mock.calls.map(([columns]) => columns);
}

describe('Requirement: reduced motion replaces continuous movement', () => {
  it('sweeps continuously with no preference, painting on every frame', () => {
    expect(paintsPerSecond(false)).toHaveLength(60);
  });

  it('steps at 4 Hz under reduced motion, carrying the same data in quarter-second blocks', () => {
    const calls = paintsPerSecond(true);
    expect(calls).toHaveLength(4);
    for (const columns of calls) expect(columns).toBeGreaterThanOrEqual(PIXELS_PER_SECOND / 4);
    // Nothing is dropped: the four blocks cover the same second of trace.
    expect(calls.reduce((total, columns) => total + columns, 0)).toBeCloseTo(PIXELS_PER_SECOND, 6);
  });
});
