/**
 * Alarm cues through vibration, for a learner who cannot hear the tone or
 * has the sound off (spoken-narration-and-haptic-cues → haptics).
 *
 * Patterns follow the visual flash cadence of IEC 60601-1-8 priorities, as the
 * tone does. Vibration is never the only channel: every alarm is shown and
 * announced as well. Where the browser has no vibration interface (iOS Safari
 * and most desktops) the setting says so rather than doing nothing silently.
 */

export type HapticPriority = 'high' | 'medium' | 'low';

export interface HapticPattern {
  /** On/off durations in milliseconds, starting with on. */
  readonly pattern: readonly number[];
  /** How often the pattern repeats while the alarm is active and unsilenced; null for once at onset. */
  readonly repeatMs: number | null;
}

export const HAPTIC_PATTERNS: Readonly<Record<HapticPriority, HapticPattern>> = {
  high: { pattern: [200, 150, 200, 150, 200], repeatMs: 2000 },
  medium: { pattern: [300, 700], repeatMs: 1500 },
  low: { pattern: [150], repeatMs: null },
};

/** Total time a pattern occupies, off gaps included. */
export function patternDurationMs(pattern: HapticPattern): number {
  return pattern.pattern.reduce((total, part) => total + part, 0);
}

export interface VibrationTarget {
  readonly vibrate?: (pattern: number | number[]) => boolean;
}

export function hapticsSupported(target: VibrationTarget | undefined): boolean {
  return typeof target?.vibrate === 'function';
}

export const HAPTICS_UNSUPPORTED_REASON =
  'This browser has no vibration interface, so alarm vibration is unavailable here. Every alarm '
  + 'is still shown and announced.';

/**
 * Drives vibration from the highest unsilenced alarm. Call `alarm` on every
 * simulation tick with that alarm, or with null when none is sounding; the
 * engine decides whether a pattern is due.
 */
export class HapticEngine {
  private lastStartedAt = Number.NEGATIVE_INFINITY;
  private lastPriority: HapticPriority | null = null;
  private lastOnsetId: string | null = null;

  constructor(private readonly target: VibrationTarget | undefined) {}

  alarm(current: { readonly id: string; readonly priority: HapticPriority } | null, nowMs: number): void {
    if (!hapticsSupported(this.target)) return;
    if (current === null) {
      this.stop();
      return;
    }
    const pattern = HAPTIC_PATTERNS[current.priority];
    const changed = current.priority !== this.lastPriority;
    const due = pattern.repeatMs === null
      ? current.id !== this.lastOnsetId
      : changed || nowMs - this.lastStartedAt >= pattern.repeatMs;
    if (!due) return;
    this.target!.vibrate!([...pattern.pattern]);
    this.lastStartedAt = nowMs;
    this.lastPriority = current.priority;
    this.lastOnsetId = current.id;
  }

  /** Silence, pause, or the setting turned off: stop at once and re-arm. */
  stop(): void {
    if (this.lastPriority !== null && hapticsSupported(this.target)) this.target!.vibrate!(0);
    this.lastPriority = null;
    this.lastStartedAt = Number.NEGATIVE_INFINITY;
    this.lastOnsetId = null;
  }
}
