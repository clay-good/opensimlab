import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsSalicylate, type SalicylateAction, type SalicylateProgress,
} from '../salicylate-falling-number';
import { salicylateInlinePrompt } from '../tutor/salicylate-falling-number-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: SalicylateProgress): string {
  const prompt = salicylateInlinePrompt('guided', { scenarioVersion: '0.1.0', salicylate: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const SALICYLATE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSalicylateDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSalicylate(scenario);
}

export interface SalicylateDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SalicylateAction; readonly finished?: boolean;
}

/**
 * The worked example for a poisoning where the number going down is the bad
 * news.
 *
 * Three findings here read backwards, and the example says so each time: the
 * near-normal pH is two disorders cancelling, the fast breathing is the
 * compensation rather than the distress, and the fallen nine-hour concentration
 * arrives with a worse pH, a worse potassium and new confusion. It names the
 * airway as this lesson's hazard — taking over her breathing removes what is
 * holding her pH up — without choosing a technique, a setting, a fluid, a
 * target, or a dialysis threshold, and it finishes on a deterioration rather
 * than on a rescue.
 */
export function salicylateDemonstrationStep(
  patient?: SalicylateProgress,
): SalicylateDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on worse than she arrived, with a lower number in the chart than the one that frightened everybody, and both of those are true at once. Nothing was proven and nothing was excluded. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-salicylate-product-exposure-clock-symptoms-breathing-and-whole-patient',
      narration: 'Describe the breathing as a finding rather than as distress. Seven hours after immediate-release aspirin, with vomiting, tinnitus, diaphoresis, thirst, dry mucosa and reduced urine output, a respiratory rate of 30 is the compensation she is running on. The reported quantity is uncertain and is not a treatment guide, and being alert is not the same as being stable.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-salicylate-mixed-acid-base-pattern-without-single-concentration-closure',
      narration: 'Say what the near-normal pH is actually made of. pH 7.45 with PCO2 23, bicarbonate 16 and an anion gap of 20 is a respiratory alkalosis and an anion-gap metabolic acidosis at the same time, not a patient compensating well. One concentration, unit or gap does not close this: exposure pattern, formulation, ongoing absorption, renal function, potassium, glucose, volume, CNS and pulmonary findings all stay coupled.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-salicylate-poison-center-emergency-critical-care-nephrology-and-safety-ownership',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-salicylate-supplied-serial-level-acid-base-volume-electrolyte-and-airway-boundary',
      narration: 'Read the acid-base, the volume and the potassium before committing to anything, and name the airway as a hazard. A potassium of 3.2 with vomiting and reduced urine output limits what urinary alkalinization can achieve, and she is volume depleted. Taking over her breathing removes the hyperventilation holding her pH up, and a fall in pH drives salicylate into tissue — which makes the airway a decision for the team that will manage the ventilation rather than a default.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-salicylate-bounded-qualified-alkalinization-and-dialysis-preparedness-with-strict-later-review',
      narration: 'Record the alkalinization intent and the dialysis preparedness as intent, let the authored interval pass, and read the qualified team’s 9-hour report. The interval is a contrast rather than a required wait, and nothing here says how fast any individual poisoning moves, in either direction.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-salicylate-cns-pulmonary-acidemia-absorption-extracorporeal-and-active-risk',
    narration: 'Salicylate 46 mg/dL, down from 52 — with pH 7.32, bicarbonate 13, potassium 3.0, a respiratory rate still at 30 and new confusion. That is ominous rather than improvement, and it proves nothing about where the drug went, whether the treatment failed, or whether absorption has stopped. Hand off the CNS deterioration, the pulmonary risk, the acidemia, the potassium, the extracorporeal question and her safety as live.' };
}
