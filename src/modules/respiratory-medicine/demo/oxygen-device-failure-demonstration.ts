import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsOxygenDeviceFailure, type OxygenDeviceFailureAction,
  type OxygenDeviceFailureProgress,
} from '../oxygen-device-failure';

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
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is back on her own pathway from a source that has been checked, with a backup behind it and somebody experienced at the bedside — and the scan she was being taken to is still just as scheduled as it was. Nothing here proves the restoration will hold or excludes another cause if her recovery is incomplete. This ends the example, not the evaluation.' };
  }
  if (patient.reconciledAtTick === null) {
    return { id: 'reconcile', focus: 'monitor', progress: 0.1, action: 'reconcile-oxygen-device-failure-patient-signal-and-delivery',
      narration: 'Believe the person and the pleth before you believe the equipment. Four minutes ago she was alert in full sentences at 93% on her established low-flow pathway. She is now frightened and dyspneic in short sentences, 30 breaths a minute, heart rate 106, and 84% with a strong regular pleth behind it. The cannula is in place and the selector reads the same 4 L/min it always did. That is the trap: an attached interface and a chosen number are not evidence of delivered oxygen. The monitor’s FiO₂ 0.40 is a display proxy, not a dose she is receiving.' };
  }
  if (patient.bridgeAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.28, action: 'activate-oxygen-device-failure-immediate-bridge-and-help',
      narration: 'Call for help and get oxygen from somewhere else, now. A separate verified source is the whole intervention at this moment. You do not yet know what has failed and you do not need to: the label on the fault can wait, and she cannot. Bridging is not repairing — no cylinder, valve, regulator, flowmeter, tubing or cannula is inspected, opened, attached, replaced or operated by you, and no flow, FiO₂ or target is selected. Qualified staff own all of that. What you are recording is that she gets oxygen from a source that works, while somebody more experienced is on the way.' };
  }
  if (patient.pathAtTick === null) {
    return { id: 'path', focus: 'monitor', progress: 0.46, action: 'review-oxygen-device-failure-source-to-patient-path',
      narration: 'Now trace it, from the source all the way to her nose. With a bridge running there is time to find out what actually failed, and the qualified review reports it: the cannula is correctly positioned, the tubing and cannula are patent and unkinked, and there is no remaining pressure at the portable source and no downstream flow despite where the selector is pointing. The cylinder is empty. Bilateral breathing is unchanged, with no apnea, arrest, shock, new unilateral pain, airway-obstruction claim or monitor incoherence — which localizes this to a delivery interruption without permanently excluding another cause if she does not recover fully.' };
  }
  if (patient.restorationAtTick === null) {
    return { id: 'restoration', focus: 'actions', progress: 0.64, action: 'record-oxygen-device-failure-restoration-and-backup-intent',
      narration: 'Restore her established pathway properly, and put a backup behind it. A checked replacement source, her own prescribed low-flow pathway, and independent backup so that the next failure is an inconvenience rather than a repeat of this. The restoration is qualified work, not yours: you are recording the intent and the standard it has to meet. Nothing here selects a device, source, interface, flow, FiO₂, target or prescription, and nothing here repairs anything.' };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.8, action: 'review-oxygen-device-failure-delivery-and-patient-response',
      narration: 'Give it time, then check the delivery and the person separately. The three-minute report is fixed and cannot be read before simulated time has passed. Two things need to be true, and they are not the same thing: that oxygen is now actually being delivered, and that she is actually better — her speech, her rate, her distress and her saturation together. A restored number on a device is not a recovered patient, and this is the lesson where confusing the two is exactly the error being taught.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-oxygen-device-failure-reassessment',
    narration: 'Hand off an equipment failure that had a patient attached to it. What travels is her established pathway and her baseline, what she looked like when the delivery failed, the bridge, the source-to-patient findings that localized it, the restoration and its backup, the three-minute response, and what stays open — because a delivery interruption explains this episode without permanently excluding another cause if her recovery is incomplete. Nothing here proves durable restoration, decides transport readiness or disposition, or predicts an outcome. And this belongs in whatever process reviews the cylinder that arrived empty.' };
}
