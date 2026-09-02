import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PostInfarctionShockProgress } from '../post-infarction-shock';

export const POST_INFARCTION_SHOCK_TUTOR_VERSION = '0.1.0';

export interface PostInfarctionShockPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * The number that has to be refused here is a MAP: it went from 57 to 64, and
 * everything that measures whether blood is reaching tissue got worse. Causes
 * and the shock-centre call are unordered, so there is a beat for each of the
 * three ways that pair can be half done. It is silent on the unassisted
 * setting, silent once the handoff is recorded, and silent for any scenario
 * version it was not written against.
 */
export function postInfarctionShockInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PostInfarctionShockProgress },
): PostInfarctionShockPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('pis-trajectory', true,
    'The pressure moved. Nothing that matters moved with it.',
    'Six hours after culprit-vessel PCI for an anterior STEMI, with immediate post-procedure patency documented, and she is going backwards. The vasoactive support raised her MAP from 57 to 64 — and she is newly drowsy, her knees are cool and mottled, her refill is five seconds, she made 8 mL of urine in the last hour, and her lactate has gone from 4.2 to 5.1. Every one of those is a measure of whether blood is reaching tissue, and every one of them is worse. A MAP is a pressure, not a flow, and this is what it looks like when the two come apart. She is in a hospital with no on-site advanced shock support, which is a fact about the next hour rather than background.');
  if (patient.causesAtTick === null && patient.transferAtTick === null) return prompt('pis-parallel', true,
    'Two things at once: ask why again, and phone people who can do more than you can.',
    'Start by reopening the causes. The fixed reports are reassuring and they are snapshots: patent culprit flow immediately after PCI, persistent severe LV dysfunction, a preserved RV, no effusion, no reported acute severe mitral regurgitation or ventricular-septal defect, sinus tachycardia, haemoglobin 11.8 and no visible access-site bleeding. None of that permanently excludes re-occlusion, evolving mechanical disease, a right-heart, rhythm, bleeding, vasodilated or obstructive cause. "Immediately after PCI" is six hours ago. A patient who is deteriorating despite a patent vessel is a patient whose diagnosis may have changed since the last picture of it.');
  if (patient.causesAtTick === null) return prompt('pis-causes', true,
    'The call is made. Now go back and ask what is actually wrong.',
    'Contacting the shock centre was right and it does not answer the question. The fixed reports narrow without excluding: re-occlusion, evolving mechanical disease, right-heart, rhythm, bleeding, vasodilated and obstructive causes all stay open, and the echo and angiographic findings you were given describe a moment six hours in the past. This matters for the conversation you have just started as much as for her — the receiving team will ask what has been reconsidered since the procedure, and "nothing" is a poor answer in a patient who is deteriorating with a patent vessel.');
  if (patient.transferAtTick === null) return prompt('pis-transfer', true,
    'The causes are reopened. She is still in a hospital that cannot do this.',
    'Activate the local shock team and contact the regional advanced shock centre for consultation and transfer evaluation. Note that this is a phone call rather than a decision: whether she is transferred, when, and to which centre are not yours and are not settled here — stability, contraindications, her preferences and accepting-centre selection all remain open. What the call buys is time and expertise applied earlier, and in a deteriorating post-infarction shock the cost of making it late is not recoverable by making it well.');
  if (patient.bridgeAtTick === null) return prompt('pis-bridge', true,
    'Build a bridge for a transport that may not happen.',
    'What gets recorded is an individualized potential-transport bridge — potential being the operative word, since whether or when she goes is still open. The discipline here is that no device is selected. There is a strong pull in post-infarction cardiogenic shock toward reaching for mechanical support as though the decision were about which device rather than about whether, for whom, and by whom; this lab selects none and delivers nothing, and the agent, dose and target of the existing vasoactive support are not modeled either. What you are recording is what the bridge has to cover, not what fills it.');
  return prompt('pis-handoff', true,
    'Let time pass, then hand over the work that is still unfinished.',
    'What travels is the serial perfusion trajectory with both lactates, the urine output and the mentation change, the pressure response stated as a pressure response rather than an improvement, the reported PCI and its immediate patency with the caveat that the picture is six hours old, which causes were reopened and which remain open, who was called and what was said, the bridge and its conditions, and everything still undecided — stability, contraindications, preferences, accepting-centre selection, and whether or when transfer occurs. Nothing here diagnoses, prescribes, delivers a drug or fluid, selects or places a device, performs a procedure, determines disposition, or predicts a prognosis or an outcome.');
}
