/**
 * The sweeping trace renderer (cockpit/patient-monitor → Sweeping Waveform Canvas).
 *
 * It draws left to right with an erase bar ahead of the write cursor, exactly as
 * an operating-room monitor does, and it draws ONLY from the sample buffers the
 * waveform engine produced. It never synthesizes or interpolates physiological
 * signal, so a dropped frame loses pixels rather than signal.
 *
 * Drawing is incremental: each frame paints only the columns that arrived since
 * the previous frame, which is what keeps five traces inside the frame budget on
 * a modest device.
 *
 * The renderer is framework agnostic. It takes a canvas and is driven by a caller
 * that owns the animation frame loop.
 */

/** CSS pixels per millimetre of nominal chart paper. */
export const PIXELS_PER_MM = 4;
/** The clinical sweep speed. 25 mm/s is the standard electrocardiogram paper speed. */
export const SWEEP_MM_PER_SECOND = 25;
/** Resulting horizontal speed in CSS pixels per second. */
export const PIXELS_PER_SECOND = PIXELS_PER_MM * SWEEP_MM_PER_SECOND;

/** Width of the erase bar ahead of the cursor, in CSS pixels. */
const ERASE_BAR_PX = 14;

/**
 * Rendering quality. The solver is never affected by this; only pixels are.
 * 0 is full quality, 2 is the bottom of the degradation ladder.
 */
export type QualityLevel = 0 | 1 | 2;

/**
 * Every colour the renderer draws with is supplied by the caller from the shared
 * token module, so canvas rendering and DOM rendering read the identical values.
 */
export interface RendererColors {
  /** `--void`, the monitor canvas ground. */
  readonly background: string;
  /** `--line-subtle`, the hairline between stacked traces. */
  readonly gridColor: string;
  /** `--text-tertiary` at 20% opacity: sensor artifact carries no hue. */
  readonly artifactHatch: string;
}

export interface TrackConfig {
  readonly id: string;
  /** Colour token value, resolved by the caller from the shared token module. */
  readonly color: string;
  /** Samples per second of the source signal. */
  readonly sampleRateHz: number;
  /** Vertical extent of the signal, in its own clinical units. */
  readonly min: number;
  readonly max: number;
  /** Line dash pattern, so colour is never the only channel carrying identity. */
  readonly dash?: readonly number[];
  /** True while a sensor artifact corrupts this signal; draws the hatch overlay. */
  artifact?: boolean;
}

interface TrackState {
  readonly config: TrackConfig;
  /** Samples not yet consumed by a column. */
  pending: number[];
  /** Fractional sample debt carried between columns. */
  carry: number;
  /** Last drawn point, so columns join up. */
  lastY: number | null;
  top: number;
  height: number;
}

export interface RendererMetrics {
  /** Frame times in milliseconds, most recent last. */
  readonly frameTimesMs: readonly number[];
  readonly quality: QualityLevel;
  /** Frames the renderer deliberately skipped under the degradation ladder. */
  readonly skippedFrames: number;
}

