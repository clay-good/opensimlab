import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PacemakerCaptureFailureProgress } from '../pacemaker-capture-failure';

export const PACEMAKER_CAPTURE_FAILURE_TUTOR_VERSION = '0.1.0';

export interface PacemakerCaptureFailurePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the monitor rate. The screen shows a paced
 * rhythm at the programmed rate and the patient has a pulse of 32, because six
 * of ten pacing artifacts are not followed by a QRS — a spike is not a
 * heartbeat, and the number on the display is counting spikes. The second
 * reflex is the interesting one: this is a device problem, device problems
 * invite troubleshooting, and the lesson deliberately puts the rescue inside
 * the unordered group so that nothing has to be understood before the patient
 * is kept perfused. It is silent on the unassisted setting, silent once the
 * handoff is recorded, and silent for any scenario version it was not written
 * against.
 */
export function pacemakerCaptureFailureInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PacemakerCaptureFailureProgress },
): PacemakerCaptureFailurePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('pcf-recognition', true,
    'Count the pulse, not the spikes. The monitor is telling you a rate the patient does not have.',
    'A seventy-six-year-old man with a dual-chamber pacemaker implanted three years ago for complete AV block, abrupt presyncope and weakness. His records report 99.8% ventricular pacing and no reliable intrinsic rhythm faster than 30, which makes him dependent in the literal sense: this device is his heart rate. The fixed ten-second report shows ten ventricular pacing artifacts at the programmed lower rate and six of them are not followed by a paced QRS. His mechanical pulse is 32, his pressure 84/52, and he is awake and oriented but cool. The pulse and the pleth follow the actual QRS complexes and not the isolated artifacts, which is the whole recognition: a spike is an electrical event and a heartbeat is a mechanical one, and the display is counting the wrong thing. Name that before anything else, and hold onto the fact that pulse loss opens the arrest pathway.');
  if (patient.rescueAtTick === null && patient.deviceSystemAtTick === null
    && patient.causesAtTick === null) return prompt('pcf-lanes', true,
    'Three lanes, any order — and one of them keeps him alive while the other two explain why.',
    'Rescue is in this group rather than in front of it, which is a deliberate design and not a shortcut: acute bradycardia rescue, backup pacing readiness and device expertise are activated without waiting for troubleshooting to finish, because a dependent patient at 32 and 84/52 cannot wait for anybody to understand his lead. Equally, arranging the rescue does not close the review — the device-system report and the cause list still have to be read, because the bridge is temporary and the thing that broke has not been found. Whichever you take first, take the one that changes what happens to him in the next ten minutes — and the arithmetic is not subtle: at 32 with a pressure of 84/52 and no intrinsic escape above 30, the margin between where he is and where he stops is measured in a handful of beats.');
  if (patient.rescueAtTick === null) return prompt('pcf-rescue', true,
    'He is symptomatic and dependent. Get the bridge organised now.',
    'What gets recorded is acute bradycardia rescue, backup pacing readiness — transcutaneous now, transvenous if it is needed — and device or electrophysiology expertise on the way, with the arrest pathway explicit if the pulse goes. You pace nothing, program nothing and select no output; the readiness is what you are recording, not a delivery. The reason this cannot queue behind the troubleshooting is arithmetic rather than judgment: at 32 with a pressure of 84/52 and no intrinsic escape above 30, the margin between where he is and where he stops is measured in a handful of beats.');
  if (patient.deviceSystemAtTick === null) return prompt('pcf-device', true,
    'Read the interrogation report as a set of trends, not a verdict.',
    'The experienced team\'s fixed report: the battery is not at elective replacement with an estimated 6.1 years left, so this is not a depleted device. The programmed right-ventricular output is 2.5 V at 0.4 ms and the capture threshold has gone from 0.75 V to 3.5 V — the output has not changed, the threshold has climbed past it, and that alone explains the intermittent noncapture. The right-ventricular impedance rose abruptly from 520 to 1,860 ohms, the atrial values are stable, and the stored ventricular electrograms contain intermittent nonphysiologic noise. An abrupt high impedance with noise on one chamber only is a picture that points hard at lead or system integrity — and it points rather than proves. It does not establish a fracture, choose a correction, or turn 1,860 ohms into a universal threshold, and you interrogate and program nothing here.');
  if (patient.causesAtTick === null) return prompt('pcf-causes', true,
    'Now the things that are not the lead — and notice that ruling them out does not name the mechanism.',
    'The fixed values are a potassium of 4.2, a magnesium of 2.0, a pH of 7.39, normal oxygenation, a chest radiograph without gross displacement, pneumothorax or obvious fracture, and a quiet pocket. So the metabolic and acid-base causes of a rising threshold are not in play here, and nothing gross is visible. What that narrows is real and what it leaves open is larger: a radiograph that shows no obvious fracture does not exclude one, and the lead-connector interface, the generator, the lead-myocardial interface, ischemia, medications and recent procedures all remain candidates. This is a differential that has been narrowed by findings rather than closed by them, and the honest record says which.');
  if (patient.laterPanelAtTick === null) return prompt('pcf-panel', true,
    'Let time pass, then read what the experienced team achieved — and who achieved it.',
    'The fixed report is that a manufacturer- and lead-specific temporary programming change restored consistent electrical and mechanical capture at 70/min, with a pressure of 114/68, alert warm perfusion and resolved presyncope. Two things about that. The change belongs to the team that made it and to that device and that lead, and no setting is exposed here as a recipe, because a value that rescued this patient could be the wrong value in the next one. And the word doing the work is temporary: the threshold climbed for a reason, the impedance jumped for a reason, and a programming change that outruns the problem has not fixed it. He is captured again and he is not repaired.');
  return prompt('pcf-handoff', true,
    'Hand off a bridge, not a solution.',
    'What goes across is continued capture surveillance — because what changed once can change again — the unresolved lead and system integrity question, the rescue triggers including the arrest pathway if the pulse goes, and a named electrophysiology owner, because the definitive answer is a conversation about a lead and this is not the team that has it. What does not go across is a decision: no lead intervention, no programming, no disposition, no prognosis and no outcome, and temporary stability is not permission to stop watching. Nothing in this lesson examines him, acquires or interprets an ECG, telemetry, interrogation, laboratory or imaging report, diagnoses the mechanism, paces, assesses capture, interrogates or programs a device, selects an output, manipulates a lead, delivers a treatment, determines disposition or prognosis, or predicts outcome.');
}
