import type { MaternalNeonatalHandoffAction } from './maternal-to-neonatal-resuscitation-handoff';

/**
 * Reference transcripts for the maternal-to-neonatal handoff lesson.
 *
 * The response comes before the understanding, so the error path is the
 * ordinary instinct: gather the history before naming who owns which patient.
 * It is an ordering error rather than a treatment error, because this lesson
 * treats nobody. What it skips is the ownership, and with two patients in one
 * room an unnamed owner is how one of them stops being watched.
 */
export const MATERNAL_NEONATAL_HANDOFF_FIXTURES = {
  scenarioId: 'maternal-to-neonatal-resuscitation-handoff', contentVersion: '0.1.0', seed: 7286,
  noAction: [],
  expert: [
    [0, 'activate-obstetrics-maternal-neonatal-handoff-two-patient-team-and-support-ownership'],
    [1, 'reconcile-obstetrics-maternal-neonatal-handoff-antenatal-intrapartum-birth-resuscitation-and-whole-family-context'],
    [2, 'review-obstetrics-maternal-neonatal-handoff-ventilation-priority-response-and-uncertainty-boundaries'],
    [3, 'review-obstetrics-maternal-neonatal-handoff-structured-transfer-readback-and-parallel-readiness'],
    [4, 'review-obstetrics-maternal-neonatal-handoff-fixed-five-minute-qualified-course-report'],
    [5, 'handoff-obstetrics-maternal-neonatal-postresuscitation-monitoring-maternal-family-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-maternal-neonatal-handoff-antenatal-intrapartum-birth-resuscitation-and-whole-family-context'],
    [1, 'review-obstetrics-maternal-neonatal-handoff-ventilation-priority-response-and-uncertainty-boundaries'],
    [2, 'review-obstetrics-maternal-neonatal-handoff-structured-transfer-readback-and-parallel-readiness'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-maternal-neonatal-handoff-antenatal-intrapartum-birth-resuscitation-and-whole-family-context'],
    [1, 'activate-obstetrics-maternal-neonatal-handoff-two-patient-team-and-support-ownership'],
    [2, 'reconcile-obstetrics-maternal-neonatal-handoff-antenatal-intrapartum-birth-resuscitation-and-whole-family-context'],
    [3, 'review-obstetrics-maternal-neonatal-handoff-ventilation-priority-response-and-uncertainty-boundaries'],
    [4, 'review-obstetrics-maternal-neonatal-handoff-structured-transfer-readback-and-parallel-readiness'],
    [5, 'review-obstetrics-maternal-neonatal-handoff-fixed-five-minute-qualified-course-report'],
    [6, 'handoff-obstetrics-maternal-neonatal-postresuscitation-monitoring-maternal-family-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MaternalNeonatalHandoffAction])[];
  expert: readonly (readonly [number, MaternalNeonatalHandoffAction])[];
  commonError: readonly (readonly [number, MaternalNeonatalHandoffAction])[];
  recovery: readonly (readonly [number, MaternalNeonatalHandoffAction])[];
};
