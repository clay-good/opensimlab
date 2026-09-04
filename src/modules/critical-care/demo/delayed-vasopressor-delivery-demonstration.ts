import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsDelayedVasopressorDelivery, type DelayedVasopressorDeliveryAction,
  type DelayedVasopressorDeliveryProgress,
} from '../delayed-vasopressor-delivery';
import { delayedVasopressorDeliveryInlinePrompt } from '../tutor/delayed-vasopressor-delivery-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: DelayedVasopressorDeliveryProgress): string {
  const prompt = delayedVasopressorDeliveryInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const DELAYED_VASOPRESSOR_DELIVERY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDelayedVasopressorDeliveryDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDelayedVasopressorDelivery(scenario);
}

export interface DelayedVasopressorDeliveryDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: DelayedVasopressorDeliveryAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a pump that is telling the truth about itself.
 *
 * Five beats in the only order the engine accepts. It inspects, measures,
 * calculates, primes, purges, flushes, boluses, programs, prescribes,
 * compounds and delivers nothing, manipulates no equipment, diagnoses no
 * shock, determines no disposition, and predicts no outcome.
 */
export function delayedVasopressorDeliveryDemonstrationStep(
  patient?: DelayedVasopressorDeliveryProgress,
): DelayedVasopressorDeliveryDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Nobody flushed the line and the drug arrived anyway. What the example spent its five steps on was refusing to read RUNNING as delivery — a pump command, 0.6 mL of drug-free tubing and a woman with a MAP of 54 were held apart until the record could say which one had changed. The reflex it exists to interrupt is the helpful one: knowing the drug is in the tubing makes pushing it obvious, and pushing it is a concentrated vasopressor bolus. This ends the example, not the evaluation.' };
  }
  if (patient.discordanceAtTick === null) {
    return { id: 'discordance', focus: 'monitor', progress: 0.12,
      action: 'review-vasopressor-command-delivery-discordance', narration: narrate(patient) };
  }
  if (patient.pathAtTick === null) {
    return { id: 'path', focus: 'actions', progress: 0.32,
      action: 'trace-vasopressor-source-to-patient-path', narration: narrate(patient) };
  }
  if (patient.classifiedAtTick === null) {
    return { id: 'classify', focus: 'monitor', progress: 0.54,
      action: 'classify-vasopressor-dead-space-startup-delay', narration: narrate(patient) };
  }
  if (patient.protocolAtTick === null) {
    return { id: 'protocol', focus: 'actions', progress: 0.76,
      action: 'activate-vasopressor-startup-safety-plan', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-vasopressor-delivery-and-perfusion', narration: narrate(patient) };
}
