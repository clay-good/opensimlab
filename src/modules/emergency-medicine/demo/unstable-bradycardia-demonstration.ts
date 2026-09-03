import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsUnstableBradycardia, type UnstableBradycardiaAction,
  type UnstableBradycardiaProgress,
} from '../unstable-bradycardia';
import { unstableBradycardiaInlinePrompt } from '../tutor/unstable-bradycardia-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: UnstableBradycardiaProgress): string {
  const prompt = unstableBradycardiaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const UNSTABLE_BRADYCARDIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsUnstableBradycardiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsUnstableBradycardia(scenario);
}

export interface UnstableBradycardiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: UnstableBradycardiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a number that is only a finding in context.
 *
 * Four beats in the only order the engine accepts. It examines nobody,
 * delivers no oxygen or drug, places no line, paces nobody, diagnoses no cause,
 * and predicts no outcome.
 */
export function unstableBradycardiaDemonstrationStep(
  patient?: UnstableBradycardiaProgress,
): UnstableBradycardiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'A rate of 38 is not an emergency; a rate of 38 with a pressure of 78/46 and a drowsy patient is, and that difference is the whole example. The support bundle came before the drug for a better reason than order — hypoxia causes bradycardia, and at 91% on room air the oxygen may have been treating the rhythm rather than accompanying it. The good panel at the end is read through the mentation and the skin rather than the number, and it is not permission to stop: the cause was never diagnosed and atropine is temporary. Nothing here was delivered, cannulated or paced, and no cause, recurrence or outcome is claimed. This ends the example, not the evaluation.' };
  }
  if (patient.reviewedAtTick === null) {
    return { id: 'review', focus: 'monitor', progress: 0.14,
      action: 'review-bradycardia-and-compromise', narration: narrate(patient) };
  }
  if (patient.supportedAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4,
      action: 'record-bradycardia-support', narration: narrate(patient) };
  }
  if (patient.atropineAtTick === null) {
    return { id: 'atropine', focus: 'actions', progress: 0.68,
      action: 'record-atropine-intent', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-bradycardia-response', narration: narrate(patient) };
}
