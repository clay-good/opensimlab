import type { AcuteSevereAsthmaAction } from './acute-severe-asthma';

/**
 * Reference transcripts for the acute-severe-asthma lesson.
 *
 * The error path is the one a differential invites: review the alternatives
 * and the ventilation risks before calling critical care. It is an ordering
 * error rather than a treatment error, because this lesson delivers no
 * treatment. What it skips is the escalation, and the objective it belongs to
 * says why: escalation does not wait for another treatment cycle, a complete
 * differential, or further deterioration.
 */
export const ACUTE_SEVERE_ASTHMA_FIXTURES = {
  scenarioId: 'acute-severe-asthma', contentVersion: '0.1.0', seed: 7314,
  noAction: [],
  expert: [
    [0, 'reconcile-acute-severe-asthma-treatment-and-trajectory'],
    [1, 'recognize-acute-severe-asthma-respiratory-failure'],
    [2, 'activate-acute-severe-asthma-critical-care-escalation'],
    [3, 'review-acute-severe-asthma-alternatives-and-ventilation-risks'],
    [4, 'handoff-acute-severe-asthma-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-acute-severe-asthma-treatment-and-trajectory'],
    [1, 'recognize-acute-severe-asthma-respiratory-failure'],
    [2, 'review-acute-severe-asthma-alternatives-and-ventilation-risks'],
  ],
  recovery: [
    [0, 'reconcile-acute-severe-asthma-treatment-and-trajectory'],
    [1, 'recognize-acute-severe-asthma-respiratory-failure'],
    [2, 'review-acute-severe-asthma-alternatives-and-ventilation-risks'],
    [3, 'activate-acute-severe-asthma-critical-care-escalation'],
    [4, 'review-acute-severe-asthma-alternatives-and-ventilation-risks'],
    [5, 'handoff-acute-severe-asthma-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AcuteSevereAsthmaAction])[];
  expert: readonly (readonly [number, AcuteSevereAsthmaAction])[];
  commonError: readonly (readonly [number, AcuteSevereAsthmaAction])[];
  recovery: readonly (readonly [number, AcuteSevereAsthmaAction])[];
};
