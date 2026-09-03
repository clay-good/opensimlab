import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAutoPeep, type AutoPeepAction, type AutoPeepProgress,
} from '../auto-peep';
import { autoPeepInlinePrompt } from '../tutor/auto-peep-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: AutoPeepProgress): string {
  const prompt = autoPeepInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const AUTO_PEEP_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAutoPeepDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAutoPeep(scenario);
}

export interface AutoPeepDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AutoPeepAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a ventilator setting that is causing the problem it
 * looks like it is treating.
 *
 * Five beats in the only order the engine accepts. It examines nobody, acquires
 * no waveform or mechanics, handles no airway or equipment, diagnoses nothing,
 * selects no ventilator mode or setting, titrates no external PEEP, prescribes
 * and delivers no drug, sedates and paralyses nobody, samples no blood,
 * performs no procedure, determines no disposition, and predicts no outcome.
 */
export function autoPeepDemonstrationStep(
  patient?: AutoPeepProgress,
): AutoPeepDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is trapping less air and her carbon dioxide is higher, and that is the trade rather than a setback. Nobody changed a setting here and nobody named one — what the review produced was a reason to stop ventilating her faster than she can breathe out. The peak pressure of 35 was never the problem it looked like. This ends the example, not the evaluation.' };
  }
  if (patient.flowAtTick === null) {
    return { id: 'flow', focus: 'monitor', progress: 0.12,
      action: 'review-auto-peep-patient-and-flow', narration: narrate(patient) };
  }
  if (patient.measurementAtTick === null) {
    return { id: 'measure', focus: 'monitor', progress: 0.32,
      action: 'measure-auto-peep', narration: narrate(patient) };
  }
  if (patient.classificationAtTick === null) {
    return { id: 'classify', focus: 'monitor', progress: 0.54,
      action: 'classify-auto-peep-pattern', narration: narrate(patient) };
  }
  if (patient.correctionAtTick === null) {
    return { id: 'correct', focus: 'actions', progress: 0.76,
      action: 'record-auto-peep-correction-intent', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-auto-peep-response', narration: narrate(patient) };
}
