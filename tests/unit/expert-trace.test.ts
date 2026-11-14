/**
 * The expert-trace tolerance, and the measurement behind it.
 *
 * The plan for the expert overlay said to compare a replayed expert transcript
 * "against the fixture's declared tolerance", and no fixture declared one. The
 * number did not need a person to choose it: the engine is deterministic, so
 * what a different seed does to an expert path can be measured.
 *
 * This file is both the check and the evidence. It replays every closed-loop
 * lesson's expert transcript under other seeds and fails if the engine moves
 * further than `EXPERT_TRACE_TOLERANCE` allows — so the declared number stays
 * tied to what the engine actually does rather than to what it did once.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '@anesthesia/scenarios';
import type { LearnerAction } from '@platform/kernel/protocol';
import {
  EXPERT_TRACE_TOLERANCE, expertTraceWithinTolerance, type TraceSample,
} from '@anesthesia/debrief/expert-trace';
import { sampleExpertVitals } from '../../scripts/sample-expert-vitals';

interface Fixture {
  readonly scenarioId: string;
  readonly seed: number;
  readonly expert: readonly LearnerAction[];
}

function isFixture(value: unknown): value is Fixture {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.scenarioId === 'string' && typeof record.seed === 'number'
    && Array.isArray(record.expert);
}

/** Every closed-loop lesson: only anaesthesia runs a physiological model. */
async function closedLoopFixtures(): Promise<Fixture[]> {
  const dir = join(process.cwd(), 'src/modules/anesthesia');
  const files = readdirSync(dir).filter((file) => file.endsWith('-fixtures.ts')).sort();
  const found: Fixture[] = [];
  for (const file of files) {
    const namespace = await import(join(dir, file)) as Record<string, unknown>;
    const fixture = Object.values(namespace).find(isFixture);
    if (fixture) found.push(fixture);
  }
  return found;
}

const trace = (samples: readonly { tick: number; vitals: Record<string, number> }[]): TraceSample[] =>
  samples.map((sample) => ({ tick: sample.tick, vitals: sample.vitals }));

describe('the expert-trace tolerance', () => {
  it('holds for every closed-loop lesson under other seeds', { timeout: 300_000 }, async () => {
    const fixtures = await closedLoopFixtures();
    expect(fixtures.length).toBe(39);
    const failures: string[] = [];
    let checked = 0;
    for (const fixture of fixtures) {
      const scenario = SCENARIOS.find((entry) => entry.metadata.id === fixture.scenarioId);
      if (scenario === undefined) continue;
      const recorded = trace(sampleExpertVitals(scenario, fixture.seed, fixture.expert));
      if (recorded.length === 0) continue;
      for (const seed of [fixture.seed + 1, 12_345]) {
        checked += 1;
        const replayed = trace(sampleExpertVitals(scenario, seed, fixture.expert));
        const verdict = expertTraceWithinTolerance(recorded, replayed);
        if (!verdict.within) {
          failures.push(`${fixture.scenarioId} seed ${seed}: ${verdict.parameter ?? 'shape'} `
            + `moved ${verdict.observed ?? '?'} (allowed ${verdict.allowed ?? '?'})`);
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });

  it('declares a bound for each parameter it compares, and no others', () => {
    expect(Object.keys(EXPERT_TRACE_TOLERANCE).sort()).toEqual([
      'diastolicMmHg', 'etco2MmHg', 'heartRateBpm', 'meanArterialMmHg', 'spo2Percent',
      'systolicMmHg',
    ]);
    for (const allowed of Object.values(EXPERT_TRACE_TOLERANCE)) {
      expect(allowed).toBeGreaterThan(0);
    }
  });

  const recorded: TraceSample[] = [
    { tick: 0, vitals: { heartRateBpm: 70, systolicMmHg: 120, spo2Percent: 98 } },
    { tick: 600, vitals: { heartRateBpm: 90, systolicMmHg: 100, spo2Percent: 94 } },
  ];

  it('accepts a trace that moved less than the bound', () => {
    const replayed: TraceSample[] = [
      { tick: 0, vitals: { heartRateBpm: 71, systolicMmHg: 126, spo2Percent: 98.2 } },
      { tick: 600, vitals: { heartRateBpm: 88.5, systolicMmHg: 104, spo2Percent: 94 } },
    ];
    expect(expertTraceWithinTolerance(recorded, replayed)).toEqual({ within: true });
  });

  it('names the parameter and the moment when it refuses', () => {
    const replayed: TraceSample[] = [
      recorded[0]!,
      { tick: 600, vitals: { heartRateBpm: 90, systolicMmHg: 60, spo2Percent: 94 } },
    ];
    expect(expertTraceWithinTolerance(recorded, replayed)).toEqual({
      within: false, parameter: 'systolicMmHg', tick: 600, observed: 40, allowed: 8,
    });
  });

  /**
   * A different shape is not a looser comparison, it is a different run — so no
   * threshold makes it acceptable. This is the case that matters most: it is
   * what a changed content version or a changed engine looks like.
   */
  it('refuses a trace of a different shape at any threshold', () => {
    expect(expertTraceWithinTolerance(recorded, [recorded[0]!]).within).toBe(false);
    expect(expertTraceWithinTolerance(recorded, []).within).toBe(false);
    expect(expertTraceWithinTolerance([], []).within).toBe(false);
    const shifted = [recorded[0]!, { ...recorded[1]!, tick: 900 }];
    expect(expertTraceWithinTolerance(recorded, shifted))
      .toEqual({ within: false, tick: 600 });
    // Even an enormous tolerance cannot rescue it.
    expect(expertTraceWithinTolerance(recorded, shifted, { systolicMmHg: 10_000 }).within)
      .toBe(false);
  });

  it('ignores a parameter it has no bound for rather than guessing one', () => {
    const withExtra: TraceSample[] = [
      { tick: 0, vitals: { heartRateBpm: 70, depthIndex: 0.1 } },
    ];
    const moved: TraceSample[] = [
      { tick: 0, vitals: { heartRateBpm: 70, depthIndex: 0.9 } },
    ];
    expect(expertTraceWithinTolerance(withExtra, moved).within).toBe(true);
  });
});
