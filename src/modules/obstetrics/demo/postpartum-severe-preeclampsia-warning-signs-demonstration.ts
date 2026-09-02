import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPostpartumPreeclampsia, type PostpartumPreeclampsiaAction, type PostpartumPreeclampsiaProgress,
} from '../postpartum-severe-preeclampsia-warning-signs';

export const POSTPARTUM_PREECLAMPSIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPostpartumPreeclampsiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPostpartumPreeclampsia(scenario);
}

export interface PostpartumPreeclampsiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PostpartumPreeclampsiaAction; readonly finished?: boolean;
}

/**
 * The worked example for an emergency that arrives after everyone has gone
 * home.
 *
 * She is six days past a term birth with no antepartum hypertension. The error
 * this refuses is waiting — for the urine protein, which is neither required
 * nor able to settle the diagnosis, or for the rest of the laboratory. This
 * example measures no pressure, interviews and examines nobody, acquires and
 * reads no laboratory value, and selects no antihypertensive, magnesium, dose,
 * route or target.
 */
export function postpartumPreeclampsiaDemonstrationStep(
  patient?: PostpartumPreeclampsiaProgress,
): PostpartumPreeclampsiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with a pressure that is no longer severe and a patient who is not safe. Nothing was proven and nothing was excluded — not durable control, not the cause, not the seizure that has not happened. This ends the example, not the emergency.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-obstetrics-postpartum-preeclampsia-clock-symptoms-pressure-organs-newborn-and-whole-person',
      narration: 'Start from what she has been telling you for four hours. Six days after a term birth, with no antepartum hypertension: a severe headache, flashing visual spots, and severe right upper-quadrant pain that the supplied history does not account for. Beside her own account sit two correctly obtained pressures of 178/114 and 174/112 fifteen minutes apart, platelets of 88, a creatinine that has risen from 0.7 to 1.2, and transaminases at more than twice the local upper limit. She is alert, conversant, and holding a six-day-old — none of which makes this less urgent.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-obstetrics-persistent-severe-postpartum-hypertension-and-supplied-preeclampsia-pattern-without-waiting-for-proteinuria',
      narration: 'Call it an emergency on the two readings, and do not wait for the urine protein. Two properly obtained severe-range pressures fifteen minutes apart are the whole trigger, and the clock to treatment runs sixty minutes from the first of them. Proteinuria is not required to recognize preeclampsia with severe features and could not settle it either way — these symptoms and this organ evidence are already the severe features. Naming it closes nothing: hemorrhage, infection, a thrombotic microangiopathy, a vascular event and a medication effect all stay open behind the name.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.46, action: 'activate-obstetrics-postpartum-severe-hypertension-protocol-qualified-obstetric-response-and-patient-centered-support-now',
      narration: 'Start the protocol now, and let the cause work run beside it rather than before it. The severe-hypertension protocol, the qualified obstetric response and the seizure-prevention assessment begin now, while measurement quality, brain, vision, lung, platelet, liver, kidney, urine, medication and competing-cause evaluation continues in parallel. Nothing about the parallel work is allowed to move the treatment later. She is six days postpartum with her newborn and her chosen support person beside her, so the feeding, the support person and the trauma-informed care are part of the response rather than courtesies added to it.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.64, action: 'review-obstetrics-postpartum-preeclampsia-supplied-neurologic-pulmonary-hematologic-renal-hepatic-medication-and-competing-cause-boundary',
      narration: 'Read the organ evidence as severe features rather than as a pending workup. Platelets of 88, transaminases at twice the local ceiling, a creatinine that has nearly doubled, and a headache and visual symptoms that persist are four organs speaking at once. The urine ratio and the hemolysis evaluation are pending and stay pending; nothing here identifies which cause this is, excludes the alternatives, or establishes eligibility for anything.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-postpartum-preeclampsia-fixed-later-pressure-symptom-organ-and-support-report',
      narration: 'Read the fixed later report as one reading rather than as control. It is authored as 30 minutes after activation and supplies 152/98, a heart rate of 92, improved but persistent headache and visual spots, no reported seizure, and repeat laboratories still pending. No product, dose, rate, target, route or access is chosen here, and nothing says how fast any individual pressure comes down.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-postpartum-preeclampsia-recurrent-pressure-seizure-stroke-pulmonary-hellp-renal-newborn-follow-up-and-outcome-risk',
    narration: '152/98 is out of the severe range and still hypertensive; it establishes no durable control, no target and no treatment effect, and her headache and visual spots are improved rather than gone. Hand off the recurrent pressure, the seizure and stroke risk, the pulmonary, hematologic, hepatic and renal risk, the repeat laboratories, the newborn and feeding, the trauma-informed support, the prompt follow-up that this diagnosis specifically requires, and her longer-term cardiovascular risk.' };
}
