import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsSevereHyponatremia, type SevereHyponatremiaAction,
  type SevereHyponatremiaProgress,
} from '../severe-hyponatremia-with-seizure';
import { severeHyponatremiaInlinePrompt } from '../tutor/severe-hyponatremia-with-seizure-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: SevereHyponatremiaProgress): string {
  const prompt = severeHyponatremiaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const SEVERE_HYPONATREMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSevereHyponatremiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSevereHyponatremia(scenario);
}

export interface SevereHyponatremiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SevereHyponatremiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for two dangers pointing in opposite directions.
 *
 * Five beats in the only order the engine accepts. It examines nobody,
 * validates no sample, selects no concentration, volume or fluid, delivers
 * nothing, diagnoses no cause, treats no overcorrection, and predicts no
 * outcome.
 */
export function severeHyponatremiaDemonstrationStep(
  patient?: SevereHyponatremiaProgress,
): SevereHyponatremiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.guardrailsAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The danger in this example reversed direction inside an hour. It began as a swollen brain that needed the sodium raised quickly, and it ended as a correction that would have continued on its own — and the thing that said so was not the sodium but the urine output, up from 35 to 180 mL an hour. That is a water diuresis, which means the kidneys have taken over the job and will not stop where you would have. So the treatment stopped after a 5 mmol/L rise, the ceilings went into the handoff, and the thiazide came off. Nothing here was drawn up, delivered, diagnosed or reversed, both panels are authored rather than modelled, and no later course or outcome is claimed. This ends the example, not the evaluation.' };
  }
  if (patient.patternReviewedAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.12,
      action: 'review-hyponatremia-pattern', narration: narrate(patient) };
  }
  if (patient.stabilizedAtTick === null) {
    return { id: 'stabilization', focus: 'actions', progress: 0.33,
      action: 'record-hyponatremia-stabilization', narration: narrate(patient) };
  }
  if (patient.hypertonicAtTick === null) {
    return { id: 'hypertonic', focus: 'actions', progress: 0.55,
      action: 'record-hypertonic-saline-intent', narration: narrate(patient) };
  }
  if (patient.reassessedAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.76,
      action: 'reassess-hyponatremia-first-hour', narration: narrate(patient) };
  }
  return { id: 'guardrails', focus: 'actions', progress: 0.92,
    action: 'record-hyponatremia-guardrails-and-cause-plan', narration: narrate(patient) };
}
