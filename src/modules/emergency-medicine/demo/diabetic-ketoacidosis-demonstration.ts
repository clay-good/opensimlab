import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsDiabeticKetoacidosis, type DiabeticKetoacidosisAction,
  type DiabeticKetoacidosisProgress,
} from '../diabetic-ketoacidosis';
import { diabeticKetoacidosisInlinePrompt } from '../tutor/diabetic-ketoacidosis-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: DiabeticKetoacidosisProgress): string {
  const prompt = diabeticKetoacidosisInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const DIABETIC_KETOACIDOSIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDiabeticKetoacidosisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDiabeticKetoacidosis(scenario);
}

export interface DiabeticKetoacidosisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: DiabeticKetoacidosisAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a treatment that has to wait, and then must not stop.
 *
 * Six beats in the only order the engine accepts. It examines nobody, draws no
 * specimen, selects no fluid or dose, programmes no pump, delivers nothing,
 * tests no device, determines no disposition, and predicts no outcome.
 */
export function diabeticKetoacidosisDemonstrationStep(
  patient?: DiabeticKetoacidosisProgress,
): DiabeticKetoacidosisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.transitionAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Two refusals would have caught this example if it had gone the usual way, and they are mirror images of each other. Insulin had to wait, because a potassium of 3.2 gets worse the moment the drug that moves potassium into cells arrives. Then insulin had to keep running, because the glucose came down while the ketoacidosis was still only half-cleared — the frightening number improves first and the dangerous process does not. Nothing here was drawn up, programmed, or delivered, every panel is authored rather than modelled, and the kinked infusion set is the reason the handoff matters as much as the treatment. This ends the example, not the evaluation.' };
  }
  if (patient.presentationReviewedAtTick === null) {
    return { id: 'presentation', focus: 'monitor', progress: 0.1,
      action: 'review-dka-presentation', narration: narrate(patient) };
  }
  if (patient.fluidsAtTick === null) {
    return { id: 'fluids', focus: 'actions', progress: 0.27,
      action: 'record-dka-fluids-and-monitoring', narration: narrate(patient) };
  }
  if (patient.potassiumAtTick === null) {
    return { id: 'potassium', focus: 'actions', progress: 0.45,
      action: 'record-dka-potassium-replacement', narration: narrate(patient) };
  }
  if (patient.insulinAtTick === null) {
    return { id: 'insulin', focus: 'actions', progress: 0.62,
      action: 'record-dka-insulin-intent', narration: narrate(patient) };
  }
  if (patient.dextroseAtTick === null) {
    return { id: 'dextrose', focus: 'monitor', progress: 0.79,
      action: 'add-dextrose-and-continue-insulin', narration: narrate(patient) };
  }
  return { id: 'transition', focus: 'monitor', progress: 0.92,
    action: 'confirm-dka-resolution-and-transition', narration: narrate(patient) };
}
