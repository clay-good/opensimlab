import type { PericardialTamponadeAction } from './pericardial-tamponade';

/**
 * Reference transcripts for the pericardial-tamponade lesson.
 *
 * The common-error path is the one improvement invites: the trajectory and the
 * drainage response are read correctly and the learner reaches for the handoff,
 * as though a comfortable patient with a drain in place were a finished review.
 * The recovery path takes the closing pair in the other order — which the
 * engine accepts without comment — after being refused twice for skipping the
 * two steps that come first, and walks into the time gate before clearing it.
 */
export const PERICARDIAL_TAMPONADE_FIXTURES = {
  scenarioId: 'pericardial-tamponade', contentVersion: '0.1.0', seed: 6903,
  noAction: [],
  expert: [
    [0, 'reconcile-pericardial-tamponade-trajectory'],
    [1, 'review-pericardial-tamponade-drainage-response'],
    [2, 'review-pericardial-tamponade-etiology'],
    [3, 'review-pericardial-tamponade-surveillance'],
    [4, 'handoff-pericardial-tamponade-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-pericardial-tamponade-trajectory'],
    [1, 'review-pericardial-tamponade-drainage-response'],
    // A comfortable patient treated as a finished review.
    [2, 'handoff-pericardial-tamponade-reassessment'],
  ],
  recovery: [
    // Both of the steps that come first, skipped in turn.
    [0, 'review-pericardial-tamponade-etiology'],
    [1, 'reconcile-pericardial-tamponade-trajectory'],
    [2, 'review-pericardial-tamponade-surveillance'],
    [3, 'review-pericardial-tamponade-drainage-response'],
    // The closing pair in the other order.
    [4, 'review-pericardial-tamponade-surveillance'],
    [5, 'review-pericardial-tamponade-etiology'],
    // The time gate, taken too early before it is taken correctly.
    [5, 'handoff-pericardial-tamponade-reassessment'],
    [6, 'handoff-pericardial-tamponade-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PericardialTamponadeAction])[];
  expert: readonly (readonly [number, PericardialTamponadeAction])[];
  commonError: readonly (readonly [number, PericardialTamponadeAction])[];
  recovery: readonly (readonly [number, PericardialTamponadeAction])[];
};
