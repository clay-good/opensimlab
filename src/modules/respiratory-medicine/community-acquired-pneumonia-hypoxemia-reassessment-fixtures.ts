import type { CapHypoxemiaAction } from './community-acquired-pneumonia-hypoxemia-reassessment';

/**
 * Reference transcripts for the hypoxemic-pneumonia lesson.
 *
 * The error path is the one a clear chest film invites: go to the evidence and
 * the severity score before corroborating and supporting the hypoxemia. It is
 * an ordering error rather than a treatment error, because this lesson
 * delivers no oxygen. What it skips is the step where a saturation of 85% is
 * confirmed as real and answered.
 */
export const CAP_HYPOXEMIA_FIXTURES = {
  scenarioId: 'community-acquired-pneumonia-hypoxemia-reassessment', contentVersion: '0.1.0', seed: 7342,
  noAction: [],
  expert: [
    [0, 'corroborate-and-support-cap-hypoxemia'],
    [1, 'reconcile-cap-evidence-and-dangerous-alternatives'],
    [2, 'classify-cap-severity-and-escalation-needs'],
    [3, 'record-cap-testing-and-empiric-treatment-intent'],
    [4, 'handoff-cap-hypoxemia-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-cap-evidence-and-dangerous-alternatives'],
    [1, 'classify-cap-severity-and-escalation-needs'],
    [2, 'record-cap-testing-and-empiric-treatment-intent'],
  ],
  recovery: [
    [0, 'reconcile-cap-evidence-and-dangerous-alternatives'],
    [1, 'corroborate-and-support-cap-hypoxemia'],
    [2, 'reconcile-cap-evidence-and-dangerous-alternatives'],
    [3, 'classify-cap-severity-and-escalation-needs'],
    [4, 'record-cap-testing-and-empiric-treatment-intent'],
    [5, 'handoff-cap-hypoxemia-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CapHypoxemiaAction])[];
  expert: readonly (readonly [number, CapHypoxemiaAction])[];
  commonError: readonly (readonly [number, CapHypoxemiaAction])[];
  recovery: readonly (readonly [number, CapHypoxemiaAction])[];
};
