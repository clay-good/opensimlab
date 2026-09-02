import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsShoulderDystocia, type ShoulderDystociaAction, type ShoulderDystociaProgress,
} from '../shoulder-dystocia-cognitive-sequence';

export const SHOULDER_DYSTOCIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsShoulderDystociaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsShoulderDystocia(scenario);
}

export interface ShoulderDystociaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ShoulderDystociaAction; readonly finished?: boolean;
}

/**
 * The worked example for an emergency whose hardest instruction is to stop
 * doing two things.
 *
 * Almost everything that makes this worse is something a person does under
 * pressure. This example examines nobody, applies no traction or pressure,
 * changes no position, directs no pushing, and performs no maneuver,
 * episiotomy or delivery.
 */
export function shoulderDystociaDemonstrationStep(
  patient?: ShoulderDystociaProgress,
): ShoulderDystociaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The baby is born and nobody has examined either of them yet. Nothing was proven and nothing was excluded — not an injury, not a safe recovery, not what this birth will mean to her. This ends the example, not the care.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-shoulder-dystocia-emergency-response-head-delivery-clock-leader-timekeeper-newborn-and-support-roles',
      narration: 'Say the word out loud, start the clock at the head, and name who does what. Calling it a shoulder dystocia is what brings the extra hands, and naming a leader, a timekeeper, the newborn team and someone to stay with her is what keeps the next two minutes organized rather than frantic. The clock runs from the delivery of the head rather than from the moment anyone realized, because every later decision is timed against that. She is awake and frightened and asking what is happening, so someone talking to her is part of the response.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-shoulder-dystocia-head-delivery-gentle-traction-failure-position-pushing-and-whole-person',
      narration: 'Take the birth facts as given rather than re-testing them. The head delivered twenty seconds ago, it has retracted against the perineum, and the anterior shoulder did not come with routine gentle axial traction. That failed attempt is the diagnosis and does not need repeating. Her own numbers are unremarkable, which is what makes the risk here almost entirely about what happens in the next few minutes rather than about how she is now. The prenatal size estimates are deliberately not in play: they neither predicted this nor rule it out.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.46, action: 'review-obstetrics-shoulder-dystocia-stop-pushing-no-fundal-pressure-no-forceful-traction-and-first-line-position-boundary',
      narration: 'The first two instructions are things to stop, not things to do. Stop the pushing and keep any pressure off the fundus. Fundal pressure drives the shoulder harder into the pubic bone and is associated with both maternal and newborn injury, and continued pushing does the same. The traction that already failed was the right amount — repeating it harder is the specific mechanism by which a brachial plexus is stretched. What is left as a first move is the position change, which costs nothing and works often.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.64, action: 'review-obstetrics-shoulder-dystocia-qualified-escalation-maneuvers-episiotomy-access-rescue-and-documentation-boundary',
      narration: 'Hold the sequence as a menu rather than a script. The qualified maneuvers are ordered by convenience and reversibility rather than by evidence that one must precede another, and moving on quickly matters more than completing anyone’s preferred list. An episiotomy makes room for hands rather than for the shoulder — the obstruction is bone, and cutting soft tissue does not move bone. The rare rescue options exist and belong to the people qualified to do them. Somebody is writing down times while this happens, because that record is the only version of these two minutes that will survive.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-shoulder-dystocia-fixed-qualified-delivery-and-immediate-risk-report',
      narration: 'Read the fixed report as this case rather than as the method. It describes what a qualified team did here and what happened. No maneuver, episiotomy, drug or procedure is chosen here, it is not a universal sequence, and it says nothing about how any other shoulder dystocia resolves.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-shoulder-dystocia-maternal-newborn-injury-hemorrhage-support-documentation-and-outcome-risk',
    narration: 'The baby is out; that establishes no injury status for either of them. Hand off maternal perineal and other trauma, the postpartum hemorrhage risk this raises specifically, the newborn’s neurologic and musculoskeletal examination, the debrief she is owed and will remember, the contemporaneous record, and the review that follows.' };
}
