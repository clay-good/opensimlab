import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { AfferentLimbSnapshot } from '@platform/kernel/protocol';
import { supportsAfferentLimb, type AfferentLimbAction } from '../afferent-limb';

export const AFFERENT_LIMB_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAfferentLimbDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAfferentLimb(scenario);
}

export interface AfferentLimbDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AfferentLimbAction; readonly finished?: boolean;
}

/**
 * The worked example for a threshold met and a call not made.
 *
 * The example calls early, which means the second conversation that would have
 * made it harder never happens. That is deliberate rather than convenient: the
 * lesson is that the obstacles grow while the call is postponed, and the way to
 * show it is to make the call before they do. It also refuses the two comforts
 * on offer — asking permission first, and treating closer observation as the
 * response — and it does not have the patient improve to justify the call
 * afterwards, because a call justified by its outcome is the wrong lesson.
 */
export function afferentLimbDemonstrationStep(patient?: AfferentLimbSnapshot): AfferentLimbDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The criteria, the call made on them, and the reasons it nearly did not happen all travel together. Nothing here was vindicated by an outcome, and nothing needed to be. This ends the example, not the admission.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.criteriaRecordedAtTick === null) {
    return { id: 'criteria', focus: 'actions', progress: 0.08, action: 'record-the-met-criteria',
      narration: `Write down which criteria are met: ${patient.metCriteriaCount} of ${patient.totalCriteriaCount}, against a policy threshold of ${patient.policyThreshold}. Recorded, that is something anyone can check. Unrecorded, it is a judgement being made alone.` };
  }
  if (patient.obstaclesRecordedAtTick === null) {
    return { id: 'obstacles', focus: 'actions', progress: 0.22, action: 'record-the-obstacles',
      narration: 'Write down the reasons not to call, plainly, because they are real. The team attended yesterday and found nothing, they are busy, and the last conversation was uncomfortable. Naming them is not agreeing with them; it is how they stop working on you silently.' };
  }
  if (patient.calledAtTick === null) {
    return { id: 'call', focus: 'actions', progress: 0.4, action: 'call-the-response-team',
      narration: 'Call the response team now, on the criteria. Not the covering doctor first, and not after asking whether it is alright to call: the criteria are the authorisation, and calling now is what stops the reasons against it accumulating.' };
  }
  if (patient.concernStatedAtTick === null) {
    return { id: 'state', focus: 'actions', progress: 0.56, action: 'state-the-concern-explicitly',
      narration: 'Say it out loud to the person who answered: which criteria are met, what has changed since yesterday, and what you are asking for. A concern written in the notes has not been stated to anybody.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review how this system fails. The call never made or made late appears in roughly a fifth to a third of reviewed adverse events, and calling the covering doctor instead of the team is the documented substitution rather than a safer route.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.78, action: 'monitor',
      narration: 'Increase the observation and record why. It is not an alternative to the call that has already been made — a patient watched more closely while nobody comes is still a patient nobody has come to.' };
  }
  if (!patient.teamArrived) {
    return { id: 'await', focus: 'monitor', progress: 0.86,
      narration: 'Keep the increased observation going while the team is awaited. This authored interval predicts no real response time, and nothing about the criteria needs re-justifying while you wait.' };
  }
  if (!patient.arrivalObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.92, action: 'reassess',
      narration: 'Take a current assessment now they are here. Nothing about her has changed since the criteria were first met, which is the point rather than an anticlimax: the call was correct when it was made, not because of what followed.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the criteria as recorded, that the call was made on them, and what nearly stopped it. A resolved patient and a vindicated call were never the gates.' };
}
