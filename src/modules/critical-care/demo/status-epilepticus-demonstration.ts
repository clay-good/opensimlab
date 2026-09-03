import type { Scenario } from '@anesthesia/scenarios/types';
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
 * The worked example for a patient who stopped moving and did not stop seizing.
 *
 * Five beats in the only order the engine accepts. It acquires and interprets
 * no EEG, examines nobody, selects no agent, dose, depth, target or duration,
 * takes no specimen, orders no imaging, delivers nothing, diagnoses nothing,
 * determines no disposition, and predicts no outcome.
 */
export function statusEpilepticusDemonstrationStep(
  patient?: StatusEpilepticusProgress,
): StatusEpilepticusDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The whole example turns on the first thirty seconds: he had stopped shaking, and that was the reason to worry rather than the reason to relax. Everything after it — the lactate and the oliguria, the anesthetic pathway with an EEG attached to it, the cause list kept open next to a plausible old head injury — follows from refusing to read stillness as control. Ten quiet minutes is a window, not a trend, and nobody here knows why he was seizing. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'monitor', progress: 0.12,
      action: 'recognize-refractory-status-epilepticus', narration: narrate(patient) };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.32,
      action: 'review-refractory-status-pattern', narration: narrate(patient) };
  }
  if (patient.pathwayAtTick === null) {
    return { id: 'pathway', focus: 'actions', progress: 0.54,
      action: 'activate-refractory-status-pathway', narration: narrate(patient) };
  }
  if (patient.causesAtTick === null) {
    return { id: 'causes', focus: 'actions', progress: 0.76,
      action: 'address-refractory-status-causes', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-refractory-status-trajectory', narration: narrate(patient) };
}
