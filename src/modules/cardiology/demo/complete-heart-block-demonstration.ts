import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCompleteHeartBlock, type CompleteHeartBlockAction,
  type CompleteHeartBlockProgress,
} from '../complete-heart-block';
import { completeHeartBlockInlinePrompt } from '../tutor/complete-heart-block-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: CompleteHeartBlockProgress): string {
  const prompt = completeHeartBlockInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const COMPLETE_HEART_BLOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCompleteHeartBlockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCompleteHeartBlock(scenario);
}

export interface CompleteHeartBlockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CompleteHeartBlockAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a patient who looks well because of the rhythm that
 * might stop.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the middle pair is unordered the example escalates first
 * and reviews the cause second — a choice, and a deliberate one, because the
 * phone call is the half a learner is more likely to defer. It examines
 * nobody, acquires or interprets no ECG, monitor, laboratory or imaging data,
 * diagnoses no cause, delivers no oxygen, atropine, medication or infusion,
 * paces nothing, selects no rate, current, energy, sedation or device,
 * assesses no capture, implants or programs nothing, determines no
 * disposition, and predicts no outcome.
 */
export function completeHeartBlockDemonstrationStep(
  patient?: CompleteHeartBlockProgress,
): CompleteHeartBlockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is exactly as well as she was at the start, still in complete block, still perfused by an escape rhythm at 34, with no cause found and nothing paced. What changed is that she is now in a room that can act if the escape stops, and somebody owns the evaluation. Stability was never the reassuring part. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.12, action: 'reconcile-complete-heart-block-stability',
      narration: narrate(patient) };
  }
  if (patient.pathwayAtTick === null) {
    return { id: 'parallel', focus: 'actions', progress: 0.3, action: 'activate-complete-heart-block-pathway',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.5, action: 'review-complete-heart-block-context',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassessment', focus: 'monitor', progress: 0.72, action: 'reassess-complete-heart-block-trajectory',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-complete-heart-block-pacing-plan',
    narration: narrate(patient) };
}
