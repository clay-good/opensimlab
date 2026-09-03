import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMagnesiumToxicity, type MagnesiumToxicityAction, type MagnesiumToxicityProgress,
} from '../magnesium-sulfate-toxicity-recognition';
import { magnesiumToxicityInlinePrompt } from '../tutor/magnesium-sulfate-toxicity-recognition-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: MagnesiumToxicityProgress): string {
  const prompt = magnesiumToxicityInlinePrompt('guided', { scenarioVersion: '0.1.0', magnesiumToxicity: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const MAGNESIUM_TOXICITY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMagnesiumToxicityDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMagnesiumToxicity(scenario);
}

export interface MagnesiumToxicityDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MagnesiumToxicityAction; readonly finished?: boolean;
}

/**
 * The worked example for the quietest emergency in the module.
 *
 * Nothing here looks like a crisis, which is what magnesium does and why this
 * is missed. This example examines nobody, changes no infusion, manages no
 * airway, delivers no oxygen or ventilation, and selects no calcium or any
 * other drug.
 */
export function magnesiumToxicityDemonstrationStep(
  patient?: MagnesiumToxicityProgress,
): MagnesiumToxicityDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on better and still full of magnesium, with the kidneys that caused this no better than they were. Nothing was proven and nothing was excluded — not the reversal, not the clearance, not the other things this could also be. This ends the example, not the toxicity.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-magnesium-toxicity-airway-anesthesia-critical-care-pharmacy-and-support-response',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-magnesium-toxicity-exposure-renal-respiratory-reflex-neurologic-and-whole-person',
      narration: narrate(patient) };
  }
  if (patient.uncertaintyAtTick === null) {
    return { id: 'uncertainty', focus: 'actions', progress: 0.46, action: 'review-obstetrics-magnesium-toxicity-multisignal-level-unit-and-alternative-cause-boundaries',
      narration: narrate(patient) };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.64, action: 'review-obstetrics-magnesium-toxicity-source-stop-airway-ventilation-antidote-monitoring-newborn-and-support-readiness',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-magnesium-toxicity-fixed-five-minute-qualified-response-report',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-magnesium-toxicity-respiratory-renal-preeclampsia-medication-newborn-support-and-outcome-risk',
    narration: narrate(patient) };
}
