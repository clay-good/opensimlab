import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { TransientResponseSnapshot } from '@platform/kernel/protocol';
import { supportsTransientResponse, type TransientResponseAction } from '../transient-response';

export const TRANSIENT_RESPONSE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTransientResponseDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTransientResponse(scenario);
}

export interface TransientResponseDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TransientResponseAction; readonly finished?: boolean;
}

/**
 * The worked example for a pressure that answers and will not hold.
 *
 * It never names an injury and never says what an operation would find. It also makes the call
 * before the third fall arrives, on purpose: an example that waited for the pressure to drop
 * again would teach that the next deterioration is what licenses the call, when the whole
 * lesson is that the pattern already on the chart was enough.
 */
export function transientResponseDemonstrationStep(
  patient?: TransientResponseSnapshot,
): TransientResponseDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The decision travels with its clock, owned by the team that can act on it, and nothing about the injury or the outcome is settled here. This ends the example, not his afternoon.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.mechanismRecordedAtTick === null) {
    return { id: 'mechanism', focus: 'actions', progress: 0.08, action: 'record-the-mechanism-and-the-clock',
      narration: `Start with the clock. Front of the car into a barrier at speed, ${patient.minutesSinceInjury} minutes ago, abdomen tender and distending, free fluid already reported by the team that scanned him. Everything after this is a question about how many more minutes, so the minutes go in the record as a number that moves.` };
  }
  if (patient.responseRecordedAtTick === null) {
    return { id: 'shape', focus: 'actions', progress: 0.20, action: 'record-the-shape-of-the-response',
      narration: `Now the shape, not the number. ${patient.bolusCount} boluses: the first held him ${patient.firstResponseHeldMinutes} minutes, the second ${patient.secondResponseHeldMinutes}. Smaller each time, sooner each time. Write that down as a pattern, because the single value on the monitor right now sits inside it and reads like good news.` };
  }
  if (patient.imagingLimitsRecordedAtTick === null) {
    return { id: 'picture', focus: 'actions', progress: 0.32, action: 'record-what-a-picture-cannot-do',
      narration: 'Record both halves of the imaging question and keep them both. Early whole-body imaging was associated with better survival across 4,621 registry patients — this is not an argument against scanning trauma patients. It is an argument about a man who has to stay up for the length of a scan, for a site the free fluid has already made likely, and about what the picture would then not do about it.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.46, action: 'escalate-to-the-theatre-team',
      narration: 'Call them now, while his pressure is one of the better ones you have seen today and nothing has just happened. That is the whole point: the pattern on the chart was already enough, and waiting for the next fall would only mean the call went out with more minutes on it.' };
  }
  if (patient.operativeIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.58, action: 'record-bounded-operative-intent',
      narration: 'Record bounded intent and choose nothing. The transfer, whether any imaging happens on the way or not at all, and the operation with its timing and content belong to them.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review the evidence and notice it arguing. Up to 0.35 percent a minute in 243 registry patients, about 1 percent every 3 minutes. A hazard ratio of 1.89 past ten minutes in 309 patients with gunshot wounds, which that paper’s own conclusion calls almost threefold — read the ratio, not the sentence. And better survival with early imaging in 4,621 others. All retrospective, none randomised, two of them about somebody else.' };
  }
  if (!patient.fallen) {
    return { id: 'hold', focus: 'monitor', progress: 0.78,
      narration: 'Now watch the clock rather than the number. Nothing new is coming to make this decision for you. The next event is the pressure going down again, and it arrives whether or not anybody picked up the phone — which is why the phone came first.' };
  }
  if (!patient.teamResponded) {
    return { id: 'fallen', focus: 'monitor', progress: 0.87,
      narration: 'There it is: 84 over 50, rate 124, five minutes after an answer that lasted nine, and nothing was taken away to cause it. This is not new information. It is the pattern you already recorded, finishing its sentence.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a current assessment now they have answered and repeated the pattern back. They own the transfer, the imaging question and the operation, and all three get decided against the picture your record is holding.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the decision with its clock attached. A named injury, a completed scan and cross-matched blood are not handoff gates. What travels is the mechanism and its minutes, the response as a shrinking pattern, and that nobody waited for a better reason.' };
}
