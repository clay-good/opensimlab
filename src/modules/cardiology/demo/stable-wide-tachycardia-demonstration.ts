import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsStableWideTachycardia, type StableWideTachycardiaAction,
  type StableWideTachycardiaProgress,
} from '../stable-wide-tachycardia';
import { stableWideTachycardiaInlinePrompt } from '../tutor/stable-wide-tachycardia-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: StableWideTachycardiaProgress): string {
  const prompt = stableWideTachycardiaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const STABLE_WIDE_TACHYCARDIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsStableWideTachycardiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsStableWideTachycardia(scenario);
}

export interface StableWideTachycardiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: StableWideTachycardiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a rhythm treated as ventricular without being proven
 * so.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires and interprets no live ECG or
 * test, makes no exact diagnosis, selects no medication beyond the authored
 * path, supplies no dose, prepares and delivers nothing, performs no
 * cardioversion, selects no energy or sedation, makes no ablation or ICD
 * decision, determines no disposition, and predicts no recurrence or outcome.
 */
export function stableWideTachycardiaDemonstrationStep(
  patient?: StableWideTachycardiaProgress,
): StableWideTachycardiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is in sinus rhythm, he was awake for all of it, and the mechanism is still not proven. Treating it as ventricular without arguing about whether it was is what made the pathway safe, and it is also why the cardiology questions are still open. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.1, action: 'reconcile-stable-wide-complex-tachycardia',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.24, action: 'review-wide-complex-context',
      narration: narrate(patient) };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.38, action: 'prepare-wide-complex-pathway',
      narration: narrate(patient) };
  }
  if (patient.medicationAtTick === null) {
    return { id: 'medication', focus: 'actions', progress: 0.52, action: 'record-wide-complex-procainamide-pathway',
      narration: narrate(patient) };
  }
  if (patient.nonresponseAtTick === null) {
    return { id: 'nonresponse', focus: 'monitor', progress: 0.66, action: 'review-wide-complex-medication-nonresponse',
      narration: narrate(patient) };
  }
  if (patient.cardioversionAtTick === null) {
    return { id: 'cardioversion', focus: 'actions', progress: 0.82, action: 'record-wide-complex-cardioversion-intent',
      narration: narrate(patient) };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.94, action: 'reassess-wide-complex-trajectory',
    narration: narrate(patient) };
}
