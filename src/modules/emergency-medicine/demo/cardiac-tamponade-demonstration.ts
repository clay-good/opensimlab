import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCardiacTamponade, type CardiacTamponadeAction, type CardiacTamponadeProgress,
} from '../cardiac-tamponade';
import { cardiacTamponadeInlinePrompt } from '../tutor/cardiac-tamponade-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: CardiacTamponadeProgress): string {
  const prompt = cardiacTamponadeInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const CARDIAC_TAMPONADE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCardiacTamponadeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCardiacTamponade(scenario);
}

export interface CardiacTamponadeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CardiacTamponadeAction;
  readonly finished?: boolean;
}

/**
 * The worked example that ends with the patient no better.
 *
 * Four beats in the only order the engine accepts. It acquires and interprets
 * no image, performs no procedure, transports nobody, relieves nothing,
 * diagnoses nothing, and predicts no outcome — and the obstructive physiology
 * is still running when it finishes.
 */
export function cardiacTamponadeDemonstrationStep(
  patient?: CardiacTamponadeProgress,
): CardiacTamponadeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Every step was accepted and the patient is no better, which is the whole example. The click mobilised a team; it did not open a pericardium, and this vignette simulates no procedure, no response, and no outcome. Most practice teaches that the numbers move when you get it right, and the first minutes of penetrating traumatic tamponade do not work that way — the only thing available to compress is the interval before an operation starts. This ends the example, not the evaluation.' };
  }
  if (patient.contextReviewedAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.12,
      action: 'review-context-and-perfusion', narration: narrate(patient) };
  }
  if (patient.pocusReviewedAtTick === null) {
    return { id: 'pocus', focus: 'monitor', progress: 0.4,
      action: 'review-fixed-pocus', narration: narrate(patient) };
  }
  if (patient.definitiveControlAtTick === null) {
    return { id: 'control', focus: 'actions', progress: 0.68,
      action: 'record-definitive-control-intent', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-perfusion', narration: narrate(patient) };
}
