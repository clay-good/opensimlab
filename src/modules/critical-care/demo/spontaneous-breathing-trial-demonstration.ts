import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsSpontaneousBreathingTrial, type SpontaneousBreathingTrialAction,
  type SpontaneousBreathingTrialProgress,
} from '../spontaneous-breathing-trial';
import { spontaneousBreathingTrialInlinePrompt } from '../tutor/spontaneous-breathing-trial-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: SpontaneousBreathingTrialProgress): string {
  const prompt = spontaneousBreathingTrialInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const SPONTANEOUS_BREATHING_TRIAL_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSpontaneousBreathingTrialDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSpontaneousBreathingTrial(scenario);
}

export interface SpontaneousBreathingTrialDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SpontaneousBreathingTrialAction;
  readonly finished?: boolean;
}

/**
 * The worked example that ends in a failure on purpose.
 *
 * Five beats in the only order the engine accepts. It examines nobody,
 * calculates no index, programs no ventilator, doses and delivers nothing,
 * extubates nobody, determines no disposition, and predicts no outcome.
 */
export function spontaneousBreathingTrialDemonstrationStep(
  patient?: SpontaneousBreathingTrialProgress,
): SpontaneousBreathingTrialDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.planAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'This example ends in a failed trial, and that is the point of it. She is back on the support she started with, and the thirty minutes bought a list — load, weakness, fluid, pain, sedation, sleep, secretions — that a team can work on before tomorrow. A trial that goes badly is information about what to fix, not a statement about whether she will ever come off. Nobody was extubated here, and nobody would have been on a good trial either. This ends the example, not the evaluation.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'monitor', progress: 0.12,
      action: 'review-sbt-readiness', narration: narrate(patient) };
  }
  if (patient.startedAtTick === null) {
    return { id: 'start', focus: 'actions', progress: 0.32,
      action: 'start-bounded-sbt', narration: narrate(patient) };
  }
  if (patient.failureAtTick === null) {
    return { id: 'failure', focus: 'monitor', progress: 0.54,
      action: 'recognize-sbt-failure', narration: narrate(patient) };
  }
  if (patient.recoveryAtTick === null) {
    return { id: 'recovery', focus: 'actions', progress: 0.76,
      action: 'stop-failed-sbt-and-recover', narration: narrate(patient) };
  }
  return { id: 'plan', focus: 'actions', progress: 0.9,
    action: 'plan-after-failed-sbt', narration: narrate(patient) };
}
