import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsEclampsia, type EclampsiaAction, type EclampsiaProgress,
} from '../eclampsia-first-seizure-response';

export const ECLAMPSIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsEclampsiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsEclampsia(scenario);
}

export interface EclampsiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: EclampsiaAction; readonly finished?: boolean;
}

/**
 * The worked example for a seizure that has already stopped.
 *
 * Most eclamptic convulsions stop on their own, so the ending of this one is
 * not reassurance — the readiness for the next one is the work. This example
 * times and protects no seizure, positions and examines nobody, reads no fetal
 * trace, and selects no magnesium, antihypertensive, airway maneuver or birth.
 */
export function eclampsiaDemonstrationStep(
  patient?: EclampsiaProgress,
): EclampsiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on quieter, still hypertensive, still symptomatic, and still able to convulse again. Nothing was proven and nothing was excluded — not the cause, not the control, not the stroke that this may also be. This ends the example, not the emergency.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-obstetrics-eclampsia-seizure-clock-recovery-pressure-organs-fetal-context-and-whole-person',
      narration: 'Read the stopped seizure inside five hours of warning symptoms. A witnessed 70-second convulsion at 38 weeks and 2 days that stopped on its own three minutes ago, in a woman who had reported severe headache, flashing visual spots and epigastric pain for five hours beforehand. She is postictal but rousable and breathing. The pressure is 176/118, the platelets are 96, the creatinine has risen from 0.7 to 1.2, and the transaminases are above twice the local ceiling. The fetal baseline is 125 with minimal variability after transient slowing during the convulsion — which is what a fetus does after a maternal seizure.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-obstetrics-supplied-eclampsia-pattern-after-first-seizure-with-dangerous-alternatives-open',
      narration: 'Call it eclampsia now, and let the dangerous alternatives stay open behind it. A generalized convulsion in late pregnancy with severe hypertension, five hours of warning symptoms and organ involvement is the pattern, and it does not need the pending imaging, urine protein, hemolysis evaluation or toxicology to be acted on. Naming it excludes nothing: stroke, PRES, cerebral venous thrombosis, hemorrhage, epilepsy, infection, metabolic, toxic and traumatic causes all remain live, and the ones that are not eclampsia are exactly why the imaging still matters afterwards.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.46, action: 'activate-obstetrics-eclampsia-maternal-stabilization-seizure-severe-pressure-airway-obstetric-fetal-and-dignity-response-now',
      narration: 'Build for the next seizure rather than the one that has ended. Injury protection, airway and breathing readiness, monitoring, access, glucose review, the magnesium protocol, the immediate severe-pressure response and obstetric, anesthesia, nursing, pharmacy, critical-care, fetal, neonatal and dignity-centered ownership all begin now, with the cause review running beside them. The seizure stopping on its own is the ordinary course of an eclamptic convulsion rather than evidence that it is over, and recurrence is the specific thing this response exists to be ready for.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.64, action: 'review-obstetrics-eclampsia-supplied-neurologic-airway-aspiration-organ-fetal-metabolic-toxic-infectious-and-trauma-boundary',
      narration: 'Keep the fetus and the alternatives coupled to the recovery. The postictal state, the aspiration risk while she was convulsing, the platelets, the liver and the kidney all belong to one picture, and the fetal minimal variability follows the maternal seizure rather than standing apart from it. The imaging, toxicology and hemolysis evaluation stay pending; nothing here identifies the cause, excludes a stroke, or establishes eligibility for anything.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-eclampsia-fixed-later-recovery-pressure-breathing-fetal-and-organ-report',
      narration: 'Read the fixed 20-minute report as one sample rather than as recovery. It supplies no recurrent observed convulsion, improving alertness, 154/100, a heart rate of 102, and a fetal baseline of 145 with moderate variability and no reported deceleration in a short sample. No drug, dose, rate, target, route, access, airway maneuver or birth is chosen here, and a short fetal sample is a short sample.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-eclampsia-recurrence-airway-aspiration-stroke-pressure-organ-fetal-delivery-and-outcome-risk',
    narration: 'No recurrent convulsion, improving alertness, 154/100, and a reassuring short fetal sample — none of which establishes treatment effect, durable seizure or pressure control, neurologic recovery, fetal safety or delivery readiness, and her headache and visual symptoms persist. Hand off the recurrence risk, the airway and aspiration risk, the stroke question, the pressure, the organ trajectory, the fetal status, the birth timing and route, and the disposition.' };
}
