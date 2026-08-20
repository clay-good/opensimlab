/**
 * @vitest-environment jsdom
 *
 * The regression net for the thing the whole product is sequenced around: the
 * traces have to actually appear on the canvas, and they have to keep appearing
 * while the cockpit re-renders on every emitted state.
 *
 * This is the failure the specification's first task exists to prevent
 * (cockpit/patient-monitor → Sweeping Waveform Canvas). It is easy to write a
 * correct sweep renderer and then hand it a new configuration identity sixty
 * times a second, which clears the canvas before a single column is drawn.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import { WaveformCanvas } from '@platform/ui/monitor';
import { trackConfigs } from '@anesthesia/ui/tracks';
import { SAMPLE_RATE_HZ } from '@anesthesia/waveforms/types';

/** Every stroke the component asks the canvas to make, in order. */
interface Recorded { strokeStyles: string[]; clears: number }

function installCanvasStub(): Recorded {
  const recorded: Recorded = { strokeStyles: [], clears: 0 };
  // jsdom has no 2D context, so one is supplied that records what it is asked to
  // draw. The assertions are about the calls, not about pixels.
  const make = () => {
    const context = {
      _stroke: '#000',
      get strokeStyle() { return context._stroke; },
      set strokeStyle(value: string) { context._stroke = value; },
      fillStyle: '#000',
      lineWidth: 1,
      globalAlpha: 1,
      setTransform: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      setLineDash: () => {},
      clip: () => {},
      rect: () => {},
      fillRect: (_x: number, _y: number, w: number, h: number) => {
        if (w > 100 && h > 100) recorded.clears += 1;
      },
      stroke: () => { recorded.strokeStyles.push(context._stroke); },
    };
    return context as unknown as CanvasRenderingContext2D;
  };
  HTMLCanvasElement.prototype.getContext = make as unknown as HTMLCanvasElement['getContext'];
  return recorded;
}

/** A manual animation-frame clock, so the test drives the loop deterministically. */
function installFrameClock() {
  let callbacks: FrameRequestCallback[] = [];
  let now = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    callbacks.push(cb);
    return callbacks.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  return {
    /** Advance one frame of `ms` simulated milliseconds. */
    tick(ms: number) {
      now += ms;
      const due = callbacks;
      callbacks = [];
      for (const cb of due) cb(now);
    },
  };
}

/** One second of a plainly non-flat signal for every track. */
function blocksOf(scale: number) {
  return (['ecg', 'arterial', 'capno', 'pleth'] as const).map((signal) => {
    const rate = SAMPLE_RATE_HZ[signal];
    const samples = new Float32Array(rate);
    for (let i = 0; i < rate; i += 1) samples[i] = Math.sin((i / rate) * Math.PI * 2) * scale;
    return { trackId: signal, samples };
  });
}

describe('Requirement: Sweeping Waveform Canvas', () => {
  let container: HTMLDivElement;
  let root: Root;
  let recorded: Recorded;
  let clock: ReturnType<typeof installFrameClock>;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    recorded = installCanvasStub();
    clock = installFrameClock();
    vi.stubGlobal('ResizeObserver', class {
      observe() {} unobserve() {} disconnect() {}
    });
    // jsdom reports a zero-size box; the renderer needs a real one.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 600, height: 320, top: 0, left: 0, right: 600, bottom: 320, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const render = (blocks: ReturnType<typeof blocksOf>) => {
    // Fresh identities every time, exactly as a re-rendering parent produces.
    act(() => {
      root.render(createElement(WaveformCanvas, {
        tracks: trackConfigs(false, new Set<string>(), false),
        blocks,
        reducedMotion: false,
        height: 320,
      }));
    });
  };

  it('Scenario: pushed samples are drawn in the trace colours', () => {
    render(blocksOf(1));
    // Several frames: the slowest-sampled trace consumes a quarter of a sample
    // per column, so one frame is not enough to see every track draw.
    for (let i = 0; i < 20; i += 1) act(() => clock.tick(16));

    const traceColors = new Set(trackConfigs(false, new Set<string>(), false).map((t) => t.color));
    const drawn = recorded.strokeStyles.filter((style) => traceColors.has(style));
    expect(drawn.length).toBeGreaterThan(0);
    // Every configured track drew, not just the first.
    expect(new Set(drawn).size).toBe(traceColors.size);
  });

  it('Scenario: a re-rendering parent does not erase the traces', () => {
    // The failure mode: the cockpit re-renders on every emitted state, handing
    // the canvas a fresh `tracks` array and a fresh `blocks` array each time. If
    // that rebuilds the renderer, the sweep restarts and nothing is ever seen.
    render(blocksOf(1));
    act(() => clock.tick(100));
    const clearsAfterFirstFrame = recorded.clears;

    for (let i = 0; i < 30; i += 1) {
      render(blocksOf(1 + i * 0.01));
      act(() => clock.tick(16));
    }

    const traceColors = new Set(trackConfigs(false, new Set<string>(), false).map((t) => t.color));
    const drawnAfter = recorded.strokeStyles.filter((style) => traceColors.has(style)).length;
    expect(drawnAfter).toBeGreaterThan(0);
    // A full-canvas clear happens on setup and on a genuine configuration change.
    // Thirty re-renders with identical configuration must add none.
    expect(recorded.clears).toBe(clearsAfterFirstFrame);
  });
});
