import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ClinicStemiProgress } from '../clinic-stemi';

export const CLINIC_STEMI_TUTOR_VERSION = '0.1.0';

export interface ClinicStemiPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * What it has to hold is a setting: this is a clinic without a catheter
 * laboratory, and almost everything a learner might reach for belongs to
 * somebody down the road. The two things that are genuinely theirs are the
 * call and the honesty of the handover. It is silent on the unassisted
 * setting, silent once the handoff is recorded, and silent for any scenario
 * version it was not written against.
 */
export function clinicStemiInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: ClinicStemiProgress },
): ClinicStemiPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.1' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.patternAtTick === null) return prompt('cst-pattern', true,
    'Twenty-two minutes in, with a diagnostic ECG in your hand. Start the clock.',
    'A sixty-one-year-old woman in a clinic without a catheter laboratory, twenty-two minutes of ongoing central pressure with diaphoresis and nausea, and a fixed twelve-lead report of ST elevation in II, III and aVF with reciprocal depression in I and aVL — diagnostic of an acute inferior STEMI in this authored case. She is alert and warm, at 128/76, 62 a minute, 96% on air. You did not acquire that ECG and you are not interpreting it. What matters from this beat onward is that the tissue clock started before she arrived and everything after this either shortens the delay or lengthens it.');
  if (patient.transferAtTick === null && patient.dangerAtTick === null) return prompt('cst-parallel', true,
    'Make the call now. The screening happens while the phone is ringing.',
    'This is the sequencing the lesson exists for. Activating EMS and the regional STEMI system comes first — not because the screening does not matter, but because it does not have to finish before the call goes out. Transmit the fixed ECG and let the system pre-alert the receiving team it selects; destination and reperfusion strategy are the regional pathway\'s to choose and not yours. Two things this lesson explicitly refuses: private transport, and waiting for biomarkers, a completed checklist or paperwork. She is having a myocardial infarction now, and a troponin an hour from now will tell you what you already know.');
  if (patient.transferAtTick === null) return prompt('cst-transfer', true,
    'The screen is done. Nobody has been called.',
    'Screening the dangers was right and it moves her no closer to a catheter laboratory. Activate EMS and the regional STEMI system now: transmit the fixed ECG, let the system pre-alert its selected receiving team, and leave the destination and the reperfusion strategy to that pathway. No private transport and no waiting for biomarkers or paperwork. Every minute this sits unactivated is myocardium, and it is the one part of this consultation nobody else can do for you.');
  if (patient.dangerAtTick === null) return prompt('cst-danger', true,
    'The route is open. Now screen, in parallel, for what changes the journey.',
    'She is alert and warm at 128/76 with a heart rate of 62 and a saturation of 96% on air, and no shock, acute heart failure, sustained arrhythmia, mechanical complication, dissection pattern, active bleeding or aspirin contraindication is authored. Two things stay open and belong in the pre-alert rather than in your conclusions: right-ventricular involvement, which is why an inferior pattern matters here and why nitrates are somebody else\'s decision with that question unanswered, and an evolving bradyarrhythmia or atrioventricular block at a heart rate of 62 in an inferior infarct. Escalation continues while you do this; it does not pause for it.');
  if (patient.bridgeAtTick === null) return prompt('cst-bridge', true,
    'Keep the bridge small enough to be honest about.',
    'What a non-PCI clinic contributes between now and the ambulance is deliberately short: recorded aspirin suitability rather than a delivered drug, a monitored transport with rhythm surveillance, defibrillation readiness, access, and the triggers that would change the plan on the way. Note what is not here. Oxygen is not routine at a saturation of 96%, and giving it because the situation feels serious is a habit rather than a treatment. P2Y12 inhibition, anticoagulation, fibrinolysis and PCI are not selected in this lab, because the receiving team chooses them alongside a reperfusion strategy you do not know yet.');
  return prompt('cst-handoff', true,
    'Let the tick pass, reassess, and hand over the things only you have.',
    'The receiving team will get their own ECG and their own examination. What they cannot reconstruct is what you know: the exact symptom onset time, the ECG you already transmitted and when it was taken, her physiology at the moment you saw her and whether anything has changed since, her allergy and medication history including that no recent aspirin is reported, and the two questions still open — right-ventricular involvement and evolving block. Nothing here diagnoses a real patient, prescribes or delivers a drug, selects a downstream therapy, performs a procedure, determines disposition, or predicts a complication or an outcome.');
}
