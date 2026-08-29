import type { PrognosisQuestionAction } from './prognosis-question';

export const PROGNOSIS_QUESTION_FIXTURES = {
  scenarioId: 'prognosis-question-a-number-he-asked-for', contentVersion: '0.1.0', seed: 4826,
  noAction: [],
  expert: [[0, 'ask-what-he-wants-to-know'], [1, 'record-the-question-as-asked'],
    [2, 'check-what-he-believes-the-treatment-is-for'], [3, 'answer-with-scenarios-not-a-number'],
    [4, 'state-the-direction-of-the-error'], [5, 'review-boundaries'],
    [18010, 'reassess'], [18011, 'handoff']],
  commonError: [[0, 'give-a-single-number'], [1, 'say-nobody-can-know'],
    [2, 'reassure-and-move-on'], [3, 'answer-before-asking-what-he-wants'],
    [9000, 'check-what-was-said']],
  recovery: [[0, 'give-a-single-number'], [1, 'reassure-and-move-on'],
    [2, 'ask-what-he-wants-to-know'], [3, 'record-the-question-as-asked'],
    [4, 'check-what-he-believes-the-treatment-is-for'], [5, 'answer-with-scenarios-not-a-number'],
    [6, 'state-the-direction-of-the-error'], [7, 'review-boundaries'],
    [18020, 'reassess'], [18021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PrognosisQuestionAction])[];
  expert: readonly (readonly [number, PrognosisQuestionAction])[];
  commonError: readonly (readonly [number, PrognosisQuestionAction])[];
  recovery: readonly (readonly [number, PrognosisQuestionAction])[];
};
