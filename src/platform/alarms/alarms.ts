/**
 * The alarm framework (cockpit/patient-monitor → Alarm System Follows
 * IEC 60601-1-8 Conventions).
 *
 * This module owns WHEN an alarm is active and at what priority. The monitor owns
 * the visual treatment and the sonification capability owns the audible signal, so
 * the two cannot diverge.
 *
 * Open Sim Lab follows the standard's conventions so that the language a learner
 * internalizes here transfers to the equipment they will meet clinically. It is
 * not a certified medical device and claims no conformance.
 */

export type AlarmPriority = 'critical' | 'warning' | 'advisory';

/** Simulated seconds an audible alarm stays silenced. */
export const SILENCE_SECONDS = 120;

/** More than this many alarms active for longer than the window is an alarm burden. */
export const ALARM_BURDEN_COUNT = 5;
export const ALARM_BURDEN_SECONDS = 60;

export interface AlarmLimit {
  readonly id: string;
  /** The state field this watches. */
  readonly parameter: string;
  readonly label: string;
  readonly unit: string;
  readonly priority: AlarmPriority;
  /** Fires when the value goes below this. */
  readonly low?: number;
  /** Fires when the value goes above this. */
  readonly high?: number;
  /** Learner-facing message; the value is appended by the engine. */
  readonly message: string;
  /** Source the threshold derives from, so a reviewer can check it. */
  readonly source: string;
}

export interface ActiveAlarm {
  readonly id: string;
  readonly priority: AlarmPriority;
  readonly parameter: string;
  readonly label: string;
  readonly value: number;
  readonly unit: string;
  readonly message: string;
  readonly sinceTick: number;
  readonly silencedUntilTick: number | null;
  /** True while a sensor artifact makes this reading untrustworthy. */
  readonly underArtifact: boolean;
}

/**
 * The alarm limits the anaesthesia module ships. Each names the source its
 * threshold derives from, so a clinical reviewer compares rather than judges.
 */
export const DEFAULT_LIMITS: readonly AlarmLimit[] = [
  {
    id: 'spo2-low', parameter: 'spo2Percent', label: 'SpO₂', unit: '%', priority: 'critical',
    low: 90, message: 'Oxygen saturation low',
    source: 'The conventional intervention threshold; below it the dissociation curve falls steeply.',
  },
  {
    id: 'spo2-very-low', parameter: 'spo2Percent', label: 'SpO₂', unit: '%', priority: 'critical',
    low: 85, message: 'Oxygen saturation critically low',
    source: 'Severe hypoxaemia requiring immediate action.',
  },
  {
    id: 'map-low', parameter: 'meanArterialMmHg', label: 'MAP', unit: 'mmHg', priority: 'warning',
    low: 55, message: 'Mean arterial pressure low',
    source: 'A commonly used intraoperative hypotension threshold in the outcome literature.',
  },
  {
    id: 'map-very-low', parameter: 'meanArterialMmHg', label: 'MAP', unit: 'mmHg', priority: 'critical',
    low: 45, message: 'Mean arterial pressure critically low',
    source: 'Profound hypotension.',
  },
  {
    id: 'heart-rate-low', parameter: 'heartRateBpm', label: 'HR', unit: 'bpm', priority: 'warning',
    low: 45, message: 'Bradycardia',
    source: 'Conventional intraoperative bradycardia threshold.',
  },
  {
    id: 'heart-rate-high', parameter: 'heartRateBpm', label: 'HR', unit: 'bpm', priority: 'warning',
    high: 120, message: 'Tachycardia',
    source: 'Conventional intraoperative tachycardia threshold.',
  },
  {
    id: 'etco2-low', parameter: 'etco2MmHg', label: 'EtCO₂', unit: 'mmHg', priority: 'critical',
    low: 20, message: 'End-tidal carbon dioxide low or absent',
    source: 'Loss of the capnogram is the earliest sign of a disconnected or misplaced airway.',
  },
  {
    id: 'etco2-high', parameter: 'etco2MmHg', label: 'EtCO₂', unit: 'mmHg', priority: 'warning',
    high: 55, message: 'End-tidal carbon dioxide high',
    source: 'Hypoventilation, or the first sign of a hypermetabolic state.',
  },
  {
    id: 'depth-light', parameter: 'depthIndex', label: 'Depth', unit: '', priority: 'warning',
    high: 60, message: 'Predicted depth index above the usual surgical range',
    source: 'The 40–60 range the published models are discussed against.',
  },
  {
    id: 'depth-deep', parameter: 'depthIndex', label: 'Depth', unit: '', priority: 'advisory',
    low: 30, message: 'Predicted depth index below the usual surgical range',
    source: 'The 40–60 range the published models are discussed against.',
  },
];

