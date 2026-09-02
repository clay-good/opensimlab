import type { MeningitisAction } from './acute-bacterial-meningitis-first-hour';

/**
 * Reference transcripts for the bacterial-meningitis lesson.
 *
 * The error path is the one a solvable puzzle invites: go straight to whether
 * she needs a scan before the tap, and work the diagnostic question alone. It
 * is an ordering error rather than a treatment error, because this lesson
 * delivers no treatment. What it skips is the beat that turns a single
 * clinician thinking hard into a time-critical service with infection,
 * neurology, resuscitation, nursing and precaution owners — and in this
 * illness the hour is spent by whoever is not yet in the room. The recovery
 * path starts from that refusal and still reaches a correct handoff in the same
 * run.
 */
export const MENINGITIS_FIXTURES = {
  scenarioId: 'acute-bacterial-meningitis-first-hour', contentVersion: '0.1.0', seed: 6433,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient'],
    [1, 'activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership'],
    [2, 'review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary'],
    [3, 'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay'],
    [4, 'review-neurology-meningitis-strict-later-csf-clinical-and-supplied-treatment-trajectory'],
    [5, 'handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient'],
    [1, 'review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary'],
    [2, 'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay'],
  ],
  recovery: [
    [0, 'reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient'],
    [1, 'review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary'],
    [2, 'activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership'],
    [3, 'review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary'],
    [4, 'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay'],
    [5, 'review-neurology-meningitis-strict-later-csf-clinical-and-supplied-treatment-trajectory'],
    [6, 'handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MeningitisAction])[];
  expert: readonly (readonly [number, MeningitisAction])[];
  commonError: readonly (readonly [number, MeningitisAction])[];
  recovery: readonly (readonly [number, MeningitisAction])[];
};
