import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMagnesiumToxicity, type MagnesiumToxicityAction, type MagnesiumToxicityProgress,
} from '../magnesium-sulfate-toxicity-recognition';

export const MAGNESIUM_TOXICITY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMagnesiumToxicityDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMagnesiumToxicity(scenario);
}

export interface MagnesiumToxicityDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MagnesiumToxicityAction; readonly finished?: boolean;
}

/**
 * The worked example for the quietest emergency in the module.
 *
 * Nothing here looks like a crisis, which is what magnesium does and why this
 * is missed. This example examines nobody, changes no infusion, manages no
 * airway, delivers no oxygen or ventilation, and selects no calcium or any
 * other drug.
 */
export function magnesiumToxicityDemonstrationStep(
  patient?: MagnesiumToxicityProgress,
): MagnesiumToxicityDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on better and still full of magnesium, with the kidneys that caused this no better than they were. Nothing was proven and nothing was excluded — not the reversal, not the clearance, not the other things this could also be. This ends the example, not the toxicity.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-magnesium-toxicity-airway-anesthesia-critical-care-pharmacy-and-support-response',
      narration: 'Get someone who can manage an airway here now, before you work anything out. A respiratory rate of nine with absent reflexes is respiratory failure arriving quietly, and the thing that makes magnesium toxicity dangerous is that it does not look dramatic until it is very late. Airway-capable anesthesia, obstetrics, critical care, pharmacy and support ownership all start now, while the assessment continues around them rather than before them.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-magnesium-toxicity-exposure-renal-respiratory-reflex-neurologic-and-whole-person',
      narration: 'Read the exposure and the kidneys together — that is the whole mechanism. She had a 4 g load and has been running 2 g an hour for twelve hours, and magnesium is cleared almost entirely by the kidneys. Her urine output has fallen to 70 mL in four hours and her creatinine has gone from 0.8 to 1.9. The dose never changed; her ability to remove it did. Over thirty-five minutes that has produced drowsiness, slurred speech, weakness, absent patellar reflexes and a respiratory rate of nine.' };
  }
  if (patient.uncertaintyAtTick === null) {
    return { id: 'uncertainty', focus: 'actions', progress: 0.46, action: 'review-obstetrics-magnesium-toxicity-multisignal-level-unit-and-alternative-cause-boundaries',
      narration: 'Let the clinical signs lead and treat the number as a supporting document. Magnesium levels are reported in three different units — 11.8 mg/dL is the same as 4.85 mmol/L and 9.7 mEq/L — and mixing them up is a documented source of error, so a number without its unit means nothing. This one was also drawn before the infusion was stopped, so it describes a moment that has already passed. The reflexes and the breathing are the assessment. And magnesium is not the only possible explanation: postpartum complications, other medicines, an airway or neurological cause, a metabolic derangement and a cardiopulmonary event all stay open.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.64, action: 'review-obstetrics-magnesium-toxicity-source-stop-airway-ventilation-antidote-monitoring-newborn-and-support-readiness',
      narration: 'Hold the source-stop, the airway and the antidote as one parallel readiness. The infusion is already stopped and isolated by qualified staff, which removes the cause but not the magnesium already in her. Airway and ventilation readiness, the calcium antidote, continuous monitoring of breathing and reflexes rather than intermittent checks, the newborn who is somewhere else, and support for her all belong to the same moment. Stopping the drug is the beginning of this rather than the end of it.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-magnesium-toxicity-fixed-five-minute-qualified-response-report',
      narration: 'Read the fixed 5-minute report as a partial response rather than a reversal. No infusion, airway maneuver, oxygen, ventilation, calcium, drug, dose or rate is chosen here. It is a contrast rather than a predicted trajectory, and nothing here says how any individual magnesium level falls once the infusion stops.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-magnesium-toxicity-respiratory-renal-preeclampsia-medication-newborn-support-and-outcome-risk',
    narration: 'A partial response is not a reversal: nothing here establishes complete recovery, cleared magnesium, recovered kidneys, a treatment effect, or a safe newborn. Hand off the respiratory and neurologic risk, the renal function that caused this, the severe preeclampsia she still has and the seizure prophylaxis question it raises, the medication review, the newborn, what she has just been through, and the disposition.' };
}
