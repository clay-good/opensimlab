import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCordProlapse, type CordProlapseAction, type CordProlapseProgress,
} from '../umbilical-cord-prolapse-urgent-birth-coordination';

export const CORD_PROLAPSE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCordProlapseDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCordProlapse(scenario);
}

export interface CordProlapseDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CordProlapseAction; readonly finished?: boolean;
}

/**
 * The worked example for an emergency where everything at the bedside is only a
 * bridge.
 *
 * The only treatment is the birth, and the slowest thing to arrange is the room
 * it happens in. This example examines nobody, handles and replaces no cord,
 * elevates no presenting part, fills no bladder, changes no position, and
 * selects no anesthetic or mode of birth.
 */
export function cordProlapseDemonstrationStep(
  patient?: CordProlapseProgress,
): CordProlapseDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is in theatre with a hand still relieving the cord and a birth that has not happened. Nothing was proven and nothing was excluded — not fetal recovery, not a safe birth, not what this will have cost either of them. This ends the example, not the emergency.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-cord-prolapse-response-diagnosis-clock-theatre-anesthesia-newborn-and-support-roles',
      narration: 'Call it, start the clock at the diagnosis, and get a theatre opened now. The only treatment for a cord prolapse with a compromised fetus is the birth, and the slowest thing to arrange is the room it happens in. So the call goes out before anything else: obstetrics, theatre, anesthesia, the newborn team, a leader, a timekeeper, and someone whose job is to stay with her. She is awake and asking whether her baby is safe, and answering her is part of the response rather than a courtesy added to it.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-cord-prolapse-membrane-rupture-fetal-heart-exam-birth-imminence-and-whole-person',
      narration: 'Take the supplied examination as the diagnosis and read what it implies. Membranes ruptured four minutes ago, a prolonged deceleration followed immediately, and a qualified examination found a pulsating cord past the cervix with a high presenting part at 5 cm. The fetal heart is 72. Two of those facts decide everything: the cord is being compressed, and at 5 cm with a high head this baby is not going to be born vaginally in the next few minutes.' };
  }
  if (patient.bridgeAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.46, action: 'review-obstetrics-cord-prolapse-pressure-relief-minimal-handling-position-and-no-delay-boundaries',
      narration: 'Treat the bedside measures as a bridge rather than as the treatment. The elevation of the presenting part, the left lateral head-down position and the minimal handling of the cord are all holding actions that buy time. None of them relieves the compression permanently, no attempt is made to replace the cord above the presenting part, and — this is the part that goes wrong — none of them is a reason to spend another minute at the bedside. They exist to protect the fetus on the way to theatre, not instead of going.' };
  }
  if (patient.birthPlanAtTick === null) {
    return { id: 'birth-plan', focus: 'actions', progress: 0.64, action: 'review-obstetrics-cord-prolapse-birth-urgency-mode-anesthesia-newborn-documentation-and-safety-boundaries',
      narration: 'Let the urgency be this case rather than a number someone remembers. The mode, the anesthetic and the timing belong to the qualified team, and the decision-to-birth intervals that get quoted are audit standards rather than a deadline that makes a slower birth safe or a faster one unnecessary. What is true here is that the fetus is compromised now and the cervix is 5 cm. Her safety is not traded for speed, the newborn team is there before the birth rather than after, and someone is recording times as this happens.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-cord-prolapse-fixed-persistent-fetal-compromise-and-theatre-transfer-report',
      narration: 'Read the fixed report as this case rather than as what cord prolapse does. It describes persistent compromise and a transfer that has happened. No decompression, anesthetic, mode of birth or procedure is chosen here, it is a contrast rather than a predicted trajectory, and it says nothing about how any other prolapse behaves.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-cord-prolapse-fetal-maternal-theatre-newborn-support-documentation-and-outcome-risk',
    narration: 'The compression is still being relieved by hand, the transfer is done and the birth is not, and nothing here establishes fetal recovery, a completed delivery, a treatment effect or an outcome. Hand off the fetal status, her own safety and anesthesia, the theatre, the newborn team, what she has just been through and will remember, the contemporaneous record, and the review that follows.' };
}
