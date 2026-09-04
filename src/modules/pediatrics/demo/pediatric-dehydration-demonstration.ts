import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricDehydration, type PediatricDehydrationAction,
  type PediatricDehydrationProgress,
} from '../pediatric-dehydration-with-hypovolemia';
import { pediatricDehydrationInlinePrompt } from '../tutor/pediatric-dehydration-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricDehydrationProgress): string {
  const prompt = pediatricDehydrationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_DEHYDRATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricDehydrationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricDehydration(scenario);
}

export interface PediatricDehydrationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricDehydrationAction; readonly finished?: boolean;
}

/**
 * The worked example for a child two weights are not enough to describe.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes rehydration first and safety
 * second, which is one valid order rather than the required one. The example
 * examines nobody, weighs nobody, calculates no percentage, deficit or
 * maintenance, diagnoses nothing, acquires and interprets no glucose,
 * electrolyte, renal, acid-base, urine, stool, culture or imaging test,
 * chooses no solution, route, bolus, volume, rate, electrolyte, access,
 * device, drug or feeding plan, and determines no disposition or outcome.
 */
export function pediatricDehydrationDemonstrationStep(
  patient?: PediatricDehydrationProgress,
): PediatricDehydrationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She has taken fluid by mouth and kept it down, she has made urine, and she is still having watery stools. Nobody put a cannula in her, nobody calculated a deficit, and everyone knows what would change the plan. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-dehydration-losses-and-perfusion',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-dehydration-with-hypovolemia',
      narration: narrate(patient) };
  }
  if (patient.rehydrationAtTick === null) {
    return { id: 'rehydration', focus: 'actions', progress: 0.46, action: 'activate-pediatric-dehydration-qualified-rehydration-ownership',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-dehydration-ongoing-losses-and-safety',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-dehydration-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-dehydration-active-risk',
    narration: narrate(patient) };
}
