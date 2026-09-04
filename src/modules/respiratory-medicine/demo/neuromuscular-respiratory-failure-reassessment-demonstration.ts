import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNeuromuscularRespiratoryFailure, type NeuromuscularRespiratoryFailureAction, type NeuromuscularRespiratoryFailureProgress,
} from '../neuromuscular-respiratory-failure-reassessment';
import { neuromuscularRespiratoryFailureInlinePrompt } from '../tutor/neuromuscular-respiratory-failure-reassessment-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: NeuromuscularRespiratoryFailureProgress): string {
  const prompt = neuromuscularRespiratoryFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const NEUROMUSCULAR_RESPIRATORY_FAILURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNeuromuscularRespiratoryFailureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNeuromuscularRespiratoryFailure(scenario);
}

export interface NeuromuscularRespiratoryFailureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NeuromuscularRespiratoryFailureAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient whose saturation looks fine.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires, scores and interprets no
 * mechanics, cough test, gas or image, selects no oxygen, device, interface,
 * mode, setting, cough assistance or nutrition, performs no procedure, and
 * determines no disposition, prognosis or outcome.
 */
export function neuromuscularRespiratoryFailureDemonstrationStep(
  patient?: NeuromuscularRespiratoryFailureProgress,
): NeuromuscularRespiratoryFailureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Experienced help is connected, the causes are still open, his priorities are written down rather than assumed, and every remaining piece of work has somebody’s name on it. Nothing was diagnosed, nothing was prescribed, and no device was chosen. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-neuromuscular-respiratory-failure-trajectory',
      narration: narrate(patient) };
  }
  if (patient.failureAtTick === null) {
    return { id: 'failure', focus: 'monitor', progress: 0.28, action: 'recognize-neuromuscular-respiratory-failure',
      narration: narrate(patient) };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.46, action: 'activate-neuromuscular-respiratory-failure-escalation',
      narration: narrate(patient) };
  }
  if (patient.reviewAtTick === null) {
    return { id: 'review', focus: 'monitor', progress: 0.64, action: 'review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives',
      narration: narrate(patient) };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.8, action: 'coordinate-neuromuscular-respiratory-failure-goals-and-ownership',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neuromuscular-respiratory-failure-reassessment',
    narration: narrate(patient) };
}
