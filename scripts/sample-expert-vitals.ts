/**
 * The vitals a closed-loop lesson's model produces at each of its own timeline
 * events, under its checked-in expert transcript.
 *
 * This is what makes a run sheet usable away from the simulator: a facilitator
 * reading "STATE 2" needs the numbers that go with it. They are a model output
 * under one reference path, not a prediction about any patient, and the run
 * sheet says so where it prints them.
 *
 * It lives beside the generator rather than in `src/` for two reasons. Running
 * the engine is a build-time job, and the 217 state-transition lessons have no
 * engine to run — they carry their observations in each state's authored text.
 * Nothing shipped to a browser should be able to reach this.
 *
 * Shared with `tests/unit/reference-paths.test.ts` so the committed samples are
 * checked by recomputation rather than by trusting the file.
 */
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { Scenario } from '@anesthesia/scenarios/types';
import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * The parameters a facilitator reads aloud, in the order the design's example
 * prints them. The model computes 27; a sheet listing all of them is a sheet
 * nobody reads in a room.
 */
export const RUN_SHEET_VITAL_KEYS = [
  'heartRateBpm', 'systolicMmHg', 'diastolicMmHg', 'meanArterialMmHg',
  'spo2Percent', 'respiratoryRateBpm', 'etco2MmHg', 'coreTemperatureC',
] as const;

export interface SampledVitals {
  /** The timeline event's tick, which is also the state's own identity. */
  readonly tick: number;
  readonly vitals: Readonly<Record<string, number>>;
}

/** One decimal place: the model's precision is not the number's meaning. */
const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Replay the expert transcript and record the state at each timeline event.
 *
 * The engine is seeded from the fixture, so this is reproducible: the same
 * inputs give the same numbers, which is what lets a test recompute them.
 */
export function sampleExpertVitals(
  scenario: Scenario,
  seed: number,
  expert: readonly LearnerAction[],
): readonly SampledVitals[] {
  const wanted = scenario.timeline
    .map((event) => event.atTick)
    .filter((tick): tick is number => tick !== undefined);
  if (wanted.length === 0) return [];
  const sampleAt = new Set(wanted);
  const lastAction = expert.reduce((latest, action) => Math.max(latest, action.tick), 0);
  const until = Math.max(...wanted, lastAction);

  const engine = new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
  const actions = [...expert].sort((a, b) => a.tick - b.tick);
  const samples: SampledVitals[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next] !== undefined && actions[next]!.tick === tick) {
      engine.apply(actions[next]!);
      next += 1;
    }
    const frame = engine.step();
    if (!sampleAt.has(frame.tick)) continue;
    const state = frame.state as Readonly<Record<string, number>>;
    const vitals: Record<string, number> = {};
    for (const key of RUN_SHEET_VITAL_KEYS) {
      const value = state[key];
      if (typeof value === 'number' && Number.isFinite(value)) vitals[key] = round(value);
    }
    samples.push({ tick: frame.tick, vitals });
  }
  return samples;
}
