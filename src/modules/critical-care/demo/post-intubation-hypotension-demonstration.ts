import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPostIntubationHypotension, type PostIntubationHypotensionAction,
  type PostIntubationHypotensionProgress,
} from '../post-intubation-hypotension';
import { postIntubationHypotensionInlinePrompt } from '../tutor/post-intubation-hypotension-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PostIntubationHypotensionProgress): string {
  const prompt = postIntubationHypotensionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const POST_INTUBATION_HYPOTENSION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPostIntubationHypotensionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPostIntubationHypotension(scenario);
}

export interface PostIntubationHypotensionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PostIntubationHypotensionAction;
  readonly finished?: boolean;
}

/**
 * The worked example for hypotension that already has an explanation.
 *
 * Five beats in the only order the engine accepts. It examines nobody, acquires
 * no pressure, performs no ultrasound or leg raise, delivers no fluid or drug,
 * doses nothing, changes no ventilator or sedation setting, diagnoses nothing,
 * treats no source, determines no disposition, and predicts no outcome.
 */
export function postIntubationHypotensionDemonstrationStep(
  patient?: PostIntubationHypotensionProgress,
): PostIntubationHypotensionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'His pressure is better and he still has pneumonia and septic shock, which is where he started. The explanation everybody had at the beginning turned out to be right — and it was checked rather than assumed, which is the only reason a tension pneumothorax would have been found if it had been there instead. This ends the example, not the evaluation.' };
  }
  if (patient.pressureAtTick === null) {
    return { id: 'pressure', focus: 'monitor', progress: 0.12,
      action: 'validate-post-intubation-pressure-and-call-help', narration: narrate(patient) };
  }
  if (patient.dangerAtTick === null) {
    return { id: 'danger', focus: 'monitor', progress: 0.32,
      action: 'review-post-intubation-danger-pattern', narration: narrate(patient) };
  }
  if (patient.mechanismAtTick === null) {
    return { id: 'mechanism', focus: 'monitor', progress: 0.54,
      action: 'classify-post-intubation-hemodynamics', narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.76,
      action: 'record-post-intubation-support-intent', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-post-intubation-hypotension', narration: narrate(patient) };
}
