import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsStatusEpilepticus, type StatusEpilepticusAction, type StatusEpilepticusProgress,
} from '../status-epilepticus';
import { statusEpilepticusInlinePrompt } from '../tutor/status-epilepticus-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: StatusEpilepticusProgress): string {
  const prompt = statusEpilepticusInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const STATUS_EPILEPTICUS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsStatusEpilepticusDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsStatusEpilepticus(scenario);
}

export interface StatusEpilepticusDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: StatusEpilepticusAction;
  readonly finished?: boolean;
}

/**
 * The worked example for the thirty seconds before the drug.
 *
 * Four beats in the only order the engine accepts. It examines nobody,
 * positions no airway, suctions nothing, draws no blood, prepares and delivers
 * no drug, records no EEG, diagnoses no cause, and predicts no outcome.
 */
export function statusEpilepticusDemonstrationStep(
  patient?: StatusEpilepticusProgress,
): StatusEpilepticusDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The bundle went in before the drug, and the item that justifies the gate is the smallest one on it: a point-of-care glucose. Hypoglycaemia is a cause of convulsive status that a benzodiazepine suppresses without correcting, which produces a patient who stops fitting and stays hypoglycaemic. The rest of the bundle is what makes a full dose safe to give in someone already at 92%. Nothing here was positioned, suctioned, drawn up or delivered, the convulsions stopped on the modelled physiology update rather than on a click, and the second-line boundary is left where it belongs — a seizure that persists needs a different drug rather than a longer wait. This ends the example, not the evaluation.' };
  }
  if (patient.reviewedAtTick === null) {
    return { id: 'review', focus: 'monitor', progress: 0.14,
      action: 'review-convulsive-status', narration: narrate(patient) };
  }
  if (patient.supportedAtTick === null) {
    return { id: 'stabilization', focus: 'actions', progress: 0.4,
      action: 'record-status-stabilization', narration: narrate(patient) };
  }
  if (patient.lorazepamAtTick === null) {
    return { id: 'lorazepam', focus: 'actions', progress: 0.68,
      action: 'give-lorazepam-4-mg-iv', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-after-lorazepam', narration: narrate(patient) };
}
