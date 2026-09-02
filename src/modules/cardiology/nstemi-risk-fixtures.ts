import type { NstemiRiskAction } from './nstemi-risk';

/**
 * Reference transcripts for the NSTEMI risk-reassessment lesson.
 *
 * This engine case authors no refusable choice and no time gate. The
 * common-error path is the inheritance the lesson exists to refuse: reading
 * the trajectory, verifying the conclusion, and then recording a strategy
 * without re-screening the very-high-risk features that would have changed it.
 * The recovery path takes that refusal and one before it.
 */
export const NSTEMI_RISK_FIXTURES = {
  scenarioId: 'nstemi-risk-reassessment', contentVersion: '0.1.0', seed: 4218,
  noAction: [],
  expert: [
    [0, 'reconcile-nstemi-serial-trajectory'],
    [1, 'verify-nstemi-and-alternatives'],
    [2, 'screen-nstemi-very-high-risk-features'],
    [3, 'record-nstemi-invasive-strategy'],
    [4, 'record-nstemi-monitoring-and-handoff'],
  ],
  commonError: [
    [0, 'reconcile-nstemi-serial-trajectory'],
    [1, 'verify-nstemi-and-alternatives'],
    // Inheriting stability instead of re-screening for it.
    [2, 'record-nstemi-invasive-strategy'],
    [3, 'record-nstemi-monitoring-and-handoff'],
  ],
  recovery: [
    // Verifying the conclusion before the trajectory it rests on.
    [0, 'verify-nstemi-and-alternatives'],
    [1, 'reconcile-nstemi-serial-trajectory'],
    [2, 'verify-nstemi-and-alternatives'],
    // Then the same inherited-stability reflex, corrected.
    [3, 'record-nstemi-invasive-strategy'],
    [4, 'screen-nstemi-very-high-risk-features'],
    [5, 'record-nstemi-invasive-strategy'],
    [6, 'record-nstemi-monitoring-and-handoff'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NstemiRiskAction])[];
  expert: readonly (readonly [number, NstemiRiskAction])[];
  commonError: readonly (readonly [number, NstemiRiskAction])[];
  recovery: readonly (readonly [number, NstemiRiskAction])[];
};
