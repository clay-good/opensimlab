import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAtony, type AtonyAction, type AtonyProgress,
} from '../postpartum-hemorrhage-uterine-atony';

export const ATONY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAtonyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAtony(scenario);
}

export interface AtonyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AtonyAction; readonly finished?: boolean;
}

/**
 * The worked example for a number that has not arrived yet.
 *
 * Six hundred and fifty millilitres is not a thousand, and waiting for a
 * thousand is the error this lesson refuses: the definition exists so cases can
 * be counted, and what should start the response is a heart rate of 118 and a
 * pressure of 94/58 eight minutes after birth. The second refusal is the single
 * cause — a boggy uterus makes atony most likely and not the only thing. This
 * example measures no loss, examines no uterus, placenta or tract, and selects
 * no uterotonic, fluid, component, tamponade or operation.
 */
export function atonyDemonstrationStep(
  patient?: AtonyProgress,
): AtonyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on steadier with the bleeding slower and nothing settled. Nothing was proven and nothing was excluded — not the cause, not the coagulation, not what is collecting where nobody can see it. This ends the example, not the hemorrhage.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-obstetrics-atony-hemorrhage-birth-clock-measured-loss-physiology-tone-and-whole-person',
      narration: 'Read the physiology rather than the volume, and notice that she is still talking. Eight minutes after an uncomplicated term birth: 650 mL measured and rising, bleeding that has not stopped, a boggy enlarged uterus, a heart rate of 118, a pressure of 94/58, breathing at 24, pale and dizzy — and conversing normally. A healthy woman of thirty-one compensates well and then stops compensating quickly, so the conversation is not the reassurance it feels like.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-obstetrics-atony-postpartum-hemorrhage-and-atony-pattern-without-threshold-tone-or-single-cause-closure',
      narration: 'Call it a hemorrhage now, and refuse both the threshold and the single cause. A thousand millilitres is a definition for counting cases, not a trigger for starting; what starts this is a rising measured loss with a tachycardia and a falling pressure. And the boggy uterus makes atony most likely without making it the only thing — trauma, retained tissue, coagulopathy, rupture, inversion and concealed bleeding all stay open, and a placenta reported grossly complete has been looked at rather than proven whole.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.46, action: 'activate-obstetrics-atony-hemorrhage-obstetric-anesthesia-nursing-blood-bank-operating-room-and-dignity-ownership',
      narration: 'Bring the whole room at once, including the blood bank and the theatre. Obstetric hemorrhage, anesthesia, nursing, monitoring, blood bank, operating room, newborn support and dignity-centered ownership all start together rather than in sequence, because the two slowest things to arrange are components and an operating room and both are needed before anyone knows whether they will be used. She has just had a baby and is frightened — the dignity and the newborn support are part of the response rather than courtesies added to it.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.64, action: 'review-obstetrics-atony-supplied-tone-placenta-tract-coagulation-perfusion-and-competing-cause-boundary',
      narration: 'Keep every cause coupled, and treat the reassuring findings as reports. The supplied tone points at atony, the placenta was grossly complete, and the genital tract and coagulation are uncertain rather than clear. Hypoperfusion is already visible in the pulse and the pressure. None of it excludes concealed bleeding, none of it settles the coagulation, and no laboratory value here is a decision — the review is what keeps the other causes alive while the bundle runs.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'record-obstetrics-atony-bounded-qualified-motive-bundle-escalation-intent-and-strict-later-review',
      narration: 'Record the bounded qualified bundle and escalation intent, let the authored interval pass, and read the qualified team’s 10-minute report. No product, dose, route, massage technique, fluid, component, tamponade or operation is chosen here. The interval is a contrast rather than a required wait, and nothing here says how fast any individual bleeding slows.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-atony-recurrent-bleeding-shock-coagulopathy-blood-procedure-newborn-and-outcome-risk',
    narration: 'A rate of 104, a pressure of 102/64, a firmer uterus and visibly slower bleeding — none of which proves the bundle did it, that the loss has stopped, that her coagulation is holding, or that nothing is collecting where it cannot be seen. Hand off the cumulative loss, the hemoglobin trajectory, the coagulation, the transfusion and procedure questions, her pain and privacy, the feeding and newborn support, and the disposition.' };
}
