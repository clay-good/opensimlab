import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { SepticShockLabelSnapshot } from '@platform/kernel/protocol';
import { supportsSepticShockLabel, type SepticShockLabelAction } from '../septic-shock-label';

export const SEPTIC_SHOCK_LABEL_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSepticShockLabelDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsSepticShockLabel(scenario);
}

export interface SepticShockLabelDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SepticShockLabelAction; readonly finished?: boolean;
}

/**
 * The worked example for a label the treatment creates.
 *
 * The classification is not available at the start and the example does not
 * reach for it: the definition needs vasopressors running and a lactate above
 * threshold despite adequate resuscitation, so it can only be read off what the
 * trial produced. Nothing waits for the label either — critical care is
 * activated on the perfusion. The example ends by reporting what the trial
 * showed rather than by announcing a diagnosis it arrived at.
 */
export function septicShockLabelDemonstrationStep(
  patient?: SepticShockLabelSnapshot,
): SepticShockLabelDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'What travels is the perfusion, the trial, and which criteria it did or did not satisfy. The label was never available at the start; it exists now only because the treatment happened. This ends the example, not the illness.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.hypoperfusionAtTick === null) {
    return { id: 'hypoperfusion', focus: 'actions', progress: 0.08, action: 'record-hypoperfusion',
      narration: 'Record what is measurable now, without naming it: a mean arterial pressure of 60, a lactate of 3.6, and no vasopressor running. That is hypoperfusion with infection, which is a description rather than a classification.' };
  }
  if (patient.criticalCareAtTick === null) {
    return { id: 'critical-care', focus: 'actions', progress: 0.22, action: 'activate-critical-care',
      narration: 'Activate critical care on the perfusion pattern rather than on a label. Nothing about the activation waits for the classification — the team is needed for the perfusion, and the label will follow the treatment rather than precede it.' };
  }
  if (patient.classificationOpenAtTick === null) {
    return { id: 'classification', focus: 'actions', progress: 0.36, action: 'record-classification-open',
      narration: 'Record the classification as open, with the reason. Septic shock requires vasopressors holding a mean at or above 65 with a lactate above 2 despite adequate resuscitation. No vasopressor is running, so the criteria cannot be evaluated yet — not because the patient is well.' };
  }
  if (patient.resuscitationIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.5, action: 'record-resuscitation-intent',
      narration: 'Record bounded resuscitation intent against the ceiling. The trial is what makes the definition readable afterwards, and whether the intent fell inside the hour belongs in the record.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.62, action: 'review-boundaries',
      narration: 'Review the recommendations with their grades attached. The 65 mmHg target is strong over higher targets, which is comparative rather than a floor; an elevated lactate in sepsis is not a measure of tissue hypoxia; and the guidance says to individualize fluid after the initial bolus rather than chase the number to normal.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.72, action: 'monitor',
      narration: 'Keep perfusion monitoring running through the resuscitation. The trial is the measurement, and an unmonitored trial measures nothing at all.' };
  }
  if (!patient.trialComplete) {
    return { id: 'observe', focus: 'monitor', progress: 0.82,
      narration: 'Let the resuscitation run and keep watching. This authored interval is a contrast rather than a real response time, and the classification is simply not available until it finishes.' };
  }
  if (!patient.trialObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.9, action: 'reassess',
      narration: `Take a current full assessment now the trial has completed. The definition is readable from what the resuscitation produced: ${patient.vasopressorDependent ? 'a vasopressor is running' : 'no vasopressor is running'}, and the mean pressure and lactate can be read against the criteria.` };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off what the trial showed, with the classification read off it rather than assumed before it. The label the treatment created is the only one available here.' };
}
