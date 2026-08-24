/**
 * Simulated time (engine/simulation-clock).
 *
 * The tick count since scenario start is the authoritative clock. Wall-clock time
 * only governs how quickly ticks are REQUESTED, never what the patient does, so a
 * run at 1x and a run at 60x produce identical trajectories.
 */

/** Every tick is 100 ms of simulated time. */
export const TICK_MS = 100;
export const TICKS_PER_SECOND = 1000 / TICK_MS;

/** Speed multipliers the anaesthesia module declares (platform/module-contract). */
export const SPEED_MULTIPLIERS = [1, 2, 5, 60] as const;
export type SpeedMultiplier = (typeof SPEED_MULTIPLIERS)[number];

/** Single-step advances exactly one simulated second. */
export const SINGLE_STEP_TICKS = TICKS_PER_SECOND;

/**
 * A backgrounded tab must not silently fast-forward the patient, so a catch-up
 * pass is capped at five simulated seconds however long the tab was hidden.
 */
export const MAX_CATCHUP_TICKS = 5 * TICKS_PER_SECOND;

export type TransportState = 'idle' | 'running' | 'paused';

export interface ClockSnapshot {
  readonly tick: number;
  readonly state: TransportState;
  readonly speed: SpeedMultiplier;
  /** Elapsed simulated time as HH:MM:SS, derived from the tick count. */
  readonly elapsed: string;
  /** True when the last advance was truncated by the catch-up cap. */
  readonly catchUpWasCapped: boolean;
}

/** Format a tick count as HH:MM:SS. No separate time value is stored to drift from it. */
export function formatElapsed(tick: number): string {
  const totalSeconds = Math.floor(tick / TICKS_PER_SECOND);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * The clock. It owns the tick counter and decides how many ticks to run for a
 * given amount of elapsed wall-clock time; it does not read a clock itself, so it
 * is fully testable.
 */
export class SimulationClock {
  private currentTick = 0;
  private transport: TransportState = 'idle';
  private currentSpeed: SpeedMultiplier = 1;
  /**
   * Total simulated milliseconds accrued. The tick count is derived from this
   * ABSOLUTELY rather than by adding a fractional remainder each frame: a
   * fractional carry accumulates floating point error, and after a few thousand
   * animation frames that error is a whole lost tick.
   */
  private simulatedMs = 0;
  private capped = false;

  get tick(): number { return this.currentTick; }
  get state(): TransportState { return this.transport; }
  get speed(): SpeedMultiplier { return this.currentSpeed; }

  play(): void { this.transport = 'running'; }

  /** Pause freezes the tick counter. The interface stays fully interactive. */
  pause(): void { this.transport = 'paused'; }

  setSpeed(speed: SpeedMultiplier): void { this.currentSpeed = speed; }

  /** Reset clears the tick counter. The caller confirms first and clears the rest. */
  reset(): void {
    this.currentTick = 0;
    this.simulatedMs = 0;
    this.transport = 'idle';
    this.capped = false;
  }

  /** Restore a deterministic replay point without consulting wall-clock time. */
  restore(tick: number): void {
    if (!Number.isInteger(tick) || tick < 0) throw new Error('A replay tick must be a non-negative integer.');
    this.currentTick = tick;
    this.simulatedMs = tick * TICK_MS;
    this.transport = 'paused';
    this.capped = false;
  }

  /** Advance exactly one simulated second, whatever the transport state. */
  singleStep(): number {
    this.currentTick += SINGLE_STEP_TICKS;
    this.simulatedMs = this.currentTick * TICK_MS;
    return SINGLE_STEP_TICKS;
  }

  /**
   * How many ticks to run for `elapsedMs` of wall-clock time.
   * Returns zero while paused or idle. Caps a catch-up pass so a hidden tab
   * cannot fast-forward the patient.
   */
  ticksFor(elapsedMs: number): number {
    this.capped = false;
    if (this.transport !== 'running') return 0;
    this.simulatedMs += elapsedMs * this.currentSpeed;
    // The epsilon absorbs the residual floating point error of summing frame
    // durations that are not exactly representable, such as 1000/60 ms.
    const targetTick = Math.floor(this.simulatedMs / TICK_MS + 1e-9);
    let ticks = targetTick - this.currentTick;
    if (ticks <= 0) return 0;
    if (ticks > MAX_CATCHUP_TICKS) {
      ticks = MAX_CATCHUP_TICKS;
      // Discard the rest: a hidden tab must not fast-forward the patient later either.
      this.simulatedMs = (this.currentTick + ticks) * TICK_MS;
      this.capped = true;
    }
    this.currentTick += ticks;
    return ticks;
  }

  snapshot(): ClockSnapshot {
    return {
      tick: this.currentTick,
      state: this.transport,
      speed: this.currentSpeed,
      elapsed: formatElapsed(this.currentTick),
      catchUpWasCapped: this.capped,
    };
  }
}
