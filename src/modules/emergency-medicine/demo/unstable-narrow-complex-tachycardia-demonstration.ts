import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsUnstableNarrowTachycardia, type UnstableNarrowTachycardiaAction,
  type UnstableNarrowTachycardiaProgress,
} from '../unstable-narrow-complex-tachycardia';
import { unstableNarrowTachycardiaInlinePrompt } from '../tutor/unstable-narrow-complex-tachycardia-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: UnstableNarrowTachycardiaProgress): string {
  const prompt = unstableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const UNSTABLE_NARROW_TACHYCARDIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsUnstableNarrowTachycardiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsUnstableNarrowTachycardia(scenario);
}

export interface UnstableNarrowTachycardiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: UnstableNarrowTachycardiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a mechanism question this patient cannot afford.
 *
 * Four beats in the only order the engine accepts. It examines nobody, places
 * no pad or line, selects no energy or sedative, operates no device, delivers
 * no shock, names no mechanism, and predicts no outcome.
 */
export function unstableNarrowTachycardiaDemonstrationStep(
  patient?: UnstableNarrowTachycardiaProgress,
): UnstableNarrowTachycardiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The interesting question in this example was never answered, and that is the point. A regular narrow-complex tachycardia at 188 invites a mechanism question, and a pressure of 76/48 with a drowsy patient makes that question a luxury — instability converts a rhythm to be characterised into a rhythm to be terminated, which is why there is no adenosine on this screen. The pads went on before the decision to shock, because a synchronised shock differs from an unsynchronised one by a setting somebody has to select and a marker somebody has to see. Nothing here was placed, charged, sedated or delivered, and the mechanism, the recurrence and the anticoagulation question all remain open. This ends the example, not the evaluation.' };
  }
  if (patient.reviewedAtTick === null) {
    return { id: 'review', focus: 'monitor', progress: 0.14,
      action: 'review-rhythm-and-instability', narration: narrate(patient) };
  }
  if (patient.preparedAtTick === null) {
    return { id: 'prepare', focus: 'actions', progress: 0.4,
      action: 'prepare-synchronized-cardioversion', narration: narrate(patient) };
  }
  if (patient.cardiovertedAtTick === null) {
    return { id: 'cardiovert', focus: 'actions', progress: 0.68,
      action: 'record-synchronized-cardioversion-intent', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-rhythm-and-perfusion', narration: narrate(patient) };
}
