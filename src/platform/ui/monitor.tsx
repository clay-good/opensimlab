/**
 * The monitor components: VitalTile, WaveformCanvas, PlotCanvas, AlarmRail,
 * LogList and LogEntry.
 *
 * They are platform components: they know about traces, alarms and logs, but not
 * about anaesthesia. The module supplies the data.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SweepRenderer, type QualityLevel, type TrackConfig } from '@platform/render/sweep-renderer';
import { rendererColors } from '@platform/render/renderer-colors';
import { FrameBudgetRecorder } from '@platform/render/frame-budget';
import { formatElapsed } from '@platform/clock/simulation-clock';
import { SEVERITY_GLYPH, SEVERITY_LABEL, type Severity } from '@platform/log/event-log';
import type { EngineEvent } from '@platform/kernel/protocol';
import { Badge } from './index';

// --- VitalTile ------------------------------------------------------------

export interface VitalTileProps {
  readonly name: string;
  /** Null when the parameter cannot be measured; the tile then shows `--`. */
  readonly value: number | null;
  readonly unit: string;
  readonly precision: number;
  /** The CSS variable name of this parameter's trace hue, for example `--ecg`. */
  readonly traceToken: string;
  readonly lowLimit?: number;
  readonly highLimit?: number;
  readonly alarm?: 'critical' | 'warning' | 'advisory' | null;
  /**
   * Why the value cannot be measured. Shown INSTEAD of a stale number, and only
   * when the parameter is genuinely unmeasurable — not merely absent because the
   * scenario has not started.
   */
  readonly invalidReason?: string;
  /** True while a sensor artifact corrupts this reading. */
  readonly artifact?: boolean;
  /** Shown next to the value where a model drives it. */
  readonly confidence?: { label: string; kind: 'default' | 'out-of-range' | 'teaching' };
  readonly onOpenWhy?: () => void;
  /**
   * False while there is simply no reading yet — before the scenario starts —
   * so the tile shows a blank rather than asserting a clinical reason that is
   * not the reason.
   */
  readonly reasonApplies?: boolean;
}

/**
 * The signature component. Its layout is identical across every parameter, so a
 * learner's eye learns one shape, and an alarm changes the treatment without
 * moving anything.
 */
