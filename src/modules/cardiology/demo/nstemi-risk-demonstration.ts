import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsNstemiRisk, type NstemiRiskAction, type NstemiRiskProgress } from '../nstemi-risk';

export const NSTEMI_RISK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNstemiRiskDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNstemiRisk(scenario);
}

export interface NstemiRiskDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NstemiRiskAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient who is comfortable right now.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires and interprets no test, calculates
 * no score, diagnoses nothing, prescribes and delivers no treatment, chooses no
 * procedure, determines no universal timing or disposition, and predicts no
 * prognosis or outcome.
 */
export function nstemiRiskDemonstrationStep(
  patient?: NstemiRiskProgress,
): NstemiRiskDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is still pain-free, which is the same sentence as an hour ago and not the same fact. What the next team inherits is two troponins, two ECGs, a screen done just now rather than on arrival, and a list of what would change the plan. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.12, action: 'reconcile-nstemi-serial-trajectory',
      narration: 'Three things moved. Read them together rather than one at a time. A sixty-seven-year-old woman, twenty-five minutes of central pressure five hours ago, pain-free now. The high-sensitivity troponin rises from 18 to 146 ng/L above the assay-specific ninety-ninth percentile. The ECG reports change too: horizontal ST depression in V4 to V6 first, then new lateral T-wave inversion. No single one of those is the finding. A rise on serial sampling is what separates infarction from a chronically elevated value, the assay-specific threshold is why a number without its assay means nothing, and an ECG that has changed between two recordings says more than either recording alone. She is comfortable at 132/78 — which is where she is, not where she has been.' };
  }
  if (patient.verificationAtTick === null) {
    return { id: 'verification', focus: 'monitor', progress: 0.34, action: 'verify-nstemi-and-alternatives',
      narration: 'Say NSTEMI, and keep the other reasons for a rising troponin in the room. The authored conclusion is a confirmed NSTEMI with high-risk features, and the reason to state it plainly is that it changes what happens next. The reason not to stop there is that a rising troponin is myocardial injury, and myocardial infarction is one cause of myocardial injury rather than the only one — myocarditis, pulmonary embolism, tachyarrhythmia, sepsis, renal impairment and takotsubo all live in the same laboratory result. Those alternatives stay part of a real assessment here, and you are neither diagnosing nor excluding any of them: no score is calculated and no test is acquired or interpreted by you.' };
  }
  if (patient.veryHighRiskAtTick === null) {
    return { id: 'veryHighRisk', focus: 'monitor', progress: 0.56, action: 'screen-nstemi-very-high-risk-features',
      narration: 'Screen again now. Do not inherit her stability from an earlier note. This is the beat the lesson exists for. Very-high-risk features are the ones that would move her from an inpatient strategy to an immediate one: haemodynamic instability or shock, recurrent or refractory chest pain despite treatment, acute heart failure attributable to ischemia, life-threatening arrhythmia or cardiac arrest, a mechanical complication, and recurrent dynamic ST change. None of those is authored right now. The word carrying the weight is "now" — she was screened when she arrived, and a patient with a rising troponin and an evolving ECG can acquire any of those features in the interval between two conversations. Re-screening is not repetition; it is the only thing that catches a change.' };
  }
  if (patient.strategyAtTick === null) {
    return { id: 'strategy', focus: 'actions', progress: 0.78, action: 'record-nstemi-invasive-strategy',
      narration: 'Record an inpatient invasive strategy, and let the timing belong to the pathway. High risk without a current very-high-risk feature is an inpatient invasive strategy rather than an immediate one, and the exact hour is not something this lab supplies. What goes into it: her ischemic risk, her bleeding risk — which is not a footnote, because the same catheter that treats the first raises the second — her comorbidity, her own preference, and what the local service can actually do and when. Regional pathways differ on timing and this lesson teaches none of them as the answer. You choose no procedure, calculate no score, and prescribe nothing.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'record-nstemi-monitoring-and-handoff',
    narration: 'Hand over a moving picture, not a snapshot. What travels is the serial trajectory itself — both troponin values with their assay context, both ECG reports and what changed between them, and the symptom timing — the classification as high risk with no current very-high-risk feature, and the invasive strategy recorded with its timing left to the pathway. Then the part that keeps working: the monitoring, the deterioration triggers that would make this very-high-risk, who owns her, and when the next reassessment is due. The alternatives to infarction stay named. Nothing here diagnoses, scores, prescribes or delivers treatment, chooses a procedure, determines universal timing or disposition, or predicts a prognosis or an outcome.' };
}
