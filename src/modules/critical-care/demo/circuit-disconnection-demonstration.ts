import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCircuitDisconnection, type CircuitDisconnectionAction, type CircuitDisconnectionProgress,
} from '../circuit-disconnection';
import { circuitDisconnectionInlinePrompt } from '../tutor/circuit-disconnection-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: CircuitDisconnectionProgress): string {
  const prompt = circuitDisconnectionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const CIRCUIT_DISCONNECTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCircuitDisconnectionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCircuitDisconnection(scenario);
}

export interface CircuitDisconnectionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CircuitDisconnectionAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a fix everybody wants to reach for first.
 *
 * Five beats in the only order the engine accepts. It examines nobody, acquires
 * no monitoring, handles no equipment or airway, ventilates nobody, delivers no
 * oxygen or drug, diagnoses nothing, determines no disposition, and predicts no
 * outcome.
 */
export function circuitDisconnectionDemonstrationStep(
  patient?: CircuitDisconnectionProgress,
): CircuitDisconnectionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The circuit was disconnected and reconnecting it was the fix, which was true from the first second and is not the lesson. The lesson is that he was oxygenated before anybody went looking for the join, and that the alarm going quiet was not what closed it — a delivered breath was. Nothing was reconnected or handled here. This ends the example, not the evaluation.' };
  }
  if (patient.recognizedAtTick === null) {
    return { id: 'recognize', focus: 'monitor', progress: 0.12,
      action: 'recognize-ventilator-circuit-disconnection', narration: narrate(patient) };
  }
  if (patient.bridgedAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.32,
      action: 'bridge-ventilator-circuit-disconnection', narration: narrate(patient) };
  }
  if (patient.inspectedAtTick === null) {
    return { id: 'inspect', focus: 'monitor', progress: 0.54,
      action: 'inspect-ventilator-circuit-disconnection', narration: narrate(patient) };
  }
  if (patient.restoredAtTick === null) {
    return { id: 'restore', focus: 'actions', progress: 0.76,
      action: 'restore-ventilator-circuit-support', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-ventilator-circuit-response', narration: narrate(patient) };
}
