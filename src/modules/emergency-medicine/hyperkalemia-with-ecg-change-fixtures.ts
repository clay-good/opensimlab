import type { HyperkalemiaWithEcgChangeAction } from './hyperkalemia-with-ecg-change';

/**
 * Reference transcripts for the emergency hyperkalemia lesson.
 *
 * The common-error path is the one that stops at the better tracing: the
 * pattern is reviewed, calcium is recorded, the post-team ECG comes back with a
 * QRS of 104 ms, and the run reaches for the final panel — with the potassium
 * still 7.1 mmol/L and nothing recorded that would shift or remove it. It is
 * refused. The recovery path reaches for calcium before the review and is
 * refused, reads the ECG on the same tick as the calcium and is refused again,
 * reaches for the final panel on the same tick as the last lane and is refused
 * a third time, and still completes from the same positions.
 */
export const HYPERKALEMIA_WITH_ECG_CHANGE_FIXTURES = {
  scenarioId: 'hyperkalemia-with-ecg-change', contentVersion: '0.1.0', seed: 7183,
  noAction: [],
  expert: [
    [0, 'review-hyperkalemia-pattern'],
    [1, 'record-hyperkalemia-calcium-intent'],
    [2, 'review-hyperkalemia-post-calcium-ecg'],
    [3, 'record-hyperkalemia-insulin-glucose'],
    [4, 'record-hyperkalemia-beta-agonist'],
    [5, 'record-hyperkalemia-removal-and-cause-control'],
    [6, 'reassess-hyperkalemia'],
  ],
  commonError: [
    [0, 'review-hyperkalemia-pattern'],
    [1, 'record-hyperkalemia-calcium-intent'],
    [2, 'review-hyperkalemia-post-calcium-ecg'],
    // The tracing looks better, so the run behaves as though this is over.
    [3, 'reassess-hyperkalemia'],
  ],
  recovery: [
    // Calcium before the confirmed potassium and the drivers were reviewed.
    [0, 'record-hyperkalemia-calcium-intent'],
    [1, 'review-hyperkalemia-pattern'],
    [2, 'record-hyperkalemia-calcium-intent'],
    // The ECG report on the same tick as the intent: nothing has happened yet.
    [2, 'review-hyperkalemia-post-calcium-ecg'],
    [3, 'review-hyperkalemia-post-calcium-ecg'],
    [4, 'record-hyperkalemia-insulin-glucose'],
    [5, 'record-hyperkalemia-beta-agonist'],
    [6, 'record-hyperkalemia-removal-and-cause-control'],
    // The final panel on the same tick as the last lane.
    [6, 'reassess-hyperkalemia'],
    [7, 'reassess-hyperkalemia'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HyperkalemiaWithEcgChangeAction])[];
  expert: readonly (readonly [number, HyperkalemiaWithEcgChangeAction])[];
  commonError: readonly (readonly [number, HyperkalemiaWithEcgChangeAction])[];
  recovery: readonly (readonly [number, HyperkalemiaWithEcgChangeAction])[];
};
