import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { MeningococcalSepsisSnapshot } from '@platform/kernel/protocol';
import { supportsMeningococcalSepsis, type MeningococcalSepsisAction } from '../meningococcal-sepsis';

export const MENINGOCOCCAL_SEPSIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMeningococcalSepsisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMeningococcalSepsis(scenario);
}

export interface MeningococcalSepsisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MeningococcalSepsisAction; readonly finished?: boolean;
}

/**
 * The worked example for a presentation that will not wait for a result.
 *
 * The example never states the diagnosis, because recognizing a pattern is not
 * confirming one and nothing in this lesson confirms anything. It selects no
 * agent, dose, route, or rate — what it records is intent, which is what the
 * qualified team acts on. And it does not reach for the consultant early: that
 * escalation answers an inadequate response an hour on, so the example waits for
 * the authored review to show one rather than performing the escalation because
 * a demonstration ought to contain it.
 */
export function meningococcalSepsisDemonstrationStep(
  patient?: MeningococcalSepsisSnapshot,
): MeningococcalSepsisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The suspicion travels with what could not exclude it, the recorded intents, and the response as it was actually observed. No organism was named and no diagnosis was made. This ends the example, not the illness.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.rashRecognizedAtTick === null) {
    return { id: 'rash', focus: 'actions', progress: 0.06, action: 'recognize-rash',
      narration: 'Record the pattern as a pattern: a non-blanching rash with lesions over 2 mm in a febrile, poorly perfused young person. Recognition is not a diagnosis, and it is not waiting for one either.' };
  }
  if (patient.seniorAtTick === null) {
    return { id: 'senior', focus: 'actions', progress: 0.16, action: 'call-senior',
      narration: 'Give a senior decision maker ownership now. Urgent assessment, the alternatives, and the antimicrobial decision belong with one person who knows this exists, and telling them is the fastest thing here.' };
  }
  if (patient.bloodsAtTick === null) {
    return { id: 'bloods', focus: 'actions', progress: 0.26, action: 'request-bloods',
      narration: 'Request the sampling alongside everything else rather than ahead of it: culture, a gas with lactate and glucose, counts, clotting, and the molecular tests. None of them is a gate on what follows.' };
  }
  if (patient.antimicrobialIntentAtTick === null) {
    return { id: 'antimicrobial', focus: 'actions', progress: 0.38, action: 'record-antimicrobial-intent',
      narration: 'Record bounded antimicrobial intent for delivery within the hour. No agent, dose, route, dilution, or infusion is selected here, and none has to be for the clock to start.' };
  }
  if (patient.fluidIntentAtTick === null) {
    return { id: 'fluid', focus: 'actions', progress: 0.48, action: 'record-fluid-intent',
      narration: 'Record fluid intent together with the critical-care referral. Central access and vasoactive support are decisions for the team being referred to; the referral is what puts them in front of it.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.58, action: 'review-boundaries',
      narration: 'Review what cannot exclude this. An unimpressive C-reactive protein, procalcitonin, or white cell count does not rule it out — the markers lag, and a low count can be the illness. Prior MenACWY does not cover serogroup B.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.66, action: 'monitor',
      narration: 'Set continuous or half-hourly observations with a track-and-trigger tool and a recorded conscious level. A laboratory-only or perfusion-only look is not the same as watching the patient.' };
  }
  if (patient.responseDueInSeconds !== null) {
    return { id: 'observe', focus: 'monitor', progress: 0.74,
      narration: 'Keep watching while the authored review interval runs. It is a contrast rather than a real response time, and nothing about the recorded intent needs restating while it passes.' };
  }
  if (!patient.treatedResponseObserved && !patient.incompleteResponseObserved
    && !patient.attendanceResponseObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.82, action: 'reassess',
      narration: 'Take a current full assessment. Requests and elapsed time are not an observed response; what counts is the perfusion and the conscious level in front of you now.' };
  }
  if (patient.incompleteResponseObserved && patient.consultantAtTick === null) {
    return { id: 'consultant', focus: 'actions', progress: 0.9, action: 'escalate-consultant',
      narration: 'The hour has passed and the response is inadequate, so alert a consultant to attend in person. That specific finding is what this escalation answers, which is exactly why it was not available before now.' };
  }
  if (patient.consultantAtTick !== null && !patient.attendanceResponseObserved) {
    return { id: 'recheck', focus: 'actions', progress: 0.94, action: 'reassess',
      narration: 'Reassess once more with attendance requested. The escalation is a request rather than an arrival, and the record should say which of the two it is.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the suspicion with what could not exclude it, the recorded intents, and the response as observed. A confirmed organism and a corrected lactate were never the gates.' };
}
