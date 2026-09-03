import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsIcuHandoff, type IcuHandoffAction, type IcuHandoffProgress,
} from '../icu-handoff';
import { icuHandoffInlinePrompt } from '../tutor/icu-handoff-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: IcuHandoffProgress): string {
  const prompt = icuHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ICU_HANDOFF_DEMONSTRATION_VERSION = '0.1.0';

export function supportsIcuHandoffDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsIcuHandoff(scenario);
}

export interface IcuHandoffDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: IcuHandoffAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a sentence the numbers contradict.
 *
 * Five beats in the only order the engine accepts. It assesses nobody,
 * communicates with nobody, delivers no treatment, controls no source,
 * diagnoses nothing, determines no disposition, and predicts no outcome.
 */
export function icuHandoffDemonstrationStep(
  patient?: IcuHandoffProgress,
): IcuHandoffDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.acceptanceAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The handover was accurate about everything except the one word that mattered. "Stable" was true when someone last said it, and ninety minutes of dated numbers — a pressure falling while the support nearly tripled, an EtCO2 drifting down on unchanged ventilation — say it stopped being true slowly enough that nobody at the bedside saw it. What this example did was refuse to inherit a conclusion, and then put names on the tasks so the correction outlives the conversation. This ends the example, not the evaluation.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.12,
      action: 'establish-icu-handoff-readiness', narration: narrate(patient) };
  }
  if (patient.contentAtTick === null) {
    return { id: 'content', focus: 'actions', progress: 0.32,
      action: 'receive-icu-handoff-content', narration: narrate(patient) };
  }
  if (patient.crossCheckAtTick === null) {
    return { id: 'crosscheck', focus: 'monitor', progress: 0.54,
      action: 'cross-check-hidden-deterioration', narration: narrate(patient) };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.76,
      action: 'escalate-icu-handoff-deterioration', narration: narrate(patient) };
  }
  return { id: 'accept', focus: 'actions', progress: 0.9,
    action: 'synthesize-accept-and-reassess-icu-handoff', narration: narrate(patient) };
}
