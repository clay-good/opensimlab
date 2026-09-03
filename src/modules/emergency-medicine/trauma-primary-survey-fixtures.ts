import type { TraumaPrimarySurveyAction } from './trauma-primary-survey';

/**
 * Reference transcripts for the emergency trauma-primary-survey lesson.
 *
 * The common-error path is the one that starts at A: the handoff is received
 * and the run goes straight to the airway and breathing review with a leg still
 * bleeding after failed direct pressure. It is refused, because the C in front
 * of ABCDE is not decoration. The recovery path skips each intervening step in
 * turn, is refused for both, and still completes from the same positions.
 */
export const TRAUMA_PRIMARY_SURVEY_FIXTURES = {
  scenarioId: 'trauma-primary-survey', contentVersion: '0.1.0', seed: 2244,
  noAction: [],
  expert: [
    [0, 'activate-trauma-primary-survey'],
    [1, 'control-trauma-catastrophic-hemorrhage'],
    [2, 'review-trauma-airway-and-breathing'],
    [3, 'record-trauma-circulation-response'],
    [4, 'review-trauma-disability-and-exposure'],
    [5, 'repeat-trauma-primary-survey'],
  ],
  commonError: [
    [0, 'activate-trauma-primary-survey'],
    // Straight to A, with the leg still bleeding.
    [1, 'review-trauma-airway-and-breathing'],
  ],
  recovery: [
    // The tourniquet before the handoff has been received.
    [0, 'control-trauma-catastrophic-hemorrhage'],
    [1, 'activate-trauma-primary-survey'],
    [2, 'control-trauma-catastrophic-hemorrhage'],
    [3, 'review-trauma-airway-and-breathing'],
    // The repeat survey before D and E have been completed.
    [4, 'repeat-trauma-primary-survey'],
    [5, 'record-trauma-circulation-response'],
    [6, 'review-trauma-disability-and-exposure'],
    [7, 'repeat-trauma-primary-survey'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, TraumaPrimarySurveyAction])[];
  expert: readonly (readonly [number, TraumaPrimarySurveyAction])[];
  commonError: readonly (readonly [number, TraumaPrimarySurveyAction])[];
  recovery: readonly (readonly [number, TraumaPrimarySurveyAction])[];
};
