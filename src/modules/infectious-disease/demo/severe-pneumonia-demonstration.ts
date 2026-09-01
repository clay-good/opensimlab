import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { SeverePneumoniaSnapshot } from '@platform/kernel/protocol';
import { supportsSeverePneumonia, type SeverePneumoniaAction } from '../severe-pneumonia';

export const SEVERE_PNEUMONIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSeverePneumoniaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSeverePneumonia(scenario);
}

export interface SeverePneumoniaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SeverePneumoniaAction; readonly finished?: boolean;
}

/**
 * The worked example for two instruments that both read correctly.
 *
 * The example never says the mortality score is wrong, because it is not: it is
 * answering thirty-day mortality, and the lower band it produces is the correct
 * answer to a question nobody asked here. It calls critical care while the
 * patient is still on a ward trajectory, which is the only moment the request
 * costs anything to make, and it selects no device, no setting, and no bed.
 */
export function severePneumoniaDemonstrationStep(
  patient?: SeverePneumoniaSnapshot,
): SeverePneumoniaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The criteria travel, the request travels, and the oxygen requirement travels with its inspired fraction. The prognostic score was never wrong and was never the question. This ends the example, not the illness.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.reconciliationAtTick === null) {
    return { id: 'reconcile', focus: 'actions', progress: 0.1, action: 'reconcile-supplied-scores',
      narration: 'Put both supplied scores side by side as they stand. They disagree, and both are calculated correctly — recording that turns a contradiction into something you can reason about rather than pick between.' };
  }
  if (patient.mismatchAtTick === null) {
    return { id: 'mismatch', focus: 'actions', progress: 0.26, action: 'recognize-instrument-mismatch',
      narration: 'Name what each was validated to answer. One is prognostic, for thirty-day mortality and the decision to admit; the other counts severity criteria that speak to level of care. The lower number is not an error — it is an answer to a question you did not ask.' };
  }
  if (patient.criticalCareAtTick === null) {
    return { id: 'critical-care', focus: 'actions', progress: 0.42, action: 'call-critical-care',
      narration: 'Request critical-care review now, while he is on a ward trajectory and still talking to you. State the severity criteria met rather than the mortality band: it is a review rather than an admission, and this is the only moment the request costs anything to make.' };
  }
  if (patient.escalationIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.56, action: 'record-escalation-intent',
      narration: 'Record bounded intent for anticipated escalation of respiratory and circulatory support. No oxygen device, ventilator setting, or bed is selected here; what is recorded is what critical care is being asked to review.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review what each number can carry. The mortality score supports place-of-care decisions only alongside clinical judgement in the guideline that uses it that way, and the C-reactive protein appears in no criteria set here — nor does the sodium, however abnormal either looks.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.78, action: 'monitor',
      narration: 'Watch the oxygen requirement rather than the saturation alone. Ninety-two percent on room air and ninety-two percent on a third inspired oxygen describe very different lungs.' };
  }
  if (patient.deteriorationDueInSeconds !== null) {
    return { id: 'observe', focus: 'monitor', progress: 0.86,
      narration: 'Keep watching while the authored interval runs. It is a contrast rather than a real rate of deterioration, and the request does not need restating while it passes.' };
  }
  if (!patient.deteriorationObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.92, action: 'reassess',
      narration: 'Take a current full assessment. A request is not a review and elapsed time is not an observation; the oxygen requirement and the conscious level now are what the reviewing team will work from.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the criteria rather than the score, with the request already made and the oxygen requirement quoted with its fraction. A reassuring prognostic number was never able to answer this.' };
}
