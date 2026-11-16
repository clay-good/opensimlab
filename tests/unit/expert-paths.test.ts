/**
 * The generated expert paths are in step with the fixtures they came from
 * (deliberate-practice-loop → expert overlay).
 *
 * Same guard as `reference-paths.test.ts`, for the same reason: a committed
 * generated file that nobody regenerates is a file that starts lying. Here the
 * lie would be drawn on an axis beside the learner's own run.
 */
import { describe, expect, it } from 'vitest';
import { EXPERT_PATHS } from '@anesthesia/debrief/expert-paths.generated';
import { SCENARIOS } from '@anesthesia/scenarios';
import { sampleExpertVitals } from '../../scripts/sample-expert-vitals';

describe('the generated expert paths', () => {
  it('matches what the fixtures produce today, lesson by lesson', () => {
    for (const path of EXPERT_PATHS) {
      const scenario = SCENARIOS.find((entry) => entry.metadata.id === path.scenarioId)!;
      expect(scenario, path.scenarioId).toBeDefined();
      const recomputed = sampleExpertVitals(scenario, path.seed, path.expert as never);
      expect(recomputed.map((sample) => sample.tick), path.scenarioId)
        .toEqual(path.recorded.map((sample) => sample.tick));
      for (const [index, sample] of recomputed.entries()) {
        // The engine is deterministic, so this is equality rather than a bound.
        expect(sample.vitals, `${path.scenarioId} at ${sample.tick}`)
          .toEqual(path.recorded[index]!.vitals);
      }
    }
  });

  it('covers every closed-loop lesson exactly once', () => {
    const ids = EXPERT_PATHS.map((path) => path.scenarioId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(SCENARIOS.length);
  });
});
