import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsIntracranialHypertension, type IntracranialHypertensionAction,
  type IntracranialHypertensionProgress,
} from '../intracranial-hypertension';
import { intracranialHypertensionInlinePrompt } from '../tutor/intracranial-hypertension-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: IntracranialHypertensionProgress): string {
  const prompt = intracranialHypertensionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const INTRACRANIAL_HYPERTENSION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsIntracranialHypertensionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsIntracranialHypertension(scenario);
}

export interface IntracranialHypertensionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: IntracranialHypertensionAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a number with a famous treatment attached.
 *
 * Five beats in the only order the engine accepts. It positions, measures,
 * ventilates, doses and delivers nothing, selects no agent, concentration or
 * route, diagnoses nothing, determines no disposition, and predicts no outcome.
 */
export function intracranialHypertensionDemonstrationStep(
  patient?: IntracranialHypertensionProgress,
): IntracranialHypertensionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The pressure came down and the order is the point. A head turned 10° off neutral was a partly obstructed jugular, and it was found by asking what was causing the number before reaching for the thing that treats it. The osmotherapy still happened — one step later, with its guardrails, as an individualized intent rather than a recipe. Fifteen minutes of a better perfusion pressure is not durable control, and nothing here says how he does. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'monitor', progress: 0.12,
      action: 'recognize-intracranial-hypertension', narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.32,
      action: 'review-intracranial-hypertension-context', narration: narrate(patient) };
  }
  if (patient.protectionAtTick === null) {
    return { id: 'protect', focus: 'actions', progress: 0.54,
      action: 'activate-first-tier-brain-protection', narration: narrate(patient) };
  }
  if (patient.rescueAtTick === null) {
    return { id: 'rescue', focus: 'actions', progress: 0.76,
      action: 'activate-individualized-hyperosmolar-rescue', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-intracranial-hypertension-trajectory', narration: narrate(patient) };
}
