import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsFailedIntubation, type FailedIntubationAction, type FailedIntubationProgress,
} from '../failed-obstetric-intubation-oxygenation-first';

export const FAILED_INTUBATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsFailedIntubationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsFailedIntubation(scenario);
}

export interface FailedIntubationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: FailedIntubationAction; readonly finished?: boolean;
}

/**
 * The worked example for an airway that is working and not secured.
 *
 * The tube was never the goal; oxygen is. This example examines nobody, manages
 * no airway, selects and manipulates no device, and makes no wake-or-proceed
 * decision.
 */
export function failedIntubationDemonstrationStep(
  patient?: FailedIntubationProgress,
): FailedIntubationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on oxygenated through a device nobody is calling secure, with a birth still to happen and a question about awareness she is not yet able to answer. Nothing was proven and nothing was excluded. This ends the example, not the airway.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-failed-intubation-oxygenation-anesthesia-obstetric-theatre-newborn-and-support-response',
      narration: 'Say “failed intubation” out loud before you take stock of anything. Declaring it is what stops a third attempt, and repeated attempts are how a manageable airway becomes an unmanageable one. The declaration also changes what everyone else is doing: anesthesia, obstetrics, theatre, the newborn team, communication and support ownership all reorganize around an airway that is not secured. Naming the failure is an action rather than an admission.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-failed-intubation-attempts-device-ventilation-aspiration-fetus-and-whole-person',
      narration: 'Read the airway as working, and the situation as still open. Two failed attempts, experienced help present, and a second-generation supraglottic device ventilating her with sustained waveform capnography, bilateral air entry, a saturation recovered from a nadir of 93% to 97%. That is adequate oxygenation, which is what matters — the tube was never the goal. Beside it: a category-1 caesarean that has not happened, a fetal baseline of 70, and a patient who is anesthetized and cannot take part in any of this.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.46, action: 'review-obstetrics-failed-intubation-attempt-limit-oxygenation-cico-awareness-and-aspiration-boundaries',
      narration: 'Let the oxygenation reassure you without letting it close anything. A working device is a rescue rather than a solution. Displacement, aspiration against an unprotected airway, awareness under an anesthetic nobody can titrate to her responses, deterioration in oxygenation, and progression to can’t-intubate-can’t-oxygenate all remain live while the saturation reads 97%. The attempt limit exists because attempts cause the harm, and front-of-neck access is a plan that belongs to the qualified team rather than a last resort nobody has thought about yet.' };
  }
  if (patient.decisionAtTick === null) {
    return { id: 'decision', focus: 'actions', progress: 0.64, action: 'review-obstetrics-failed-intubation-individualized-wake-or-proceed-and-parallel-readiness',
      narration: 'Hold wake-or-proceed as an individual judgment rather than a rule. There is no answer that is correct for every case: it turns on maternal factors, the fetal urgency at a baseline of 70, the surgical indication, aspiration and device risk, the experience of the people in the room, and what the airway is likely to do next. Whichever way it goes, the readiness runs in parallel — the birth, the newborn team, the airway plan, and the support she will need afterwards. This lesson does not make the decision, and neither does any protocol.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-failed-intubation-fixed-three-minute-qualified-course-report',
      narration: 'Read the fixed 3-minute report as this course rather than the right course. It describes what a qualified team did here. No airway, device, drug, anesthetic, birth plan or procedure is chosen here, it is a contrast rather than a recommendation, and it says nothing about what any other failed intubation should do.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-failed-intubation-airway-aspiration-awareness-birth-newborn-support-and-outcome-risk',
    narration: 'Nothing here establishes airway safety, excluded aspiration, excluded awareness, fetal recovery or a treatment effect. Hand off the device and its displacement risk, the aspiration question, the awareness question that she cannot answer and will have to be asked about afterwards, the birth, the newborn, the debrief she is owed, and the disposition.' };
}
