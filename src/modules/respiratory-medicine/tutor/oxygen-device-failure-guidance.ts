import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { OxygenDeviceFailureProgress } from '../oxygen-device-failure';

export const OXYGEN_DEVICE_FAILURE_TUTOR_VERSION = '0.1.0';

export interface OxygenDeviceFailurePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps, including their last
 * wrong turn.
 *
 * This lesson offers four wrong answers across two decision points, and all
 * four are ordinary reflexes rather than blunders: wait for a gas, keep
 * going, turn it up, reseat the cannula. It is silent on the unassisted
 * setting, silent once the handoff is recorded, and silent for any scenario
 * version it was not written against.
 */
export function oxygenDeviceFailureInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: OxygenDeviceFailureProgress },
): OxygenDeviceFailurePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.1' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.reconciledAtTick === null) return prompt('odf-reconcile', true,
    'Believe the person and the pleth before you believe the equipment.',
    'Four minutes ago she was alert in full sentences at 93% on her established low-flow pathway. She is now frightened and dyspneic in short sentences, 30 breaths a minute, heart rate 106, and 84% with a strong regular pleth behind it. The cannula is in place and the selector reads the same 4 L/min it always did. That is the trap: an attached interface and a chosen number are not evidence of delivered oxygen. The monitor’s FiO₂ 0.40 is a display proxy, not a dose she is receiving.');
  if (patient.bridgeAtTick === null) {
    if (patient.lastUnsupportedChoice === 'blood-gas') return prompt('odf-blood-gas-refused', true,
      'You already have the finding. A gas would only confirm it later.',
      'The change in her, and a pulse-coherent saturation to match, is credible on its own — nothing about a blood gas would make it more true, and the time it takes is time she spends hypoxemic. Tests are how you resolve doubt, and there is no doubt here about whether she is deteriorating. There is only a question about why, and that question does not have to be answered before she gets oxygen. Nothing changed when you chose it, because nothing about her changed.');
    if (patient.lastUnsupportedChoice === 'continue-transport') return prompt('odf-transport-refused', true,
      'The scan will still be there. Stop the trolley.',
      'Carrying on is the most natural thing in the world when you are already halfway down a corridor and the department is expecting her — and it means she keeps being hypoxemic in the least monitored place in the hospital, further from help with every metre. The imaging is scheduled, not urgent, and none of it is part of this lab. Pause the transport and restore reliable oxygen first. Nothing changed when you chose it, because nothing about her changed.');
    return prompt('odf-bridge', true,
      'Call for help and get oxygen from somewhere else, now.',
      'A separate verified source is the whole intervention at this moment. You do not yet know what has failed and you do not need to: the label on the fault can wait, and she cannot. Bridging is not repairing — no cylinder, valve, regulator, flowmeter, tubing or cannula is inspected, opened, attached, replaced or operated by you, and no flow, FiO₂ or target is selected. Qualified staff own all of that. What you are recording is that she gets oxygen from a source that works, while somebody more experienced is on the way.');
  }
  if (patient.pathAtTick === null) return prompt('odf-path', true,
    'Now trace it, from the source all the way to her nose.',
    'With a bridge running there is time to find out what actually failed, and the qualified review reports it: the cannula is correctly positioned, the tubing and cannula are patent and unkinked, and there is no remaining pressure at the portable source and no downstream flow despite where the selector is pointing. The cylinder is empty. Bilateral breathing is unchanged, with no apnea, arrest, shock, new unilateral pain, airway-obstruction claim or monitor incoherence — which localizes this to a delivery interruption without permanently excluding another cause if she does not recover fully.');
  if (patient.restorationAtTick === null) {
    if (patient.lastUnsupportedChoice === 'increase-source') return prompt('odf-increase-refused', true,
      'There is nothing behind the number to turn up.',
      'Reaching for the flowmeter is the reflex of everyone who has ever watched a saturation fall, and on a source with no remaining pressure it changes a dial and nothing else. The selector was already reading 4 L/min while she desaturated — that is precisely how you know the number and the delivery had come apart. A depleted cylinder cannot deliver more oxygen by being asked for more. Nothing changed when you chose it, because nothing about her changed.');
    if (patient.lastUnsupportedChoice === 'reseat-cannula') return prompt('odf-reseat-refused', true,
      'The cannula is fine. The problem is upstream of it.',
      'Reseating the interface is a good instinct in most oxygen failures, and the qualified review has already answered it: the cannula is correctly positioned and the tubing and cannula are patent and unkinked. The interruption is at the source. Repeating a check that has already come back normal costs her time and moves the search away from where the fault actually is. Nothing changed when you chose it, because nothing about her changed.');
    return prompt('odf-restoration', true,
      'Restore her established pathway properly, and put a backup behind it.',
      'A checked replacement source, her own prescribed low-flow pathway, and independent backup so that the next failure is an inconvenience rather than a repeat of this. The restoration is qualified work, not yours: you are recording the intent and the standard it has to meet. Nothing here selects a device, source, interface, flow, FiO₂, target or prescription, and nothing here repairs anything.');
  }
  if (patient.responseAtTick === null) return prompt('odf-response', true,
    'Give it time, then check the delivery and the person separately.',
    'The three-minute report is fixed and cannot be read before simulated time has passed. Two things need to be true, and they are not the same thing: that oxygen is now actually being delivered, and that she is actually better — her speech, her rate, her distress and her saturation together. A restored number on a device is not a recovered patient, and this is the lesson where confusing the two is exactly the error being taught.');
  return prompt('odf-handoff', true,
    'Hand off an equipment failure that had a patient attached to it.',
    'What travels is her established pathway and her baseline, what she looked like when the delivery failed, the bridge, the source-to-patient findings that localized it, the restoration and its backup, the three-minute response, and what stays open — because a delivery interruption explains this episode without permanently excluding another cause if her recovery is incomplete. Nothing here proves durable restoration, decides transport readiness or disposition, or predicts an outcome. And this belongs in whatever process reviews the cylinder that arrived empty.');
}
