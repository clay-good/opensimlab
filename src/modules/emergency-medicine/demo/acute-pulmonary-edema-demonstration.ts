import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAcutePulmonaryEdema, type AcutePulmonaryEdemaAction,
  type AcutePulmonaryEdemaProgress,
} from '../acute-pulmonary-edema';
import { acutePulmonaryEdemaInlinePrompt } from '../tutor/acute-pulmonary-edema-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: AcutePulmonaryEdemaProgress): string {
  const prompt = acutePulmonaryEdemaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ACUTE_PULMONARY_EDEMA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAcutePulmonaryEdemaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAcutePulmonaryEdema(scenario);
}

export interface AcutePulmonaryEdemaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AcutePulmonaryEdemaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for three treatments that are not a ranked list.
 *
 * Five beats. Only the first and the last are ordered by the engine; the middle
 * three could be taken in any order, and this example takes the fastest first
 * and the most familiar last to make that visible. It examines nobody, acquires
 * and interprets no test, prepares and delivers no drug, sets up no device,
 * diagnoses nothing, determines no disposition, and predicts no outcome.
 */
export function acutePulmonaryEdemaDemonstrationStep(
  patient?: AcutePulmonaryEdemaProgress,
): AcutePulmonaryEdemaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The order this example took is the whole point: pressure and positive pressure first, the loop diuretic last, and none of the three waiting on another. The engine would have accepted any order — what it will not accept is the reassessment before all three are recorded, because the common way this goes wrong is that the familiar one gets recorded alone and the patient is re-read as though she had been treated. Nothing here was delivered, titrated, or set up, and the numbers that came back are authored rather than modelled. This ends the example, not the evaluation.' };
  }
  if (patient.patternReviewedAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.1,
      action: 'review-pattern-mimics-and-precipitants', narration: narrate(patient) };
  }
  if (patient.nivAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.32,
      action: 'record-niv-and-titrated-oxygen', narration: narrate(patient) };
  }
  if (patient.vasodilatorIntentAtTick === null) {
    return { id: 'vasodilator', focus: 'actions', progress: 0.54,
      action: 'record-vasodilator-intent', narration: narrate(patient) };
  }
  if (patient.diureticIntentAtTick === null) {
    return { id: 'diuretic', focus: 'actions', progress: 0.76,
      action: 'record-loop-diuretic-intent', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.92,
    action: 'reassess-breathing-pressure-and-perfusion', narration: narrate(patient) };
}