export interface AlarmEvaluation {
  readonly active: readonly ActiveAlarm[];
  /** Alarms that started this tick. */
  readonly raised: readonly ActiveAlarm[];
  /** Alarm ids that cleared this tick. */
  readonly cleared: readonly string[];
  /** True while more than five alarms have been active together for over a minute. */
  readonly burden: boolean;
}

/** Tracks alarm state across ticks. */
export class AlarmEngine {
  private readonly active = new Map<string, ActiveAlarm>();
  private readonly silenced = new Map<string, number>();
  private burdenSinceTick: number | null = null;
  private readonly limits: readonly AlarmLimit[];

  constructor(limits: readonly AlarmLimit[] = DEFAULT_LIMITS) {
    this.limits = limits;
  }

  /**
   * Silence an alarm's audible signal for 120 simulated seconds. The visual
   * indication persists in a silenced state and a countdown is shown.
   */
  silence(alarmId: string, tick: number, ticksPerSecond: number): void {
    this.silenced.set(alarmId, tick + SILENCE_SECONDS * ticksPerSecond);
  }

  /** Evaluate every limit against the current state. */
  evaluate(
    state: Readonly<Record<string, number>>,
    tick: number,
    options: { artifactParameters?: ReadonlySet<string>; invalidParameters?: ReadonlySet<string> } = {},
  ): AlarmEvaluation {
    const raised: ActiveAlarm[] = [];
    const seen = new Set<string>();

    for (const limit of this.limits) {
      const value = state[limit.parameter];
      if (value === undefined) continue;
      // A parameter that cannot be measured does not alarm on a fabricated number.
      if (options.invalidParameters?.has(limit.parameter)) continue;

      const breached = (limit.low !== undefined && value < limit.low)
        || (limit.high !== undefined && value > limit.high);
      if (!breached) continue;

      seen.add(limit.id);
      const existing = this.active.get(limit.id);
      const silencedUntil = this.silenced.get(limit.id);
      const alarm: ActiveAlarm = {
        id: limit.id,
        priority: limit.priority,
        parameter: limit.parameter,
        label: limit.label,
        value,
        unit: limit.unit,
        message: `${limit.message}: ${limit.label} ${value.toFixed(0)}${limit.unit}`,
        sinceTick: existing?.sinceTick ?? tick,
        silencedUntilTick: silencedUntil !== undefined && silencedUntil > tick ? silencedUntil : null,
        underArtifact: options.artifactParameters?.has(limit.parameter) ?? false,
      };
      this.active.set(limit.id, alarm);
      if (!existing) raised.push(alarm);
    }

    const cleared: string[] = [];
    for (const id of [...this.active.keys()]) {
      if (!seen.has(id)) {
        this.active.delete(id);
        this.silenced.delete(id);
        cleared.push(id);
      }
    }

    // Alarm burden is recorded, never used to suppress an alarm.
    const ticksPerSecond = 10;
    if (this.active.size > ALARM_BURDEN_COUNT) {
      if (this.burdenSinceTick === null) this.burdenSinceTick = tick;
    } else {
      this.burdenSinceTick = null;
    }
    const burden = this.burdenSinceTick !== null
      && tick - this.burdenSinceTick > ALARM_BURDEN_SECONDS * ticksPerSecond;

    return {
      active: [...this.active.values()].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)),
      raised,
      cleared,
      burden,
    };
  }

  reset(): void {
    this.active.clear();
    this.silenced.clear();
    this.burdenSinceTick = null;
  }
}

export function priorityRank(priority: AlarmPriority): number {
  return priority === 'critical' ? 0 : priority === 'warning' ? 1 : 2;
}