export function VitalTile({
  name, value, unit, precision, traceToken, lowLimit, highLimit,
  alarm, invalidReason, artifact, confidence, onOpenWhy, reasonApplies = true,
}: VitalTileProps) {
  const invalid = value === null;
  const limits = [
    lowLimit !== undefined ? `↓${lowLimit}` : null,
    highLimit !== undefined ? `↑${highLimit}` : null,
  ].filter(Boolean).join('  ');

  return (
    <div className="vital-tile" data-alarm={alarm ?? undefined}>
      <div className="vital-tile__label-row">
        <span>{name}</span>
        {alarm && <span className="vital-tile__alarm-word">{alarm === 'critical' ? 'HIGH PRIORITY' : alarm === 'warning' ? 'MEDIUM' : 'LOW'}</span>}
        {artifact && <span className="vital-tile__alarm-word">ARTIFACT</span>}
      </div>
      <div className="vital-tile__value-row">
        {onOpenWhy ? (
          <button
            type="button"
            className="vital-tile__value"
            data-invalid={invalid}
            style={{ color: invalid ? undefined : `var(${traceToken})`, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
            onClick={onOpenWhy}
            aria-label={`${name}: ${invalid ? 'unavailable' : `${value.toFixed(precision)} ${unit}`}. Explain why.`}
          >
            {invalid ? '--' : value.toFixed(precision)}
          </button>
        ) : (
          <span
            className="vital-tile__value"
            data-invalid={invalid}
            style={invalid ? undefined : { color: `var(${traceToken})` }}
          >
            {invalid ? '--' : value.toFixed(precision)}
          </span>
        )}
        <span className="vital-tile__unit">{unit}</span>
        {confidence && <Badge kind={confidence.kind}>{confidence.label}</Badge>}
      </div>
      {invalid && invalidReason && reasonApplies
        ? <span className="vital-tile__reason">{invalidReason}</span>
        : <span className="vital-tile__limits">{limits || ' '}</span>}
    </div>
  );
}

// --- WaveformCanvas ---------------------------------------------------------

export interface WaveformCanvasProps {
  readonly tracks: readonly TrackConfig[];
  /** Sample blocks to push, keyed by track id. Replaced each tick. */
  readonly blocks: readonly { trackId: string; samples: Float32Array }[];
  readonly reducedMotion: boolean;
  readonly height: number | 'fill';
  /** Called with each measured frame time, for the budget harness. */
  readonly onFrame?: (durationMs: number) => void;
  readonly quality?: QualityLevel;
}

/**
 * Draws only from the sample buffer, never synthesizing physiology, and scales
 * its backing store to the device pixel ratio so traces are crisp rather than
 * blurred (cockpit/patient-monitor → Canvas is resolution-aware).
 */
export function WaveformCanvas({
  tracks, blocks, reducedMotion, height, onFrame, quality,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SweepRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  // The track array is read through a ref so the effects below can depend on the
  // signature — what the configuration IS — rather than on the array's identity,
  // which changes on every render of the parent.
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  // The renderer is created ONCE and then mutated in place. Re-creating it on a
  // prop change would clear the canvas and discard the pending samples, and since
  // the cockpit re-renders on every emitted state that would erase the traces
  // faster than they could ever be drawn.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const renderer = new SweepRenderer(canvas, rendererColors());
    rendererRef.current = renderer;

    const loop = (time: number) => {
      const elapsed = lastTimeRef.current === 0 ? 16.7 : time - lastTimeRef.current;
      lastTimeRef.current = time;
      const started = performance.now();
      renderer.render(time, elapsed);
      onFrameRef.current?.(performance.now() - started);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameRef.current);
      lastTimeRef.current = 0;
      rendererRef.current = null;
    };
  }, []);

  // Track configuration, applied in place. `setTracks` restarts the sweep, so it
  // runs only when the configuration genuinely differs, not on every render.
  const trackSignature = JSON.stringify(tracks);
  useLayoutEffect(() => {
    // The signature, not the array identity, decides whether the sweep restarts.
    rendererRef.current?.setTracks(tracksRef.current);
  }, [trackSignature]);

  useLayoutEffect(() => {
    rendererRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useLayoutEffect(() => {
    if (quality !== undefined) rendererRef.current?.setQuality(quality);
  }, [quality]);

  // Sizing follows the element, so a reflow or a rotation re-scales the backing
  // store to the device pixel ratio rather than stretching stale pixels.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return undefined;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      // `fill` measures the box instead of asserting a number, so the trace grows
      // with the window and the renderer's backing store follows it.
      const measured = height === 'fill' ? (rect?.height ?? 320) : height;
      renderer.resize(rect?.width ?? 600, Math.max(measured, 80), window.devicePixelRatio || 1);
      renderer.setTracks(tracksRef.current);
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [height, trackSignature]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    for (const block of blocks) renderer.push(block.trackId, block.samples);
  }, [blocks]);

  return (
    // The canvas is absolutely positioned so its own size can NEVER feed back
    // into the box being measured. With it in flow, the renderer set an explicit
    // canvas height from the wrapper's height, which grew the wrapper, which the
    // observer measured, which grew the canvas — the traces ran 170 px past the
    // bottom of the monitor region and pushed the action tray off the screen.
    <div
      className="waveform-canvas"
      style={{ position: 'relative', inlineSize: '100%', blockSize: height === 'fill' ? '100%' : height }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0 }}
        role="img"
        aria-label="Physiological waveforms. A text description is available below."
      />
    </div>
  );
}

/** A frame-budget recorder hook, so a route can measure without wiring plumbing. */
export function useFrameBudget(): { recorder: FrameBudgetRecorder; onFrame: (ms: number) => void } {
  const recorderRef = useRef(new FrameBudgetRecorder());
  useEffect(() => {
    const stop = recorderRef.current.observeLongTasks();
    return stop;
  }, []);
  return {
    recorder: recorderRef.current,
    onFrame: (ms: number) => recorderRef.current.recordFrame(ms),
  };
}

// --- PlotCanvas -------------------------------------------------------------

export interface PlotSeries {
  readonly id: string;
  readonly label: string;
  readonly colorToken: string;
  readonly dashed?: boolean;
  /** [x, y] pairs. X is simulated seconds. */
  readonly points: readonly [number, number][];
  readonly unit: string;
}

export interface PlotCanvasProps {
  readonly series: readonly PlotSeries[];
  readonly height: number;
  /** Cursor position in simulated seconds, for keyboard inspection. */
  readonly cursorSeconds?: number | null;
  readonly xMax: number;
  readonly yMax: number;
}

