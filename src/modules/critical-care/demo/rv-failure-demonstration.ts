import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsRvFailure, type RvFailureAction, type RvFailureProgress,
} from '../rv-failure';
import { rvFailureInlinePrompt } from '../tutor/rv-failure-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: RvFailureProgress): string {
  const prompt = rvFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const RV_FAILURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsRvFailureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRvFailure(scenario);
}

export interface RvFailureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RvFailureAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a patient whose two obvious treatments are both wrong.
 *
 * Five beats in the only order the engine accepts. It examines nobody, acquires
 * or interprets no monitoring, ECG, laboratory result, echo, catheter or image,
 * calculates and diagnoses nothing, changes no oxygen or ventilation, delivers
 * no fluid, diuresis or drug, obtains no access, doses nothing, performs no
 * procedure, provides no mechanical support, determines no disposition, and
 * predicts no outcome.
 */
export function rvFailureDemonstrationStep(
  patient?: RvFailureProgress,
): RvFailureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is better and she is still congested, still underperfused, and still off the therapy that was interrupted. No fluid went in and no diuretic went in, which in a patient this swollen and this hypotensive is the whole discipline of the lesson. A central venous pressure of 18 next to a wedge of 10 was the sentence that decided it. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.12,
      action: 'recognize-rv-failure-trajectory', narration: narrate(patient) };
  }
  if (patient.phenotypeAtTick === null) {
    return { id: 'phenotype', focus: 'monitor', progress: 0.32,
      action: 'review-rv-failure-phenotype', narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.54,
      action: 'record-rv-failure-support', narration: narrate(patient) };
  }
  if (patient.triggersAtTick === null) {
    return { id: 'triggers', focus: 'actions', progress: 0.74,
      action: 'address-rv-failure-triggers', narration: narrate(patient) };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.9,
    action: 'reassess-rv-failure-trajectory', narration: narrate(patient) };
}
