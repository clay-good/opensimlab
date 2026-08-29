import type { QuietPatientAction } from './quiet-patient';

export const QUIET_PATIENT_FIXTURES = {
  scenarioId: 'quiet-patient-a-screen-that-was-never-done', contentVersion: '0.1.0', seed: 5291,
  noAction: [],
  expert: [[0, 'review-the-charted-impression'], [1, 'screen-for-arousal'],
    [2, 'record-the-screen-result'], [3, 'escalate-on-the-positive-screen'],
    [4, 'review-boundaries'], [5, 'monitor'], [6, 'reassess'],
    [36010, 'reassess'], [36011, 'handoff']],
  commonError: [[0, 'let-them-sleep-and-screen-later'], [1, 'quiet-is-settled'],
    [2, 'negative-earlier-screen-excludes'], [3, 'call-it-low-mood'], [9000, 'check-chart']],
  recovery: [[0, 'let-them-sleep-and-screen-later'], [1, 'call-it-low-mood'],
    [2, 'review-the-charted-impression'], [3, 'screen-for-arousal'],
    [4, 'record-the-screen-result'], [5, 'escalate-on-the-positive-screen'],
    [6, 'review-boundaries'], [7, 'monitor'], [8, 'reassess'],
    [36020, 'reassess'], [36021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, QuietPatientAction])[];
  expert: readonly (readonly [number, QuietPatientAction])[];
  commonError: readonly (readonly [number, QuietPatientAction])[];
  recovery: readonly (readonly [number, QuietPatientAction])[];
};
