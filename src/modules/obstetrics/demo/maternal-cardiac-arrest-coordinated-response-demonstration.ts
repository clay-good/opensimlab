import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMaternalArrest, type MaternalArrestAction, type MaternalArrestProgress,
} from '../maternal-cardiac-arrest-coordinated-response';

export const MATERNAL_ARREST_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMaternalArrestDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMaternalArrest(scenario);
}

export interface MaternalArrestDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MaternalArrestAction; readonly finished?: boolean;
}

/**
 * The worked example for an arrest where the resuscitation is already someone
 * else's job.
 *
 * What is left is everything a pregnancy adds to a standard resuscitation. This
 * example checks no pulse, performs no compressions or uterine displacement,
 * reads no rhythm, and selects no airway, drug, shock, delivery or procedure.
 */
export function maternalArrestDemonstrationStep(
  patient?: MaternalArrestProgress,
): MaternalArrestDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on in an arrest that is still happening, with the room ready for a delivery nobody has performed. Nothing was proven and nothing was excluded — not the cause, not the circulation, not what happens next for either of them. This ends the example, not the arrest.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-maternal-arrest-prepared-resuscitation-obstetric-anesthesia-delivery-newborn-and-dignity-response-now',
      narration: 'Start the prepared response and the clock before you look at anything. The resuscitation is already running — someone is compressing on a firm surface and calling for help — so what this activation adds is everything a pregnancy adds: obstetric and anesthesia ownership, in-place delivery readiness, newborn care, hemorrhage readiness, communication, dignity, and support for the family and the staff. The clock matters because the delivery decision in a maternal arrest is timed from the arrest rather than from anyone arriving.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-maternal-arrest-clock-responsiveness-breathing-pulse-rhythm-pregnancy-and-whole-person',
      narration: 'Take the arrest facts as given and add the one that changes the response. Thirty seconds ago she became unresponsive at 32 weeks and 4 days. Qualified staff report no normal breathing and no central pulse on a simultaneous ten-second check, with organized narrow-complex activity at 48 on the monitor and no mechanical circulation. None of that needs rechecking. The fact that changes what happens next is the fundal height above the umbilicus, because a uterus that size compresses the vena cava and limits what compressions can return.' };
  }
  if (patient.modificationsAtTick === null) {
    return { id: 'modifications', focus: 'actions', progress: 0.46, action: 'review-obstetrics-maternal-arrest-supplied-pregnancy-modifications-and-airway-priority-boundary',
      narration: 'Review what pregnancy adds without letting it interrupt the resuscitation. Continuous manual displacement of the uterus to the patient’s left, hands in the standard position rather than higher, the same defibrillation energy as anyone else, and an airway managed early because pregnancy makes both hypoxemia and difficult intubation more likely. These are additions to a standard resuscitation rather than a different one, and none of them is a reason to pause compressions.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.64, action: 'review-obstetrics-maternal-arrest-reversible-causes-delivery-newborn-and-hemorrhage-readiness-boundary',
      narration: 'Get the delivery and the newborn ready here, in this room. If resuscitation has not restored circulation, delivery is part of the maternal resuscitation rather than a separate obstetric decision, and it happens where she is — moving an arrested patient to an operating room costs the minutes that make it worth doing. The causes stay open in parallel: hemorrhage, embolism, anesthetic complication, cardiac disease, sepsis, magnesium, hypoxia and everything on the general list. The newborn team and the hemorrhage response both need to be standing there before anyone needs them.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-maternal-arrest-fixed-minute-four-active-resuscitation-and-delivery-readiness-report',
      narration: 'Read the fixed minute-4 report as a checkpoint rather than a verdict. Resuscitation is active, circulation has not returned, and the delivery readiness is in place. No compression, displacement, airway, access, rhythm, drug, shock, delivery or procedure is chosen here, and nothing says how any individual arrest behaves next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-maternal-arrest-active-arrest-cause-procedure-hemorrhage-newborn-family-and-outcome-risk',
    narration: 'Resuscitation is still active, circulation has not returned, and nothing here establishes a completed delivery, a restored circulation, a newborn condition, a cause, a treatment effect or a decision to stop. Hand off the active arrest, the open causes, the procedures, the hemorrhage risk, the newborn, her family, the staff who have been in this room, and the disposition.' };
}
