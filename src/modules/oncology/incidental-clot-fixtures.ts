import type { IncidentalClotAction } from './incidental-clot';

export const INCIDENTAL_CLOT_FIXTURES = {
  scenarioId: 'incidental-clot-a-decision-the-evidence-cannot-make', contentVersion: '0.1.0', seed: 6403,
  noAction: [],
  expert: [[0, 'record-the-finding-and-how-it-was-found'], [1, 'record-the-certainty-of-the-recommendation'],
    [2, 'record-the-benefit-and-the-harm-together'], [3, 'record-this-patients-bleeding-risk'],
    [18010, 'escalate-to-the-treating-service'], [18011, 'record-the-decision-as-shared'],
    [18012, 'review-boundaries'], [18013, 'reassess'], [54020, 'reassess'], [54021, 'handoff']],
  commonError: [[0, 'incidental-so-no-action-needed'], [1, 'a-pe-is-a-pe-so-anticoagulate-now'],
    [2, 'wait-for-symptoms-before-deciding'], [3, 'leave-it-for-the-clinic-letter'],
    [9000, 'check-the-report']],
  recovery: [[0, 'incidental-so-no-action-needed'], [1, 'leave-it-for-the-clinic-letter'],
    [2, 'record-the-finding-and-how-it-was-found'], [3, 'record-the-certainty-of-the-recommendation'],
    [4, 'record-the-benefit-and-the-harm-together'], [5, 'record-this-patients-bleeding-risk'],
    [18020, 'escalate-to-the-treating-service'], [18021, 'record-the-decision-as-shared'],
    [18022, 'review-boundaries'], [18023, 'reassess'], [54030, 'reassess'], [54031, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, IncidentalClotAction])[];
  expert: readonly (readonly [number, IncidentalClotAction])[];
  commonError: readonly (readonly [number, IncidentalClotAction])[];
  recovery: readonly (readonly [number, IncidentalClotAction])[];
};
