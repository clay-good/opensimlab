import type { RightVentricularInfarctionAction } from './right-ventricular-infarction';

/**
 * Reference transcripts for the right-ventricular infarction lesson.
 *
 * The common-error path is the one the interesting half invites: the trajectory
 * and the phenotype are read correctly and the learner goes on to plan support
 * with the reperfusion lane never recorded, so the handoff has nothing to close
 * on. The recovery path takes the unordered pair the other way round — which
 * the engine accepts without comment — after being refused for reaching for
 * support before the phenotype, and walks into the time gate before clearing it.
 */
export const RIGHT_VENTRICULAR_INFARCTION_FIXTURES = {
  scenarioId: 'right-ventricular-infarction', contentVersion: '0.1.0', seed: 8156,
  noAction: [],
  expert: [
    [0, 'reconcile-right-ventricular-infarction'],
    [1, 'preserve-right-ventricular-infarction-reperfusion'],
    [2, 'review-right-ventricular-infarction-phenotype'],
    [3, 'record-right-ventricular-infarction-support'],
    [4, 'handoff-right-ventricular-infarction'],
  ],
  commonError: [
    [0, 'reconcile-right-ventricular-infarction'],
    [1, 'review-right-ventricular-infarction-phenotype'],
    [2, 'record-right-ventricular-infarction-support'],
    // The clock nobody restarted.
    [3, 'handoff-right-ventricular-infarction'],
  ],
  recovery: [
    // Support before the phenotype that has to precede it.
    [0, 'reconcile-right-ventricular-infarction'],
    [1, 'record-right-ventricular-infarction-support'],
    // The pair the other way round, which is not an error.
    [2, 'review-right-ventricular-infarction-phenotype'],
    [3, 'preserve-right-ventricular-infarction-reperfusion'],
    [4, 'record-right-ventricular-infarction-support'],
    // The time gate, taken too early before it is taken correctly.
    [4, 'handoff-right-ventricular-infarction'],
    [5, 'handoff-right-ventricular-infarction'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RightVentricularInfarctionAction])[];
  expert: readonly (readonly [number, RightVentricularInfarctionAction])[];
  commonError: readonly (readonly [number, RightVentricularInfarctionAction])[];
  recovery: readonly (readonly [number, RightVentricularInfarctionAction])[];
};
