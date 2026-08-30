import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { RareEarlyMyocarditisSnapshot } from '@platform/kernel/protocol';
import { supportsRareEarlyMyocarditis, type RareEarlyMyocarditisAction } from '../rare-early-myocarditis';

export const RARE_EARLY_MYOCARDITIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsRareEarlyMyocarditisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRareEarlyMyocarditis(scenario);
}

export interface RareEarlyMyocarditisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RareEarlyMyocarditisAction; readonly finished?: boolean;
}

/**
 * The worked example for a base rate that is not a threshold.
 *
 * The monitoring beat is the one that has to happen, and the scenario makes that
 * literal: conduction only progresses where somebody arranged a monitor, so an
 * example that skipped it would run to handoff having seen nothing and would look
 * exactly as complete. What it demonstrates is therefore not thoroughness but the
 * difference between watching and not watching.
 */
export function rareEarlyMyocarditisDemonstrationStep(
  patient?: RareEarlyMyocarditisSnapshot,
): RareEarlyMyocarditisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The interval, the findings that do not sound cardiac, and what the monitor recorded are handed to both teams with the diagnosis unconfirmed. This ends the example, not the monitoring.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.intervalRecordedAtTick === null) {
    return { id: 'interval', focus: 'actions', progress: 0.07, action: 'record-the-exposure-interval',
      narration: 'Record how long he has been on it against when this is described as starting. The interval is decidable; the base rate is not. How rare something is cannot tell you whether this is it — it can only tell you how often you will be wrong, which is a different question from whether to look.' };
  }
  if (patient.nonCardiacRecordedAtTick === null) {
    return { id: 'non-cardiac', focus: 'actions', progress: 0.18, action: 'record-what-is-present-that-is-not-cardiac',
      narration: 'Record what is present that does not sound cardiac. Those are the findings carrying information here, and they are the ones a coronary pathway will step over on its way to an unhelpful answer.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.30, action: 'arrange-continuous-rhythm-monitoring',
      narration: 'Arrange continuous rhythm monitoring now. Conduction is the part of this that moves first and the part nobody sees without a monitor. This is the beat the example exists to show: without it the rest of the lesson runs identically and finds nothing.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.44, action: 'escalate-to-both-teams',
      narration: 'Contact both teams rather than one. Cardiology without the treating service loses the exposure; the treating service without cardiology loses the rhythm. Calling one of them is how this becomes nobody’s.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.55, action: 'record-bounded-treatment-intent',
      narration: 'Record bounded treatment intent and give nothing. Imaging, further testing, immunosuppressive treatment and whether the drug is ever restarted are joint decisions for the teams now involved.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.64, action: 'review-boundaries',
      narration: 'Review what is not settled. No diagnosis is confirmed here and no imaging is available, and a rhythm that has not yet moved is not evidence that it will not.' };
  }
  if (!patient.conductionProgressed) {
    return { id: 'observe-rhythm', focus: 'monitor', progress: 0.74,
      narration: 'Watch the rhythm that was asked for. This authored interval is a contrast rather than a required clinical wait, and what it is about to show is visible only because a monitor was arranged.' };
  }
  if (!patient.teamsResponded) {
    return { id: 'observe-teams', focus: 'monitor', progress: 0.84,
      narration: 'The first-degree block has become intermittent Mobitz type I, with no symptoms alongside it, and he is still sitting up talking. That he feels no different is not evidence the conduction has stopped moving. Keep him monitored while both teams answer.' };
  }
  if (!patient.teamsObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.92, action: 'reassess',
      narration: 'Take a current assessment including the rhythm, now both teams have answered and taken joint ownership. The rhythm is the part that moved, so a handoff without it would carry the least current half of this.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off with the diagnosis unconfirmed. A confirmed diagnosis, an imaging result, and a stable rhythm are not handoff gates. What travels is the interval, what does not sound cardiac, and what the monitor recorded.' };
}
