import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPostInfarctionShock, type PostInfarctionShockAction,
  type PostInfarctionShockProgress,
} from '../post-infarction-shock';

export const POST_INFARCTION_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPostInfarctionShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPostInfarctionShock(scenario);
}

export interface PostInfarctionShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PostInfarctionShockAction; readonly finished?: boolean;
}

/**
 * The worked example for a pressure that improved and a patient who did not.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it reopens the causes first and calls
 * second, which is one valid order rather than the required one. It acquires
 * and interprets no examination, monitoring, laboratory, ECG, echo,
 * angiographic or hemodynamic finding, diagnoses nothing, prescribes and
 * delivers no drug or fluid, selects or places no device, performs no PCI,
 * surgery or transport, determines no disposition, and predicts no prognosis
 * or outcome.
 */
export function postInfarctionShockDemonstrationStep(
  patient?: PostInfarctionShockProgress,
): PostInfarctionShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'A phone call was made early, the diagnosis was reopened rather than assumed, and no device was chosen by anyone in this building. Whether she travels, and where, is still somebody else\'s decision — which is the accurate ending rather than a tidy one. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.12, action: 'reconcile-post-infarction-shock-trajectory',
      narration: 'The pressure moved. Nothing that matters moved with it. Six hours after culprit-vessel PCI for an anterior STEMI, with immediate post-procedure patency documented, and she is going backwards. The vasoactive support raised her MAP from 57 to 64 — and she is newly drowsy, her knees are cool and mottled, her refill is five seconds, she made 8 mL of urine in the last hour, and her lactate has gone from 4.2 to 5.1. Every one of those is a measure of whether blood is reaching tissue, and every one of them is worse. A MAP is a pressure, not a flow, and this is what it looks like when the two come apart. She is in a hospital with no on-site advanced shock support, which is a fact about the next hour rather than background.' };
  }
  if (patient.causesAtTick === null) {
    return { id: 'causes', focus: 'monitor', progress: 0.34, action: 'reopen-post-infarction-shock-causes',
      narration: 'Two things at once: ask why again, and phone people who can do more than you can. Start by reopening the causes. The fixed reports are reassuring and they are snapshots: patent culprit flow immediately after PCI, persistent severe LV dysfunction, a preserved RV, no effusion, no reported acute severe mitral regurgitation or ventricular-septal defect, sinus tachycardia, haemoglobin 11.8 and no visible access-site bleeding. None of that permanently excludes re-occlusion, evolving mechanical disease, a right-heart, rhythm, bleeding, vasodilated or obstructive cause. "Immediately after PCI" is six hours ago. A patient who is deteriorating despite a patent vessel is a patient whose diagnosis may have changed since the last picture of it.' };
  }
  if (patient.transferAtTick === null) {
    return { id: 'transfer', focus: 'actions', progress: 0.56, action: 'contact-post-infarction-shock-center',
      narration: 'The causes are reopened. She is still in a hospital that cannot do this. Activate the local shock team and contact the regional advanced shock centre for consultation and transfer evaluation. Note that this is a phone call rather than a decision: whether she is transferred, when, and to which centre are not yours and are not settled here — stability, contraindications, her preferences and accepting-centre selection all remain open. What the call buys is time and expertise applied earlier, and in a deteriorating post-infarction shock the cost of making it late is not recoverable by making it well.' };
  }
  if (patient.bridgeAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.78, action: 'record-post-infarction-shock-bridge',
      narration: 'Build a bridge for a transport that may not happen. What gets recorded is an individualized potential-transport bridge — potential being the operative word, since whether or when she goes is still open. The discipline here is that no device is selected. There is a strong pull in post-infarction cardiogenic shock toward reaching for mechanical support as though the decision were about which device rather than about whether, for whom, and by whom; this lab selects none and delivers nothing, and the agent, dose and target of the existing vasoactive support are not modeled either. What you are recording is what the bridge has to cover, not what fills it.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-post-infarction-shock-trajectory',
    narration: 'Let time pass, then hand over the work that is still unfinished. What travels is the serial perfusion trajectory with both lactates, the urine output and the mentation change, the pressure response stated as a pressure response rather than an improvement, the reported PCI and its immediate patency with the caveat that the picture is six hours old, which causes were reopened and which remain open, who was called and what was said, the bridge and its conditions, and everything still undecided — stability, contraindications, preferences, accepting-centre selection, and whether or when transfer occurs. Nothing here diagnoses, prescribes, delivers a drug or fluid, selects or places a device, performs a procedure, determines disposition, or predicts a prognosis or an outcome.' };
}
