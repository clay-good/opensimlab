import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAkiFluidOverload, type AkiFluidOverloadAction, type AkiFluidOverloadProgress,
} from '../aki-fluid-overload';
import { akiFluidOverloadInlinePrompt } from '../tutor/aki-fluid-overload-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: AkiFluidOverloadProgress): string {
  const prompt = akiFluidOverloadInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const AKI_FLUID_OVERLOAD_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAkiFluidOverloadDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAkiFluidOverload(scenario);
}

export interface AkiFluidOverloadDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AkiFluidOverloadAction;
  readonly finished?: boolean;
}

/**
 * The worked example for nine kilograms that arrived one infusion at a time.
 *
 * Five beats in the only order the engine accepts. It counts nothing,
 * restricts nothing, changes no nutrition, doses and delivers no fluid or
 * diuretic, cannulates nobody, starts no circuit, selects no modality or net
 * removal rate, diagnoses nothing, determines no disposition, and predicts no
 * outcome.
 */
export function akiFluidOverloadDemonstrationStep(
  patient?: AkiFluidOverloadProgress,
): AkiFluidOverloadDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'A litre came off and her kidney is doing exactly what it was doing before. That is the shape of this lesson: the step that mattered most was the free one, stopping the intake that was still running, and it came before the argument about kidney support rather than after it. Nothing here decided a modality, a rate or a moment to start, because the record says those are open and the trials that asked whether starting earlier helps did not find that it does. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'monitor', progress: 0.12,
      action: 'recognize-aki-fluid-overload', narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.32,
      action: 'review-aki-fluid-overload-context', narration: narrate(patient) };
  }
  if (patient.fluidPlanAtTick === null) {
    return { id: 'fluid', focus: 'actions', progress: 0.54,
      action: 'limit-fluid-and-review-diuretic-response', narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.76,
      action: 'activate-individualized-kidney-support-pathway', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-aki-fluid-overload-trajectory', narration: narrate(patient) };
}
