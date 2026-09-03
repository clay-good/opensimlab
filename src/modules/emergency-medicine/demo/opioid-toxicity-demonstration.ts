import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsOpioidToxicity, type OpioidToxicityAction, type OpioidToxicityProgress,
} from '../opioid-toxicity';
import { opioidToxicityInlinePrompt } from '../tutor/opioid-toxicity-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: OpioidToxicityProgress): string {
  const prompt = opioidToxicityInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const OPIOID_TOXICITY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsOpioidToxicityDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsOpioidToxicity(scenario);
}

export interface OpioidToxicityDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: OpioidToxicityAction;
  readonly finished?: boolean;
}

/**
 * The worked example for an antidote that wears off first.
 *
 * Six beats in the only order the engine accepts, and the example deliberately
 * does not end at the good panel. It examines nobody, confirms no pulse,
 * ventilates nobody, selects no product, route or dose, dispenses nothing,
 * determines no observation period or disposition, and predicts no outcome.
 */
export function opioidToxicityDemonstrationStep(
  patient?: OpioidToxicityProgress,
): OpioidToxicityDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.recurrencePlanAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Two things in this example are worth carrying out of it. The bag came before the syringe, because he was dying of not breathing and nothing about an antagonist is faster than a bag-mask. And the example did not end at the good panel: twenty-five minutes later the respirations were back down to seven and the carbon dioxide back up to 58, because naloxone has a short duration of action and fentanyl does not. The patient most at risk is the one who woke up well and was allowed to leave. Nothing here was ventilated, drawn up, delivered or dispensed, both panels are authored rather than modelled, and no observation period or outcome is claimed. This ends the example, not the evaluation.' };
  }
  if (patient.patternReviewedAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.1,
      action: 'review-opioid-toxicity-pattern', narration: narrate(patient) };
  }
  if (patient.ventilationAtTick === null) {
    return { id: 'ventilation', focus: 'actions', progress: 0.27,
      action: 'record-opioid-ventilation-support', narration: narrate(patient) };
  }
  if (patient.antagonistAtTick === null) {
    return { id: 'naloxone', focus: 'actions', progress: 0.45,
      action: 'record-opioid-naloxone-intent', narration: narrate(patient) };
  }
  if (patient.initialReassessmentAtTick === null) {
    return { id: 'initial', focus: 'monitor', progress: 0.62,
      action: 'reassess-opioid-initial-response', narration: narrate(patient) };
  }
  if (patient.recurrenceReviewedAtTick === null) {
    return { id: 'recurrence', focus: 'monitor', progress: 0.79,
      action: 'review-opioid-recurrence', narration: narrate(patient) };
  }
  return { id: 'plan', focus: 'actions', progress: 0.92,
    action: 'record-opioid-recurrence-and-safety-plan', narration: narrate(patient) };
}
