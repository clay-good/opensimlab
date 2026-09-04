import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsHeartFailure, type HeartFailureAction, type HeartFailureProgress } from '../heart-failure';
import { heartFailureInlinePrompt } from '../tutor/heart-failure-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: HeartFailureProgress): string {
  const prompt = heartFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const HEART_FAILURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHeartFailureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHeartFailure(scenario);
}

export interface HeartFailureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HeartFailureAction; readonly finished?: boolean;
}

/**
 * The worked example for a man who feels better and is not ready to go.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires and interprets no test, calculates
 * no dry weight, fluid target, dose or score, diagnoses nothing, prescribes and
 * delivers no treatment, selects no regimen, determines no disposition, and
 * predicts no outcome.
 */
export function heartFailureDemonstrationStep(
  patient?: HeartFailureProgress,
): HeartFailureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.readinessAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is more comfortable, three and a half kilos above his own baseline, and staying. What the record now says is why he is staying, what would change that, and who is watching the numbers that decide it. This ends the example, not the evaluation.' };
  }
  if (patient.statusAtTick === null) {
    return { id: 'status', focus: 'monitor', progress: 0.12, action: 'reconcile-heart-failure-congestion-and-perfusion',
      narration: narrate(patient) };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.34, action: 'review-heart-failure-diuretic-response',
      narration: narrate(patient) };
  }
  if (patient.toleranceAtTick === null) {
    return { id: 'tolerance', focus: 'monitor', progress: 0.56, action: 'review-heart-failure-tolerance-and-precipitant',
      narration: narrate(patient) };
  }
  if (patient.transitionAtTick === null) {
    return { id: 'transition', focus: 'actions', progress: 0.78, action: 'record-heart-failure-transition-intent',
      narration: narrate(patient) };
  }
  return { id: 'readiness', focus: 'actions', progress: 0.92, action: 'reassess-heart-failure-discharge-readiness',
    narration: narrate(patient) };
}
