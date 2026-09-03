import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricDka, type PediatricDkaAction, type PediatricDkaProgress,
} from '../pediatric-diabetic-ketoacidosis';
import { pediatricDkaInlinePrompt } from '../tutor/pediatric-dka-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricDkaProgress): string {
  const prompt = pediatricDkaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_DKA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricDkaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricDka(scenario);
}

export interface PediatricDkaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricDkaAction; readonly finished?: boolean;
}

/**
 * The worked example for a child whose numbers are all improving.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes care first and safety second,
 * which is one valid order rather than the required one. The example examines
 * nobody, performs no neurological examination, calculates no dehydration,
 * sodium, osmolality, anion gap, deficit, maintenance, dose or rate,
 * diagnoses and grades nothing, acquires and interprets no test, chooses no
 * fluid, solution, bolus, volume, rate, insulin, dextrose, potassium,
 * phosphate, bicarbonate, access or device, and determines no disposition or
 * outcome.
 */
export function pediatricDkaDemonstrationStep(
  patient?: PediatricDkaProgress,
): PediatricDkaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Every number moved the right way and nothing about her brain was settled by that. The team taking over knows when the next neurological observation is due and what would make them act on it. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-dka-illness-and-fixed-pattern',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-dka-and-current-risk',
      narration: narrate(patient) };
  }
  if (patient.careAtTick === null) {
    return { id: 'care', focus: 'actions', progress: 0.46, action: 'activate-pediatric-dka-qualified-care-ownership',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-dka-neurologic-and-metabolic-safety',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-dka-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-dka-active-risk',
    narration: narrate(patient) };
}
