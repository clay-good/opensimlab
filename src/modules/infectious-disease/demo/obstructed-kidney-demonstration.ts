import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { ObstructedKidneySnapshot } from '@platform/kernel/protocol';
import { supportsObstructedKidney, type ObstructedKidneyAction } from '../obstructed-kidney';
import { obstructedKidneyInlinePrompt } from '../obstructed-kidney-tutor';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ObstructedKidneySnapshot): string {
  const prompt = obstructedKidneyInlinePrompt('guided', { scenarioVersion: '0.1.0', obstructedKidney: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const OBSTRUCTED_KIDNEY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsObstructedKidneyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsObstructedKidney(scenario);
}

export interface ObstructedKidneyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ObstructedKidneyAction; readonly finished?: boolean;
}

/**
 * The worked example for an obstruction antimicrobials cannot reach.
 *
 * The example never picks a drainage route and never names an hour. The
 * randomised evidence has not separated nephrostomy from stenting, and no
 * guideline states a threshold here, so an example that supplied either would
 * be inventing the specificity the lesson exists to withhold. What it records is
 * that decompression is urgent, who owns it, and that the stone is a separate
 * decision from the drainage.
 */
export function obstructedKidneyDemonstrationStep(
  patient?: ObstructedKidneySnapshot,
): ObstructedKidneyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The obstruction travels as unrelieved, the decompression as intended and urgent, and the stone as a decision for later. No route was chosen here and no deadline was invented. This ends the example, not the illness.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.08, action: 'recognize-obstruction',
      narration: 'Name the fever and the obstruction as one thing. Flank pain, systemic upset, and an obstructing stone with hydronephrosis are not an infection that happens to coincide with a stone — read separately, this looks like something antimicrobials can finish.' };
  }
  if (patient.urologyAtTick === null) {
    return { id: 'urology', focus: 'actions', progress: 0.2, action: 'call-urology',
      narration: 'Involve urology and interventional radiology together, and tell them what this is. They are the people who can relieve it, and early notice makes the timing theirs to work with rather than yours to guess at.' };
  }
  if (patient.culturesAtTick === null) {
    return { id: 'cultures', focus: 'actions', progress: 0.3, action: 'request-cultures',
      narration: 'Request blood and urine cultures, and ask for a sample from the collecting system at decompression. The upstream sample can differ from the bladder one, which is the reason for asking rather than a formality — and none of it gates the drainage.' };
  }
  if (patient.decompressionIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.42, action: 'record-decompression-intent',
      narration: 'Record bounded intent for urgent decompression. Both routes are acceptable and the choice belongs to the team; what this records is that it should happen urgently, not how it should be done.' };
  }
  if (patient.stoneDeferralAtTick === null) {
    return { id: 'defer', focus: 'actions', progress: 0.54, action: 'defer-stone-treatment',
      narration: 'Defer definitive stone treatment explicitly. Decompression relieves the obstruction and does not remove the stone, and saying so now keeps two decisions from collapsing into one later.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.64, action: 'review-boundaries',
      narration: 'Review what the evidence settles. No guideline states an hour threshold here, and randomised evidence has not separated nephrostomy from stenting on clinical outcomes. The urgency is well supported; a number and a modality are not.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.72, action: 'monitor',
      narration: 'Set the observation cadence to the current risk. Lack of improvement after an intervention is a finding in itself, and the cadence is what makes it visible rather than remembered.' };
  }
  if (patient.decompressionDueInSeconds !== null) {
    return { id: 'observe', focus: 'monitor', progress: 0.82,
      narration: narrate(patient) };
  }
  if (!patient.untreatedResponseObserved && !patient.decompressedResponseObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.9, action: 'reassess',
      narration: 'Take a current full assessment. A request is not a response, and what the lactate and the perfusion say now is the only thing that describes where this has actually got to.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the obstruction as unrelieved until it is relieved, the decompression as intended, and the stone as a separate decision. A falling marker and a chosen route were never the gates.' };
}
