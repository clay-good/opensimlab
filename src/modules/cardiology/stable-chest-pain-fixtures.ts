import type { StableChestPainAction } from './stable-chest-pain';

/**
 * Reference transcripts for the stable-chest-pain lesson.
 *
 * This engine case authors no refusable choice and no time gate, so the error
 * paths are made of order alone — which is the right shape for a lesson whose
 * subject is the order of reasoning. The common-error path is the reflex the
 * lesson exists to interrupt: reaching for a testing pathway straight after
 * characterizing the symptom, without ever estimating the likelihood that
 * decides whether a test is appropriate at all. The recovery path takes that
 * refusal and two others before completing in order.
 */
export const STABLE_CHEST_PAIN_FIXTURES = {
  scenarioId: 'stable-chest-pain-evaluation', contentVersion: '0.1.1', seed: 1624,
  noAction: [],
  expert: [
    [0, 'verify-stable-chest-pain-trajectory'],
    [1, 'characterize-stable-chest-pain-pattern'],
    [2, 'estimate-stable-chest-pain-clinical-likelihood'],
    [3, 'record-stable-chest-pain-testing-intent'],
    [4, 'safety-net-stable-chest-pain-follow-up'],
  ],
  commonError: [
    [0, 'verify-stable-chest-pain-trajectory'],
    [1, 'characterize-stable-chest-pain-pattern'],
    // Investigating before estimating.
    [2, 'record-stable-chest-pain-testing-intent'],
    [3, 'safety-net-stable-chest-pain-follow-up'],
  ],
  recovery: [
    // Characterizing before the trajectory has been established.
    [0, 'characterize-stable-chest-pain-pattern'],
    [1, 'verify-stable-chest-pain-trajectory'],
    [2, 'characterize-stable-chest-pain-pattern'],
    // Then the same investigate-before-estimate reflex, corrected.
    [3, 'record-stable-chest-pain-testing-intent'],
    [4, 'estimate-stable-chest-pain-clinical-likelihood'],
    [5, 'record-stable-chest-pain-testing-intent'],
    [6, 'safety-net-stable-chest-pain-follow-up'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, StableChestPainAction])[];
  expert: readonly (readonly [number, StableChestPainAction])[];
  commonError: readonly (readonly [number, StableChestPainAction])[];
  recovery: readonly (readonly [number, StableChestPainAction])[];
};
