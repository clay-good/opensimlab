import type { ThirdAttendanceAction } from './third-attendance';

export const THIRD_ATTENDANCE_FIXTURES = {
  scenarioId: 'third-attendance-a-question-two-people-have-already-answered', contentVersion: '0.1.0', seed: 9152,
  noAction: [],
  expert: [[0, 'record-the-attendances-and-what-each-found'], [1, 'record-what-a-previous-assessment-can-say'],
    [2, 'record-what-has-changed-since-the-last-visit'], [3, 'escalate-to-the-surgical-team'],
    [4, 'record-bounded-assessment-intent'], [5, 'review-boundaries'], [6, 'reassess'],
    [24010, 'reassess'], [24011, 'handoff']],
  commonError: [[0, 'she-has-been-seen-twice-already'],
    [1, 'the-notes-say-it-was-settling'],
    [2, 'she-is-anxious-and-keeps-coming-back'],
    [3, 'discharge-her-with-the-same-advice-again'], [8000, 'check-observations']],
  recovery: [[0, 'she-has-been-seen-twice-already'],
    [1, 'the-notes-say-it-was-settling'], [2, 'record-the-attendances-and-what-each-found'],
    [3, 'record-what-a-previous-assessment-can-say'], [4, 'record-what-has-changed-since-the-last-visit'],
    [5, 'escalate-to-the-surgical-team'], [6, 'record-bounded-assessment-intent'],
    [7, 'review-boundaries'], [8, 'reassess'],
    [24020, 'reassess'], [24021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ThirdAttendanceAction])[];
  expert: readonly (readonly [number, ThirdAttendanceAction])[];
  commonError: readonly (readonly [number, ThirdAttendanceAction])[];
  recovery: readonly (readonly [number, ThirdAttendanceAction])[];
};
