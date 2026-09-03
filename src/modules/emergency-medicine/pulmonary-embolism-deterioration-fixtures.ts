import type { PulmonaryEmbolismAction } from './pulmonary-embolism-deterioration';

/**
 * Reference transcripts for the emergency pulmonary-embolism lesson.
 *
 * The common-error path is the one that treats an intermediate-risk PE as a
 * finished decision: severity is reviewed, oxygen and anticoagulation are
 * recorded, and the run reaches straight for the escalation without ever
 * looking again — so it never sees the pressure fall. It is refused, because
 * the deterioration has to be recognised before it can be acted on. The
 * recovery path reaches for oxygen before the severity review and is refused,
 * reassesses on the same tick as the last intent and is refused again, and
 * still completes from the same positions.
 */
export const PULMONARY_EMBOLISM_FIXTURES = {
  scenarioId: 'pulmonary-embolism-deterioration', contentVersion: '0.1.0', seed: 5936,
  noAction: [],
  expert: [
    [0, 'review-confirmed-pe-severity'],
    [1, 'record-titrated-oxygen'],
    [2, 'record-therapeutic-anticoagulation-intent'],
    [3, 'reassess-for-deterioration'],
    [4, 'activate-pert-and-record-reperfusion-intent'],
  ],
  commonError: [
    [0, 'review-confirmed-pe-severity'],
    [1, 'record-titrated-oxygen'],
    [2, 'record-therapeutic-anticoagulation-intent'],
    // Straight to escalation, without ever looking again.
    [3, 'activate-pert-and-record-reperfusion-intent'],
  ],
  recovery: [
    // Oxygen before the confirmed severity has been read.
    [0, 'record-titrated-oxygen'],
    [1, 'review-confirmed-pe-severity'],
    [2, 'record-titrated-oxygen'],
    [3, 'record-therapeutic-anticoagulation-intent'],
    // The reassessment on the same tick as the last intent.
    [3, 'reassess-for-deterioration'],
    [4, 'reassess-for-deterioration'],
    [5, 'activate-pert-and-record-reperfusion-intent'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PulmonaryEmbolismAction])[];
  expert: readonly (readonly [number, PulmonaryEmbolismAction])[];
  commonError: readonly (readonly [number, PulmonaryEmbolismAction])[];
  recovery: readonly (readonly [number, PulmonaryEmbolismAction])[];
};
