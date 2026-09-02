import type { ShoulderDystociaAction } from './shoulder-dystocia-cognitive-sequence';

/**
 * Reference transcripts for the shoulder-dystocia lesson.
 *
 * The response comes before the understanding here too, so the error path is
 * the ordinary instinct: take in what has happened before calling the
 * emergency and starting the head-delivery clock. It is an ordering error
 * rather than a treatment error, because this lesson performs no maneuver.
 * What it skips is the activation, and the clock it skips is the one every
 * later decision is timed against.
 */
export const SHOULDER_DYSTOCIA_FIXTURES = {
  scenarioId: 'shoulder-dystocia-cognitive-sequence', contentVersion: '0.1.0', seed: 7202,
  noAction: [],
  expert: [
    [0, 'activate-obstetrics-shoulder-dystocia-emergency-response-head-delivery-clock-leader-timekeeper-newborn-and-support-roles'],
    [1, 'reconcile-obstetrics-shoulder-dystocia-head-delivery-gentle-traction-failure-position-pushing-and-whole-person'],
    [2, 'review-obstetrics-shoulder-dystocia-stop-pushing-no-fundal-pressure-no-forceful-traction-and-first-line-position-boundary'],
    [3, 'review-obstetrics-shoulder-dystocia-qualified-escalation-maneuvers-episiotomy-access-rescue-and-documentation-boundary'],
    [4, 'review-obstetrics-shoulder-dystocia-fixed-qualified-delivery-and-immediate-risk-report'],
    [5, 'handoff-obstetrics-shoulder-dystocia-maternal-newborn-injury-hemorrhage-support-documentation-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-shoulder-dystocia-head-delivery-gentle-traction-failure-position-pushing-and-whole-person'],
    [1, 'review-obstetrics-shoulder-dystocia-stop-pushing-no-fundal-pressure-no-forceful-traction-and-first-line-position-boundary'],
    [2, 'review-obstetrics-shoulder-dystocia-qualified-escalation-maneuvers-episiotomy-access-rescue-and-documentation-boundary'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-shoulder-dystocia-head-delivery-gentle-traction-failure-position-pushing-and-whole-person'],
    [1, 'activate-obstetrics-shoulder-dystocia-emergency-response-head-delivery-clock-leader-timekeeper-newborn-and-support-roles'],
    [2, 'reconcile-obstetrics-shoulder-dystocia-head-delivery-gentle-traction-failure-position-pushing-and-whole-person'],
    [3, 'review-obstetrics-shoulder-dystocia-stop-pushing-no-fundal-pressure-no-forceful-traction-and-first-line-position-boundary'],
    [4, 'review-obstetrics-shoulder-dystocia-qualified-escalation-maneuvers-episiotomy-access-rescue-and-documentation-boundary'],
    [5, 'review-obstetrics-shoulder-dystocia-fixed-qualified-delivery-and-immediate-risk-report'],
    [6, 'handoff-obstetrics-shoulder-dystocia-maternal-newborn-injury-hemorrhage-support-documentation-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ShoulderDystociaAction])[];
  expert: readonly (readonly [number, ShoulderDystociaAction])[];
  commonError: readonly (readonly [number, ShoulderDystociaAction])[];
  recovery: readonly (readonly [number, ShoulderDystociaAction])[];
};
