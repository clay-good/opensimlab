import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsStableChestPain, type StableChestPainAction, type StableChestPainProgress,
} from '../stable-chest-pain';
import { stableChestPainInlinePrompt } from '../tutor/stable-chest-pain-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: StableChestPainProgress): string {
  const prompt = stableChestPainInlinePrompt('guided', { scenarioVersion: '0.1.1', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const STABLE_CHEST_PAIN_DEMONSTRATION_VERSION = '0.1.0';

export function supportsStableChestPainDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsStableChestPain(scenario);
}

export interface StableChestPainDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: StableChestPainAction; readonly finished?: boolean;
}

/**
 * The worked example for a calm visit that still has to end with a safety net.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires and interprets no ECG, calculates
 * no risk score, measures no exercise capacity, orders and performs no test,
 * diagnoses no coronary disease or ischemia, prescribes nothing, determines no
 * disposition, and predicts no event or outcome.
 */
export function stableChestPainDemonstrationStep(
  patient?: StableChestPainProgress,
): StableChestPainDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.safetyNetAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Nothing was diagnosed, nothing was ordered, and nobody called anything atypical. What the visit produced is a described pattern, a likelihood band, a test chosen with him rather than for him, and a clear account of what would bring him back sooner. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.12, action: 'verify-stable-chest-pain-trajectory',
      narration: narrate(patient) };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.34, action: 'characterize-stable-chest-pain-pattern',
      narration: narrate(patient) };
  }
  if (patient.likelihoodAtTick === null) {
    return { id: 'likelihood', focus: 'monitor', progress: 0.56, action: 'estimate-stable-chest-pain-clinical-likelihood',
      narration: narrate(patient) };
  }
  if (patient.testingAtTick === null) {
    return { id: 'testing', focus: 'actions', progress: 0.78, action: 'record-stable-chest-pain-testing-intent',
      narration: narrate(patient) };
  }
  return { id: 'safetyNet', focus: 'actions', progress: 0.92, action: 'safety-net-stable-chest-pain-follow-up',
    narration: narrate(patient) };
}