export function PlotCanvas({ series, height, cursorSeconds, xMax, yMax }: PlotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(600);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      setWidth(rect?.width ?? 600);
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = rendererColors();
    context.fillStyle = colors.background;
    context.fillRect(0, 0, width, height);

    const padding = { left: 40, right: 8, top: 8, bottom: 20 };
    const plotWidth = Math.max(width - padding.left - padding.right, 1);
    const plotHeight = Math.max(height - padding.top - padding.bottom, 1);
    const toX = (seconds: number) => padding.left + (seconds / Math.max(xMax, 1)) * plotWidth;
    const toY = (value: number) => padding.top + plotHeight - (value / Math.max(yMax, 1e-6)) * plotHeight;

    context.strokeStyle = colors.gridColor;
    context.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = padding.top + (plotHeight * i) / 4;
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(width - padding.right, y);
      context.stroke();
    }

    for (const line of series) {
      if (line.points.length < 2) continue;
      const resolved = getComputedStyle(document.documentElement).getPropertyValue(line.colorToken).trim();
      context.strokeStyle = resolved || colors.gridColor;
      context.lineWidth = 1.5;
      context.setLineDash(line.dashed ? [5, 4] : []);
      context.beginPath();
      line.points.forEach(([x, y], index) => {
        const px = toX(x);
        const py = toY(y);
        if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
      });
      context.stroke();
    }
    context.setLineDash([]);

    if (cursorSeconds !== null && cursorSeconds !== undefined) {
      context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--focus').trim() || colors.gridColor;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(toX(cursorSeconds), padding.top);
      context.lineTo(toX(cursorSeconds), padding.top + plotHeight);
      context.stroke();
    }
  }, [series, width, height, cursorSeconds, xMax, yMax]);

  return (
    <div style={{ position: 'relative', inlineSize: '100%', blockSize: height }}>
      <canvas ref={canvasRef} role="img" aria-label="Concentration plot. Use the arrow keys to read values." />
    </div>
  );
}

// --- AlarmRail --------------------------------------------------------------

export interface AlarmRailItem {
  readonly id: string;
  readonly priority: 'critical' | 'warning' | 'advisory';
  readonly message: string;
  readonly silencedUntilTick: number | null;
}

export function AlarmRail({ alarms, tick, onSilence }: {
  alarms: readonly AlarmRailItem[]; tick: number; onSilence: (id: string) => void;
}) {
  return (
    <div className="alarm-rail" data-active={alarms.length > 0} role="region" aria-label="Active alarms">
      {alarms.map((alarm) => {
        const remaining = alarm.silencedUntilTick !== null
          ? Math.max(Math.ceil((alarm.silencedUntilTick - tick) / 10), 0)
          : null;
        return (
          <div key={alarm.id} className="alarm-rail__item" data-priority={alarm.priority}>
            <span className="alarm-rail__priority-word">
              {alarm.priority === 'critical' ? 'High' : alarm.priority === 'warning' ? 'Medium' : 'Low'}
            </span>
            <span>{alarm.message}</span>
            {remaining !== null
              ? <span className="alarm-rail__priority-word">silenced {remaining}s</span>
              : (
                <button type="button" className="button button--ghost button--compact" onClick={() => onSilence(alarm.id)}>
                  Silence
                </button>
              )}
          </div>
        );
      })}
    </div>
  );
}

// --- LogList and LogEntry ----------------------------------------------------

export function LogList({ entries, onSelect, selectedTick }: {
  entries: readonly EngineEvent[]; onSelect?: (tick: number) => void; selectedTick?: number | null;
}) {
  if (entries.length === 0) {
    return <div className="empty-state"><span className="empty-state__title">Nothing logged yet</span></div>;
  }
  return (
    <ul className="log-list" aria-label="Event log">
      {entries.map((entry) => (
        <li key={`${entry.tick}-${entry.eventId}`}>
          <LogEntryRow entry={entry} onSelect={onSelect} selected={selectedTick === entry.tick} />
        </li>
      ))}
    </ul>
  );
}

export function LogEntryRow({ entry, onSelect, selected }: {
  entry: EngineEvent; onSelect?: (tick: number) => void; selected?: boolean;
}) {
  const severity = entry.severity as Severity;
  return (
    <button
      type="button"
      className="log-entry"
      data-severity={severity}
      aria-current={selected ? 'true' : undefined}
      onClick={() => onSelect?.(entry.tick)}
    >
      <span className="log-entry__time">{formatElapsed(entry.tick)}</span>
      <span className="log-entry__glyph" aria-hidden="true">{SEVERITY_GLYPH[severity]}</span>
      <span>
        <span className="visually-hidden">{SEVERITY_LABEL[severity]}: </span>
        {entry.message}
      </span>
    </button>
  );
}