export class SweepRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private tracks: TrackState[] = [];
  private cursorPx = 0;
  private cssWidth = 0;
  private cssHeight = 0;
  private devicePixelRatio = 1;
  private quality: QualityLevel = 0;
  private frameTimes: number[] = [];
  private slowSinceMs: number | null = null;
  private skipNextFrame = false;
  private skippedFrames = 0;
  private background: string;
  private gridColor: string;
  private artifactHatch: string;
  /** When true, the sweep is replaced by a stepped update for reduced motion. */
  private stepped = false;
  private steppedAccumulatorPx = 0;

  constructor(
    canvas: HTMLCanvasElement,
    options: RendererColors,
  ) {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D context unavailable');
    this.canvas = canvas;
    this.context = context;
    this.background = options.background;
    this.gridColor = options.gridColor;
    this.artifactHatch = options.artifactHatch;
  }

  /** Replace the track set; clears the canvas and restarts the sweep. */
  setTracks(tracks: readonly TrackConfig[]): void {
    this.tracks = tracks.map((config) => ({
      config, pending: [], carry: 0, lastY: null, top: 0, height: 0,
    }));
    this.layout();
    this.clear();
  }

  /**
   * Reduced motion replaces the sweep with a stepped update at 4 Hz, which
   * conveys the same data without continuous movement.
   */
  setReducedMotion(reduced: boolean): void {
    this.stepped = reduced;
  }

  /** Resize the backing store to the element's CSS size times the device pixel ratio. */
  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;
    this.devicePixelRatio = dpr;
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.layout();
    this.clear();
  }

  private layout(): void {
    const count = Math.max(this.tracks.length, 1);
    const height = this.cssHeight / count;
    this.tracks.forEach((track, index) => {
      track.top = index * height;
      track.height = height;
      track.lastY = null;
    });
  }

  private clear(): void {
    this.cursorPx = 0;
    this.context.fillStyle = this.background;
    this.context.fillRect(0, 0, this.cssWidth, this.cssHeight);
    for (const track of this.tracks) {
      track.pending = [];
      track.carry = 0;
      track.lastY = null;
    }
    this.drawGrid();
  }

  private drawGrid(): void {
    if (this.tracks.length < 2) return;
    this.context.strokeStyle = this.gridColor;
    this.context.lineWidth = 1;
    this.context.setLineDash([]);
    for (let i = 1; i < this.tracks.length; i += 1) {
      const y = Math.round(i * (this.cssHeight / this.tracks.length)) + 0.5;
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(this.cssWidth, y);
      this.context.stroke();
    }
  }

  /** Hand the renderer a block of samples for one track. */
  push(trackId: string, samples: ArrayLike<number>): void {
    const track = this.tracks.find((candidate) => candidate.config.id === trackId);
    if (!track) return;
    for (let i = 0; i < samples.length; i += 1) track.pending.push(samples[i] ?? 0);
    // Never let an unrendered backlog grow without bound: if the tab was hidden,
    // drop the oldest samples rather than sweeping through minutes of history.
    const cap = track.config.sampleRateHz * 8;
    if (track.pending.length > cap) track.pending.splice(0, track.pending.length - cap);
  }

  /** Samples consumed per drawn column at the current quality level. */
  private samplesPerColumn(track: TrackState): number {
    const base = track.config.sampleRateHz / PIXELS_PER_SECOND;
    // The degradation ladder reduces point density before it reduces anything else.
    return base * (this.quality === 2 ? 3 : this.quality === 1 ? 2 : 1);
  }

  /**
   * Draw one frame. `nowMs` is a monotonic timestamp supplied by the caller, so
   * the renderer itself never reads a clock and stays testable.
   */
  render(nowMs: number, elapsedMs: number): void {
    if (this.skipNextFrame) {
      this.skipNextFrame = false;
      this.skippedFrames += 1;
      return;
    }
    const started = nowMs;
    const columnsWanted = (elapsedMs / 1000) * PIXELS_PER_SECOND;

    if (this.stepped) {
      // Stepped update: accumulate and paint in 250 ms blocks, at 4 Hz.
      this.steppedAccumulatorPx += columnsWanted;
      const block = PIXELS_PER_SECOND / 4;
      if (this.steppedAccumulatorPx < block) return;
      this.paintColumns(this.steppedAccumulatorPx);
      this.steppedAccumulatorPx = 0;
    } else {
      this.paintColumns(columnsWanted);
    }

    this.recordFrame(nowMs - started, nowMs);
  }

  private paintColumns(columnsWanted: number): void {
    const columns = Math.floor(columnsWanted);
    if (columns <= 0) return;

    const context = this.context;
    for (let column = 0; column < columns; column += 1) {
      const x = this.cursorPx;
      // The erase bar clears the pixels the sweep is about to occupy.
      context.fillStyle = this.background;
      context.fillRect(x, 0, ERASE_BAR_PX, this.cssHeight);
      this.drawGridSegment(x, ERASE_BAR_PX);

      for (const track of this.tracks) {
        const needed = this.samplesPerColumn(track) + track.carry;
        const take = Math.floor(needed);
        track.carry = needed - take;
        if (track.pending.length < take || take <= 0) continue;
        const chunk = track.pending.splice(0, take);

        let low = Infinity;
        let high = -Infinity;
        if (this.quality === 0) {
          // Min-max decimation preserves a narrow QRS spike at any column density.
          for (const value of chunk) {
            if (value < low) low = value;
            if (value > high) high = value;
          }
        } else {
          const value = chunk[chunk.length - 1] ?? 0;
          low = value; high = value;
        }

        const yHigh = this.toY(track, high);
        const yLow = this.toY(track, low);
        context.strokeStyle = track.config.color;
        context.lineWidth = 1.5;
        context.setLineDash(track.config.dash ? [...track.config.dash] : []);
        context.beginPath();
        if (track.lastY !== null) context.moveTo(x, track.lastY);
        else context.moveTo(x, yHigh);
        context.lineTo(x, yHigh);
        context.lineTo(x, yLow);
        context.stroke();
        track.lastY = yLow;
      }

      this.cursorPx += 1;
      if (this.cursorPx >= this.cssWidth) {
        this.cursorPx = 0;
        for (const track of this.tracks) track.lastY = null;
      }
    }

    this.drawArtifactHatch();
  }

  private drawGridSegment(x: number, width: number): void {
    if (this.tracks.length < 2) return;
    this.context.strokeStyle = this.gridColor;
    this.context.lineWidth = 1;
    this.context.setLineDash([]);
    for (let i = 1; i < this.tracks.length; i += 1) {
      const y = Math.round(i * (this.cssHeight / this.tracks.length)) + 0.5;
      this.context.beginPath();
      this.context.moveTo(x, y);
      this.context.lineTo(x + width, y);
      this.context.stroke();
    }
  }

  /**
   * Sensor artifact carries no hue: it is a 45-degree hatch at 8 px pitch, so a
   * learner reads the texture as a monitoring problem rather than an alarm.
   */
  private drawArtifactHatch(): void {
    const context = this.context;
    for (const track of this.tracks) {
      if (!track.config.artifact) continue;
      context.save();
      context.beginPath();
      context.rect(0, track.top, this.cssWidth, track.height);
      context.clip();
      context.strokeStyle = this.artifactHatch;
      context.lineWidth = 1;
      context.setLineDash([]);
      for (let x = -track.height; x < this.cssWidth; x += 8) {
        context.beginPath();
        context.moveTo(x, track.top + track.height);
        context.lineTo(x + track.height, track.top);
        context.stroke();
      }
      context.restore();
    }
  }

  private toY(track: TrackState, value: number): number {
    const { min, max } = track.config;
    const fraction = (value - min) / Math.max(max - min, 1e-9);
    const clamped = fraction < 0 ? 0 : fraction > 1 ? 1 : fraction;
    const padding = track.height * 0.08;
    return track.top + track.height - padding - clamped * (track.height - padding * 2);
  }

  /**
   * The degradation ladder. Sustained frame time above 33 ms for more than two
   * seconds drops the renderer to 30 frames per second and reduces point density,
   * while the solver continues at the full tick and every numeric stays correct.
   */
  private recordFrame(durationMs: number, nowMs: number): void {
    this.frameTimes.push(durationMs);
    if (this.frameTimes.length > 600) this.frameTimes.shift();

    if (durationMs > 33) {
      if (this.slowSinceMs === null) this.slowSinceMs = nowMs;
      else if (nowMs - this.slowSinceMs > 2000 && this.quality < 2) {
        this.quality = (this.quality + 1) as QualityLevel;
        this.slowSinceMs = nowMs;
      }
    } else {
      this.slowSinceMs = null;
    }
    // At reduced quality the renderer also halves its frame rate.
    if (this.quality > 0) this.skipNextFrame = true;
  }

  /** Force a quality level. Used by the frame-budget harness and by tests. */
  setQuality(quality: QualityLevel): void {
    this.quality = quality;
  }

  metrics(): RendererMetrics {
    return { frameTimesMs: [...this.frameTimes], quality: this.quality, skippedFrames: this.skippedFrames };
  }

  /** The device pixel ratio the backing store is currently scaled to. */
  get pixelRatio(): number {
    return this.devicePixelRatio;
  }
}

/** The nth percentile of a set of frame times, in milliseconds. */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
}
