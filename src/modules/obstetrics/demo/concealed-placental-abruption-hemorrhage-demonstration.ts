import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsConcealedAbruption, type ConcealedAbruptionAction, type ConcealedAbruptionProgress,
} from '../concealed-placental-abruption-hemorrhage';

export const CONCEALED_ABRUPTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsConcealedAbruptionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsConcealedAbruption(scenario);
}

export interface ConcealedAbruptionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ConcealedAbruptionAction; readonly finished?: boolean;
}

/**
 * The worked example for blood that is not on the floor.
 *
 * Eighty millilitres has been collected and she is shocked, her fibrinogen has
 * fallen to 1.5 g/L, and the fetal trace is abnormal. This example refuses the
 * visible volume as a measure of the loss and refuses the scan as a way to be
 * sure. It measures and totals nothing, interprets no fetal trace, acquires no
 * ultrasound, and selects no fluid, component, anesthetic or delivery.
 */
export function concealedAbruptionDemonstrationStep(
  patient?: ConcealedAbruptionProgress,
): ConcealedAbruptionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with slightly better numbers, a fetus that has not recovered, and a loss nobody has quantified. Nothing was proven and nothing was excluded — not the volume, not the coagulation, not the causes that were never an abruption. This ends the example, not the hemorrhage.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-obstetrics-abruption-pain-visible-blood-maternal-physiology-fetal-context-and-whole-person',
      narration: 'Believe the physiology over the eighty millilitres in the bowl. Thirty-five minutes of abrupt constant pain at 36 weeks and 4 days, a tense tender uterus, pallor and restlessness, a heart rate of 126 and a pressure of 92/56 — and a fetal baseline of 170 with minimal variability and recurrent late decelerations. Two people are showing you the same bleed. The blood that has been collected is the only part of it anyone can see.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-obstetrics-abruption-concealed-hemorrhage-pattern-without-visible-volume-ultrasound-or-single-cause-closure',
      narration: 'Call it a concealed hemorrhage now, and do not send for a scan to be sure. In an abruption most of the loss can stay behind the placenta, so visible volume is not total loss and a small amount of dark blood is consistent with a very large one. Ultrasound detects an abruption often enough to be useful and misses it often enough that a normal scan excludes nothing. Naming it also closes nothing — rupture, previa, vasa previa, labor, trauma and non-obstetric causes stay open behind the name, and the supplied prior placental-location record is one piece of history rather than an exclusion.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.46, action: 'activate-obstetrics-abruption-hemorrhage-anesthesia-blood-bank-operating-room-neonatal-and-dignity-ownership',
      narration: 'Bring the room for two patients at once, blood bank and neonatal included. Obstetric hemorrhage, anesthesia, nursing, blood bank, operating room, neonatal, pain, privacy, consent, communication and dignity-centered ownership all start together rather than in sequence, because components, an operating room and a neonatal team are the slowest to arrange and are needed before anyone knows whether they will be used. She is awake, frightened, and being told her baby may be born in the next few minutes — the consent and the support are part of the response rather than courtesies added to it.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.64, action: 'review-obstetrics-abruption-supplied-perfusion-uterine-fetal-coagulation-placental-and-competing-cause-boundary',
      narration: 'Read the coagulation as part of the bleed rather than a laboratory result. A fibrinogen of 1.5 g/L is not merely low; late in pregnancy it is usually well above 4, so this is a value that has already fallen a long way, alongside platelets of 112 and an INR of 1.4. That pattern belongs to the hemorrhage rather than sitting beside it. None of the supplied evidence identifies how much blood has been lost, and none of it excludes the competing causes.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'record-obstetrics-abruption-bounded-qualified-resuscitation-coagulation-and-urgent-delivery-intent-with-strict-later-review',
      narration: 'Record the bounded qualified simultaneous resuscitation, coagulation and urgent-delivery intent, let the authored interval pass, and read the qualified team’s 10-minute report. No product, dose, route, volume, target, technique, anesthetic or mode of birth is chosen here. The interval is a contrast rather than a required wait, and nothing here says how fast any individual abruption declares itself.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-abruption-concealed-loss-shock-coagulopathy-fetal-delivery-neonatal-bereavement-and-outcome-risk',
    narration: 'A rate of 118, a pressure of 98/60, and 120 mL now visible — none of which quantifies the concealed loss, proves her coagulation is holding, or says the fetal compromise is improving, because it has not. Hand off the total loss, the shock, the coagulopathy, the delivery and anesthesia decisions, the neonatal team, the pathology, the recurrence risk, the bereavement support that may be needed, and the disposition.' };
}
