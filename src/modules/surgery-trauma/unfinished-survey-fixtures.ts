import type { UnfinishedSurveyAction } from './unfinished-survey';

export const UNFINISHED_SURVEY_FIXTURES = {
  scenarioId: 'unfinished-survey-a-patient-who-cannot-be-asked', contentVersion: '0.1.0', seed: 5137,
  noAction: [],
  expert: [[0, 'record-why-he-could-not-be-examined'], [1, 'record-what-the-injury-list-rests-on'],
    [2, 'record-that-the-third-survey-is-not-done'], [3, 'escalate-to-the-trauma-team'],
    [4, 'record-bounded-survey-intent'], [5, 'review-boundaries'], [6, 'reassess'],
    [22510, 'reassess'], [22511, 'handoff']],
  commonError: [[0, 'the-secondary-survey-is-documented-complete'],
    [1, 'the-pan-scan-would-have-shown-it'],
    [2, 'he-has-not-complained-of-anything'],
    [3, 'clear-him-now-and-review-if-something-appears'], [9000, 'check-observations']],
  recovery: [[0, 'the-secondary-survey-is-documented-complete'],
    [1, 'he-has-not-complained-of-anything'], [2, 'record-why-he-could-not-be-examined'],
    [3, 'record-what-the-injury-list-rests-on'], [4, 'record-that-the-third-survey-is-not-done'],
    [5, 'escalate-to-the-trauma-team'], [6, 'record-bounded-survey-intent'],
    [7, 'review-boundaries'], [8, 'reassess'],
    [22520, 'reassess'], [22521, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, UnfinishedSurveyAction])[];
  expert: readonly (readonly [number, UnfinishedSurveyAction])[];
  commonError: readonly (readonly [number, UnfinishedSurveyAction])[];
  recovery: readonly (readonly [number, UnfinishedSurveyAction])[];
};
