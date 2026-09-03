import type { TorsadesAction } from './torsades';

/**
 * Reference transcripts for the torsades lesson.
 *
 * The common-error path is the one the name invites: the rhythm is recognised
 * correctly and the learner goes straight for the magnesium and the QT while
 * she is still in it. The recovery path takes the closing pair in the other
 * order — which the engine accepts without comment — and walks into both time
 * gates before clearing them.
 */
export const TORSADES_FIXTURES = {
  scenarioId: 'torsades-de-pointes', contentVersion: '0.1.0', seed: 7712,
  noAction: [],
  expert: [
    [0, 'reconcile-torsades-pulse-and-pattern'],
    [1, 'record-torsades-unsynchronized-shock-intent'],
    [2, 'review-torsades-post-shock-rhythm'],
    [3, 'review-torsades-long-qt-context'],
    [4, 'record-torsades-recurrence-suppression-intent'],
    [5, 'handoff-torsades-recurrence-plan'],
  ],
  commonError: [
    [0, 'reconcile-torsades-pulse-and-pattern'],
    // Magnesium and the QT while she is still in the rhythm.
    [1, 'record-torsades-recurrence-suppression-intent'],
    [2, 'review-torsades-long-qt-context'],
  ],
  recovery: [
    // The shock intent before the pattern and the pulse have been reconciled.
    [0, 'record-torsades-unsynchronized-shock-intent'],
    [1, 'reconcile-torsades-pulse-and-pattern'],
    [2, 'record-torsades-unsynchronized-shock-intent'],
    // The first time gate, taken too early before it is taken correctly.
    [2, 'review-torsades-post-shock-rhythm'],
    [3, 'review-torsades-post-shock-rhythm'],
    // The closing pair in the other order.
    [4, 'record-torsades-recurrence-suppression-intent'],
    [5, 'review-torsades-long-qt-context'],
    // The second time gate.
    [5, 'handoff-torsades-recurrence-plan'],
    [6, 'handoff-torsades-recurrence-plan'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, TorsadesAction])[];
  expert: readonly (readonly [number, TorsadesAction])[];
  commonError: readonly (readonly [number, TorsadesAction])[];
  recovery: readonly (readonly [number, TorsadesAction])[];
};
