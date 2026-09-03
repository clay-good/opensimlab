import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsStableNarrowTachycardia, type StableNarrowTachycardiaAction,
  type StableNarrowTachycardiaProgress,
} from '../stable-narrow-tachycardia';
import { stableNarrowTachycardiaInlinePrompt } from '../tutor/stable-narrow-tachycardia-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: StableNarrowTachycardiaProgress): string {
  const prompt = stableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const STABLE_NARROW_TACHYCARDIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsStableNarrowTachycardiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsStableNarrowTachycardia(scenario);
}

export interface StableNarrowTachycardiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: StableNarrowTachycardiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a ladder taken one rung at a time.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires and interprets no live ECG or
 * test, diagnoses no mechanism, performs no maneuver, selects no medication,
 * dose or route, prescribes and delivers nothing, performs no cardioversion or
 * ablation, determines no disposition, and predicts no recurrence or outcome.
 */
export function stableNarrowTachycardiaDemonstrationStep(
  patient?: StableNarrowTachycardiaProgress,
): StableNarrowTachycardiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is in sinus rhythm and nobody knows the mechanism. The maneuver was tried properly and looked at honestly, the drug came after that rather than instead of it, and the plan for the next episode is written down. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.1, action: 'reconcile-stable-regular-narrow-tachycardia',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'review-stable-regular-narrow-context',
      narration: narrate(patient) };
  }
  if (patient.vagalAtTick === null) {
    return { id: 'vagal', focus: 'actions', progress: 0.46, action: 'record-stable-regular-narrow-vagal-intent',
      narration: narrate(patient) };
  }
  if (patient.vagalResponseAtTick === null) {
    return { id: 'vagalResponse', focus: 'monitor', progress: 0.64, action: 'review-stable-regular-narrow-vagal-response',
      narration: narrate(patient) };
  }
  if (patient.adenosineAtTick === null) {
    return { id: 'adenosine', focus: 'actions', progress: 0.82, action: 'record-stable-regular-narrow-adenosine-intent',
      narration: narrate(patient) };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.94, action: 'reassess-stable-regular-narrow-trajectory',
    narration: narrate(patient) };
}
