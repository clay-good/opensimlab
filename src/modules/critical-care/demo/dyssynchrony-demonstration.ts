import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsDyssynchrony, type DyssynchronyAction, type DyssynchronyProgress,
} from '../dyssynchrony';
import { dyssynchronyInlinePrompt } from '../tutor/dyssynchrony-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: DyssynchronyProgress): string {
  const prompt = dyssynchronyInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const DYSSYNCHRONY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDyssynchronyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDyssynchrony(scenario);
}

export interface DyssynchronyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: DyssynchronyAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a patient who would have been sedated.
 *
 * Five beats in the only order the engine accepts. It examines nobody, measures
 * no pain or sedation, handles no airway or equipment, acquires no waveform,
 * diagnoses nothing, selects no mode or setting, prescribes and delivers no
 * drug, paralyses nobody, samples no blood, performs no procedure, determines
 * no disposition, and predicts no outcome.
 */
export function dyssynchronyDemonstrationStep(
  patient?: DyssynchronyProgress,
): DyssynchronyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is more comfortable and his delivered volume is closer to what was set, and nobody sedated him to get there. The double triggering was never a behaviour to suppress — it was a breath ending while he was still asking for it, and the fix was to stop ending it early. This ends the example, not the evaluation.' };
  }
  if (patient.graphicsAtTick === null) {
    return { id: 'graphics', focus: 'monitor', progress: 0.12,
      action: 'review-dyssynchrony-patient-and-graphics', narration: narrate(patient) };
  }
  if (patient.driversAtTick === null) {
    return { id: 'drivers', focus: 'monitor', progress: 0.32,
      action: 'review-dyssynchrony-drivers', narration: narrate(patient) };
  }
  if (patient.classificationAtTick === null) {
    return { id: 'classify', focus: 'monitor', progress: 0.54,
      action: 'classify-dyssynchrony-pattern', narration: narrate(patient) };
  }
  if (patient.correctionAtTick === null) {
    return { id: 'correct', focus: 'actions', progress: 0.76,
      action: 'record-dyssynchrony-correction-intent', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-dyssynchrony-response', narration: narrate(patient) };
}
