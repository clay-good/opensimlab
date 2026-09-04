import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsUndifferentiatedShock, type UndifferentiatedShockAction,
  type UndifferentiatedShockProgress,
} from '../undifferentiated-shock';
import { undifferentiatedShockInlinePrompt } from '../tutor/undifferentiated-shock-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: UndifferentiatedShockProgress): string {
  const prompt = undifferentiatedShockInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const UNDIFFERENTIATED_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsUndifferentiatedShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsUndifferentiatedShock(scenario);
}

export interface UndifferentiatedShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: UndifferentiatedShockAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a shock nobody names.
 *
 * Seven beats. The perfusion review and the lactate are an unordered pair, so
 * the example shows one order of them and the claim that neither is a
 * precondition sits in the closing narration, which every path reaches. It
 * examines nobody, measures nothing, acquires and interprets no image, gives no
 * real fluid, diagnoses nothing, and predicts no outcome.
 */
export function undifferentiatedShockDemonstrationStep(
  patient?: UndifferentiatedShockProgress,
): UndifferentiatedShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.escalationAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'A pattern narrowed, a response tested reversibly before it was committed to, and a cause still open. That is the example. The perfusion findings and the lactate were taken in that order here, but neither is a precondition for the other and the engine accepts them either way round — what is gated is everything after them, and the gates all point the same direction: the test you can undo comes before the one you cannot. Nothing was examined, imaged, infused, or diagnosed. This ends the example, not the evaluation.' };
  }
  if (patient.perfusionReviewedAtTick === null) {
    return { id: 'perfusion', focus: 'monitor', progress: 0.1,
      action: 'review-perfusion', narration: narrate(patient) };
  }
  if (patient.lactateReviewedAtTick === null) {
    return { id: 'lactate', focus: 'monitor', progress: 0.24,
      action: 'review-lactate', narration: narrate(patient) };
  }
  if (patient.focusedEchoReviewedAtTick === null) {
    return { id: 'echo', focus: 'monitor', progress: 0.38,
      action: 'review-focused-echo', narration: narrate(patient) };
  }
  if (patient.passiveLegRaiseAtTick === null) {
    return { id: 'leg-raise', focus: 'actions', progress: 0.52,
      action: 'perform-passive-leg-raise', narration: narrate(patient) };
  }
  if (patient.fluidChallengeAtTick === null) {
    return { id: 'fluid', focus: 'actions', progress: 0.66,
      action: 'give-targeted-fluid-challenge', narration: narrate(patient) };
  }
  if (patient.perfusionReassessedAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.8,
      action: 'reassess-perfusion', narration: narrate(patient) };
  }
  return { id: 'escalate', focus: 'actions', progress: 0.92,
    action: 'escalate-after-reassessment', narration: narrate(patient) };
}
