/**
 * The committed reference paths against the real fixtures.
 *
 * `src/platform/facilitation/reference-paths.generated.ts` is written by
 * `npm run reference-paths` and committed, so it can go stale: an edited
 * fixture would leave 256 facilitator guides showing an expert path the lesson
 * no longer takes. That is worse than showing none, because a facilitator has
 * no way to tell.
 *
 * The normalisation is tested here too, because the catalogue writes its
 * reference transcripts in three shapes and reading only two of them silently
 * emptied one lesson's guide.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODULES } from '@platform/modules/registry';
import { formatPayload, referencePath, referenceStep } from '@platform/facilitation/reference-paths';
import { REFERENCE_PATHS } from '@platform/facilitation/reference-paths.generated';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { SCENARIOS } from '@anesthesia/scenarios';
import type { LearnerAction } from '@platform/kernel/protocol';
import { sampleExpertVitals } from '../../scripts/sample-expert-vitals';

const available = MODULES.filter((module) => module.status === 'available');

function isFixtureObject(value: unknown): value is {
  scenarioId: string; seed: number; expert: readonly unknown[];
  commonError: readonly unknown[]; recovery: readonly unknown[];
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.scenarioId === 'string' && typeof record.seed === 'number'
    && Array.isArray(record.expert)
    && Array.isArray(record.commonError) && Array.isArray(record.recovery);
}

describe('the generated reference paths', () => {
  it('matches every lesson\'s checked-in fixtures exactly', async () => {
    const built: unknown[] = [];
    for (const module of available) {
      const dir = join(process.cwd(), 'src/modules', module.id);
      const files = readdirSync(dir).filter((file) => file.endsWith('-fixtures.ts')).sort();
      for (const file of files) {
        const namespace = await import(join(dir, file)) as Record<string, unknown>;
        const fixtures = Object.values(namespace).filter(isFixtureObject);
        expect([`${module.id}/${file}`, fixtures.length]).toEqual([`${module.id}/${file}`, 1]);
        const fixture = fixtures[0]!;
        // The sampled vitals are recomputed by replaying the engine, not
        // trusted: a committed number nobody re-derives is a number that can
        // drift from the model that produced it.
        const scenario = module.id === 'anesthesia'
          ? SCENARIOS.find((candidate) => candidate.metadata.id === fixture.scenarioId)
          : undefined;
        const expertVitals = scenario === undefined ? undefined
          : sampleExpertVitals(scenario, fixture.seed, fixture.expert as readonly LearnerAction[]);
        built.push({
          moduleId: module.id,
          scenarioId: fixture.scenarioId,
          expert: referencePath(fixture.expert),
          commonError: referencePath(fixture.commonError),
          recovery: referencePath(fixture.recovery),
          ...(expertVitals === undefined || expertVitals.length === 0 ? {} : { expertVitals }),
        });
      }
    }
    expect(REFERENCE_PATHS).toEqual(built);
  });

  it('covers every scenario the facilitator guide serves', () => {
    const covered = new Set(REFERENCE_PATHS.map((paths) => `${paths.moduleId}:${paths.scenarioId}`));
    for (const entry of FACILITATED_SCENARIOS) {
      const key = `${entry.moduleRoute}:${entry.scenario.metadata.id}`;
      expect(covered, `${key} has no reference paths`).toContain(key);
    }
    expect(REFERENCE_PATHS).toHaveLength(FACILITATED_SCENARIOS.length);
  });

  it('samples the model only for the closed-loop family', () => {
    const sampled = REFERENCE_PATHS.filter((paths) => paths.expertVitals !== undefined);
    expect(sampled).toHaveLength(39);
    expect(sampled.every((paths) => paths.moduleId === 'anesthesia')).toBe(true);
    for (const paths of sampled) {
      expect(paths.expertVitals!.length, paths.scenarioId).toBeGreaterThan(0);
      for (const sample of paths.expertVitals!) {
        expect(Object.values(sample.vitals).every(Number.isFinite), paths.scenarioId).toBe(true);
      }
    }
  });

  it('leaves no lesson with an empty expert path', () => {
    const empty = REFERENCE_PATHS.filter((paths) => paths.expert.length === 0)
      .map((paths) => `${paths.moduleId}:${paths.scenarioId}`);
    expect(empty).toEqual([]);
  });
});

describe('normalising a recorded step', () => {
  it('reads a tray step, a whole action, and an action with its tick outside it', () => {
    expect(referenceStep([3, 'record-the-symptom-course']))
      .toEqual({ tick: 3, label: 'record-the-symptom-course' });
    expect(referenceStep({ tick: 600, type: 'cardiac-arrest-epinephrine', payload: { doseMg: 1, route: 'iv' } }))
      .toEqual({ tick: 600, label: 'cardiac-arrest-epinephrine', detail: 'doseMg 1, route iv' });
    expect(referenceStep([4, { type: 'pleural-decompression', payload: { side: 'left' } }]))
      .toEqual({ tick: 4, label: 'pleural-decompression', detail: 'side left' });
  });

  it('keeps a step with no payload free of empty detail', () => {
    expect(referenceStep({ tick: 1, type: 'help', payload: {} })).toEqual({ tick: 1, label: 'help' });
    expect(formatPayload({})).toBeUndefined();
    expect(formatPayload(undefined)).toBeUndefined();
  });

  it('drops anything it cannot read rather than inventing a step', () => {
    expect(referenceStep(['not-a-tick', 'step'])).toBeUndefined();
    expect(referenceStep({ tick: 2 })).toBeUndefined();
    expect(referenceStep(null)).toBeUndefined();
    expect(referencePath([[1, 'ok'], null, { nothing: true }])).toEqual([{ tick: 1, label: 'ok' }]);
  });
});
