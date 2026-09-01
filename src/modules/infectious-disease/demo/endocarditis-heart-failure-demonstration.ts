import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { EndocarditisHeartFailureSnapshot } from '@platform/kernel/protocol';
import { supportsEndocarditisHeartFailure, type EndocarditisHeartFailureAction } from '../endocarditis-heart-failure';

export const ENDOCARDITIS_HEART_FAILURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsEndocarditisHeartFailureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsEndocarditisHeartFailure(scenario);
}

export interface EndocarditisHeartFailureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: EndocarditisHeartFailureAction; readonly finished?: boolean;
}

/**
 * The worked example for two problems on different clocks.
 *
 * The example refers before the patient decompensates, which is where the
 * decision is actually difficult: everything on the chart is improving at that
 * moment, and the improvement is real. It selects no operation and no time,
 * because those belong to the team being referred to, and it ends with the
 * infection still responding — the reassuring facts stay true, which is the
 * whole difficulty rather than a complication of it.
 */
export function endocarditisHeartFailureDemonstrationStep(
  patient?: EndocarditisHeartFailureSnapshot,
): EndocarditisHeartFailureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'Two problems travel on two clocks: an infection that is responding, and a valve that is failing regardless. No operation and no time were chosen here. This ends the example, not the admission.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.1, action: 'recognize-mechanical-failure',
      narration: 'Record this as the valve failing rather than the treatment failing. Breathlessness on day three of appropriate therapy, with new severe regurgitation and a 12 mm vegetation, is mechanical — and the antimicrobials really are working.' };
  }
  if (patient.teamAtTick === null) {
    return { id: 'team', focus: 'actions', progress: 0.26, action: 'call-endocarditis-team',
      narration: 'Convene the endocarditis team and discuss the case with a centre that performs valve surgery. It is the named structure in the guidance rather than a courtesy, and the discussion is what turns timing into a decision instead of a delay.' };
  }
  if (patient.surgicalReferralAtTick === null) {
    return { id: 'referral', focus: 'actions', progress: 0.42, action: 'record-surgical-referral-intent',
      narration: 'Record bounded intent for urgent surgical assessment and transfer, now, while the chart still looks better each day. Nothing here selects an operation, a prosthesis, a theatre slot, or an anaesthetic plan.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.58, action: 'review-boundaries',
      narration: `Review which number belongs to which problem. Falling markers and clearing cultures describe the infection. A pulse pressure of ${patient.pulsePressureMmHg} mmHg does not exclude acute severe regurgitation, because the ventricle has had no time to dilate. Vegetation size is a trigger alongside another indication rather than on its own.` };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.7, action: 'monitor',
      narration: 'Watch the work of breathing and the perfusion rather than the temperature chart. The chart is answering the question that is already going well.' };
  }
  if (patient.decompensationDueInSeconds !== null) {
    return { id: 'observe', focus: 'monitor', progress: 0.8,
      narration: 'Keep watching while the authored interval runs. It is a contrast rather than a real rate of decompensation, and the referral does not need restating while it passes.' };
  }
  if (!patient.decompensationObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.9, action: 'reassess',
      narration: 'Take a current full assessment. The referral is a request rather than an arrival, and what the breathing and the perfusion say now is what the surgical team will actually want.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the mechanical failure, the referral already made, and the fact that the improving markers describe something else. A responding infection was never the question.' };
}
