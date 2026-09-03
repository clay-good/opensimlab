import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsTargetedTemperatureManagement, type TargetedTemperatureManagementAction,
  type TargetedTemperatureManagementProgress,
} from '../targeted-temperature-management';
import { targetedTemperatureManagementInlinePrompt } from '../tutor/targeted-temperature-management-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: TargetedTemperatureManagementProgress): string {
  const prompt = targetedTemperatureManagementInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const TARGETED_TEMPERATURE_MANAGEMENT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTargetedTemperatureManagementDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTargetedTemperatureManagement(scenario);
}

export interface TargetedTemperatureManagementDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TargetedTemperatureManagementAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a number a generation was taught to reach for.
 *
 * Five beats in the only order the engine accepts. It measures nothing, selects
 * no device, fluid, medication or target-selection rule, cools and warms
 * nobody, treats no shivering, diagnoses nothing, makes no neurologic
 * prognosis, determines no disposition, and predicts no outcome.
 */
export function targetedTemperatureManagementDemonstrationStep(
  patient?: TargetedTemperatureManagementProgress,
): TargetedTemperatureManagementDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'No number was picked and her temperature is controlled anyway. The example spent its five steps on the two things the evidence actually left standing — control the temperature deliberately, and do not let her get hot — and on the guardrails where the control itself does harm. She still does not follow commands, which is what she was doing at the start and means no more now than it did then. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'monitor', progress: 0.12,
      action: 'recognize-post-arrest-temperature-control', narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.32,
      action: 'review-post-arrest-temperature-context', narration: narrate(patient) };
  }
  if (patient.protocolAtTick === null) {
    return { id: 'protocol', focus: 'actions', progress: 0.54,
      action: 'activate-post-arrest-temperature-protocol', narration: narrate(patient) };
  }
  if (patient.guardrailsAtTick === null) {
    return { id: 'guardrails', focus: 'actions', progress: 0.76,
      action: 'record-temperature-control-guardrails', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-post-arrest-temperature-trajectory', narration: narrate(patient) };
}
