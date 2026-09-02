import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMaternalNeonatalHandoff, type MaternalNeonatalHandoffAction, type MaternalNeonatalHandoffProgress,
} from '../maternal-to-neonatal-resuscitation-handoff';

export const MATERNAL_NEONATAL_HANDOFF_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMaternalNeonatalHandoffDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMaternalNeonatalHandoff(scenario);
}

export interface MaternalNeonatalHandoffDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MaternalNeonatalHandoffAction; readonly finished?: boolean;
}

/**
 * The worked example for two patients in one room.
 *
 * The failure this refuses is the quiet one: nobody says who owns which
 * patient, and one of them stops being watched. This example examines nobody,
 * resuscitates no newborn, delivers no ventilation, and counsels no family.
 */
export function maternalNeonatalHandoffDemonstrationStep(
  patient?: MaternalNeonatalHandoffProgress,
): MaternalNeonatalHandoffDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Two patients are handed on, neither of them finished, with the placental findings and cord gases still to come. Nothing was proven and nothing was excluded — not the newborn’s stability, not her recovery, not why any of this happened. This ends the example, not the care.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-maternal-neonatal-handoff-two-patient-team-and-support-ownership',
      narration: 'Say out loud who owns the mother and who owns the newborn. Two patients in one room with overlapping teams is exactly where someone stops being watched, and the way that happens is never a decision — it is an assumption that the other team has it. Separate named ownership for her and for the newborn, someone owning the communication, and someone whose job is the family. She is awake and asking whether her baby is breathing, and answering her belongs to a named person rather than to whoever is nearest.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-maternal-neonatal-handoff-antenatal-intrapartum-birth-resuscitation-and-whole-family-context',
      narration: 'Put both clocks and the whole family in one view. Thirty-nine weeks, an urgent caesarean for persistent fetal bradycardia, birth at 14:07, a newborn apneic with a heart rate of 70 after initial steps, assisted ventilation begun inside the first minute, and now chest movement and a rate of 118. Her surgery is still going on. No fever, no meconium, no known anomaly is supplied — and the placental findings and cord gases that might explain any of this do not exist yet.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'monitor', progress: 0.46, action: 'review-obstetrics-maternal-neonatal-handoff-ventilation-priority-response-and-uncertainty-boundaries',
      narration: 'Read the rising heart rate as ventilation working, not as a newborn who is well. A heart rate that climbs from 70 to 118 with visible chest movement is the supplied evidence that effective ventilation is being delivered — which is the single most important thing in newborn resuscitation and also the narrowest claim available. It does not establish a completed transition, a safe respiratory trajectory, a normal neurologic state, a glucose, or a temperature. Whatever is producing that number is being produced continuously, by someone, right now.' };
  }
  if (patient.transferAtTick === null) {
    return { id: 'transfer', focus: 'actions', progress: 0.64, action: 'review-obstetrics-maternal-neonatal-handoff-structured-transfer-readback-and-parallel-readiness',
      narration: 'Hand over in a structure, and make the receiver say it back. Identity, the clocks, the trajectory that got here, what was actually done, how the newborn responded, what remains unresolved, and who owns what next — in that order, once, without interruption. The readback is not a formality: it is the only point at which a mistaken assumption becomes visible while it can still be corrected. Contingency readiness and the family conversation belong to the same moment rather than afterwards.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-maternal-neonatal-handoff-fixed-five-minute-qualified-course-report',
      narration: 'Read the fixed 5-minute report as this course rather than a trajectory. No treatment, ventilation, drug, transport or family counseling is chosen here. It is a contrast rather than a prediction, and it says nothing about how any other newborn behaves after a resuscitation like this one.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-maternal-neonatal-postresuscitation-monitoring-maternal-family-and-outcome-risk',
    narration: 'Nothing here establishes newborn stability, maternal recovery, a placental cause, or any outcome. Hand off the newborn’s respiratory trajectory, glucose, temperature and neurologic state, her own recovery from surgery and anesthesia, the placental findings and cord gases still to come, what the family have been told and by whom, the record, and the follow-up.' };
}
