import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsOxygenDeviceFailure, type OxygenDeviceFailureAction,
  type OxygenDeviceFailureProgress,
} from '../oxygen-device-failure';
import { oxygenDeviceFailureInlinePrompt } from '../tutor/oxygen-device-failure-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: OxygenDeviceFailureProgress): string {
  const prompt = oxygenDeviceFailureInlinePrompt('guided', { scenarioVersion: '0.1.1', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const OXYGEN_DEVICE_FAILURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsOxygenDeviceFailureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsOxygenDeviceFailure(scenario);
}

export interface OxygenDeviceFailureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: OxygenDeviceFailureAction; readonly finished?: boolean;
}

/**
 * The worked example for an empty cylinder in a corridor.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example takes none of the four reflexes — the tutor
 * answers those if a learner does. It examines nobody, measures no
 * saturation or flow, acquires and interprets no test, inspects, opens,
 * attaches, replaces, repairs or operates no equipment, and selects no
 * source, interface, flow, FiO₂ or target: it bridges, localizes, and hands
 * the qualified work to the people who own it.
 */
export function oxygenDeviceFailureDemonstrationStep(
  patient?: OxygenDeviceFailureProgress,
): OxygenDeviceFailureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is back on her own pathway from a source that has been checked, with a backup behind it and somebody experienced at the bedside — and the scan she was being taken to is still just as scheduled as it was. Nothing here proves the restoration will hold or excludes another cause if her recovery is incomplete. This ends the example, not the evaluation.' };
  }
  if (patient.reconciledAtTick === null) {
    return { id: 'reconcile', focus: 'monitor', progress: 0.1, action: 'reconcile-oxygen-device-failure-patient-signal-and-delivery',
      narration: narrate(patient) };
  }
  if (patient.bridgeAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.28, action: 'activate-oxygen-device-failure-immediate-bridge-and-help',
      narration: narrate(patient) };
  }
  if (patient.pathAtTick === null) {
    return { id: 'path', focus: 'monitor', progress: 0.46, action: 'review-oxygen-device-failure-source-to-patient-path',
      narration: narrate(patient) };
  }
  if (patient.restorationAtTick === null) {
    return { id: 'restoration', focus: 'actions', progress: 0.64, action: 'record-oxygen-device-failure-restoration-and-backup-intent',
      narration: narrate(patient) };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.8, action: 'review-oxygen-device-failure-delivery-and-patient-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-oxygen-device-failure-reassessment',
    narration: narrate(patient) };
}
