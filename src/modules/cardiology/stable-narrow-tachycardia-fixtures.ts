import type { StableNarrowTachycardiaAction } from './stable-narrow-tachycardia';

/**
 * Reference transcripts for the stable narrow-complex tachycardia lesson.
 *
 * The common-error path is the one the ladder exists to prevent: the maneuver
 * is recorded and then a drug is reached for without anybody looking at
 * whether the maneuver worked. The recovery path takes that refusal and both
 * time gates.
 */
export const STABLE_NARROW_TACHYCARDIA_FIXTURES = {
  scenarioId: 'regular-narrow-complex-tachycardia', contentVersion: '0.1.0', seed: 6285,
  noAction: [],
  expert: [
    [0, 'reconcile-stable-regular-narrow-tachycardia'],
    [1, 'review-stable-regular-narrow-context'],
    [2, 'record-stable-regular-narrow-vagal-intent'],
    [3, 'review-stable-regular-narrow-vagal-response'],
    [4, 'record-stable-regular-narrow-adenosine-intent'],
    [5, 'reassess-stable-regular-narrow-trajectory'],
  ],
  commonError: [
    [0, 'reconcile-stable-regular-narrow-tachycardia'],
    [1, 'review-stable-regular-narrow-context'],
    [2, 'record-stable-regular-narrow-vagal-intent'],
    // Reaching for the drug without looking at the maneuver.
    [3, 'record-stable-regular-narrow-adenosine-intent'],
  ],
  recovery: [
    // Context before the stability it depends on.
    [0, 'review-stable-regular-narrow-context'],
    [1, 'reconcile-stable-regular-narrow-tachycardia'],
    [2, 'review-stable-regular-narrow-context'],
    [3, 'record-stable-regular-narrow-vagal-intent'],
    // The first time gate, taken too early before it is taken correctly.
    [3, 'review-stable-regular-narrow-vagal-response'],
    [4, 'review-stable-regular-narrow-vagal-response'],
    [5, 'record-stable-regular-narrow-adenosine-intent'],
    // And the second.
    [5, 'reassess-stable-regular-narrow-trajectory'],
    [6, 'reassess-stable-regular-narrow-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, StableNarrowTachycardiaAction])[];
  expert: readonly (readonly [number, StableNarrowTachycardiaAction])[];
  commonError: readonly (readonly [number, StableNarrowTachycardiaAction])[];
  recovery: readonly (readonly [number, StableNarrowTachycardiaAction])[];
};
