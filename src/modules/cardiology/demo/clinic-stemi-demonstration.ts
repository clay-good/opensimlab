import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsClinicStemi, type ClinicStemiAction, type ClinicStemiProgress } from '../clinic-stemi';

export const CLINIC_STEMI_DEMONSTRATION_VERSION = '0.1.0';

export function supportsClinicStemiDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsClinicStemi(scenario);
}

export interface ClinicStemiDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ClinicStemiAction; readonly finished?: boolean;
}

/**
 * The worked example for a STEMI in the wrong building.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it activates first and screens second,
 * which is the order the lesson argues for rather than the only one the engine
 * allows. It examines nobody, acquires and interprets no ECG or test,
 * diagnoses no real patient, prescribes and delivers no drug, selects no P2Y12
 * inhibition, anticoagulation, fibrinolysis, PCI, nitrate or opioid therapy,
 * performs no procedure, determines no disposition, and predicts no
 * complication or outcome.
 */
export function clinicStemiDemonstrationStep(
  patient?: ClinicStemiProgress,
): ClinicStemiDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The ambulance is coming, the receiving team already has her ECG, and nothing was given that somebody down the road will have to work around. The clinic\'s contribution was a phone call made early and a handover nobody else could write. This ends the example, not the evaluation.' };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.12, action: 'reconcile-clinic-stemi-pattern',
      narration: 'Twenty-two minutes in, with a diagnostic ECG in your hand. Start the clock. A sixty-one-year-old woman in a clinic without a catheter laboratory, twenty-two minutes of ongoing central pressure with diaphoresis and nausea, and a fixed twelve-lead report of ST elevation in II, III and aVF with reciprocal depression in I and aVL — diagnostic of an acute inferior STEMI in this authored case. She is alert and warm, at 128/76, 62 a minute, 96% on air. You did not acquire that ECG and you are not interpreting it. What matters from this beat onward is that the tissue clock started before she arrived and everything after this either shortens the delay or lengthens it.' };
  }
  if (patient.transferAtTick === null) {
    return { id: 'transfer', focus: 'actions', progress: 0.34, action: 'activate-clinic-stemi-transfer',
      narration: 'Make the call now. The screening happens while the phone is ringing. This is the sequencing the lesson exists for. Activating EMS and the regional STEMI system comes first — not because the screening does not matter, but because it does not have to finish before the call goes out. Transmit the fixed ECG and let the system pre-alert the receiving team it selects; destination and reperfusion strategy are the regional pathway\'s to choose and not yours. Two things this lesson explicitly refuses: private transport, and waiting for biomarkers, a completed checklist or paperwork. She is having a myocardial infarction now, and a troponin an hour from now will tell you what you already know.' };
  }
  if (patient.dangerAtTick === null) {
    return { id: 'danger', focus: 'monitor', progress: 0.56, action: 'screen-clinic-stemi-danger',
      narration: 'The route is open. Now screen, in parallel, for what changes the journey. She is alert and warm at 128/76 with a heart rate of 62 and a saturation of 96% on air, and no shock, acute heart failure, sustained arrhythmia, mechanical complication, dissection pattern, active bleeding or aspirin contraindication is authored. Two things stay open and belong in the pre-alert rather than in your conclusions: right-ventricular involvement, which is why an inferior pattern matters here and why nitrates are somebody else\'s decision with that question unanswered, and an evolving bradyarrhythmia or atrioventricular block at a heart rate of 62 in an inferior infarct. Escalation continues while you do this; it does not pause for it.' };
  }
  if (patient.bridgeAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.78, action: 'record-clinic-stemi-bridge',
      narration: 'Keep the bridge small enough to be honest about. What a non-PCI clinic contributes between now and the ambulance is deliberately short: recorded aspirin suitability rather than a delivered drug, a monitored transport with rhythm surveillance, defibrillation readiness, access, and the triggers that would change the plan on the way. Note what is not here. Oxygen is not routine at a saturation of 96%, and giving it because the situation feels serious is a habit rather than a treatment. P2Y12 inhibition, anticoagulation, fibrinolysis and PCI are not selected in this lab, because the receiving team chooses them alongside a reperfusion strategy you do not know yet.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'reassess-clinic-stemi-handoff',
    narration: 'Let the tick pass, reassess, and hand over the things only you have. The receiving team will get their own ECG and their own examination. What they cannot reconstruct is what you know: the exact symptom onset time, the ECG you already transmitted and when it was taken, her physiology at the moment you saw her and whether anything has changed since, her allergy and medication history including that no recent aspirin is reported, and the two questions still open — right-ventricular involvement and evolving block. Nothing here diagnoses a real patient, prescribes or delivers a drug, selects a downstream therapy, performs a procedure, determines disposition, or predicts a complication or an outcome.' };
}
