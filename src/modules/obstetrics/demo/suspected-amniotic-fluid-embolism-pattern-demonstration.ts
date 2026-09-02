import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAfe, type AfeAction, type AfeProgress,
} from '../suspected-amniotic-fluid-embolism-pattern';

export const AFE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAfeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAfe(scenario);
}

export interface AfeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AfeAction; readonly finished?: boolean;
}

/**
 * The worked example for the one lesson that responds before it understands.
 *
 * There is no confirmatory test for amniotic fluid embolism, so the interval
 * spent working it out is the interval she does not have. This example assesses
 * no pulse, measures no loss, acquires and reads no laboratory value, and
 * selects no oxygen, vasoactive, component, CPR or delivery.
 */
export function afeDemonstrationStep(
  patient?: AfeProgress,
): AfeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on still in shock, still compromised, and still bleeding into a coagulopathy that is getting worse. Nothing was proven and nothing was excluded — not the diagnosis, which has no confirmatory test, not the alternatives, not the arrest that has not happened. This ends the example, not the event.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-afe-coordinated-obstetric-anesthesia-critical-care-cardiopulmonary-hemorrhage-newborn-and-dignity-response',
      narration: 'Call everyone first, before you have worked out what this is. This lesson puts the activation ahead of the understanding, and that is the teaching rather than an accident of ordering. There is no confirmatory test for amniotic fluid embolism; it is recognized clinically and settled only afterwards, so the minutes spent deciding are minutes she does not have. Obstetrics, anesthesia, critical care, oxygenation and ventilation, hemodynamic and cardiopulmonary support, nursing, pharmacy, coagulation and hemorrhage, blood bank, operating room, arrest readiness, newborn care, communication and dignity-centered ownership all start now.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-afe-birth-clock-symptom-order-cardiorespiratory-state-bleeding-coagulation-newborn-and-whole-person',
      narration: 'Now put the events in the order they actually happened. Twelve minutes after a term birth and placental delivery: eight minutes ago she abruptly could not breathe, went cyanotic, confused and profoundly hypotensive — and the major visible bleeding started after that. She has a central pulse, a rate of 132, a pressure of 74/42, a saturation of 78%, one-word answers and cool mottled skin, with a firm midline uterus and 180 mL measured. The sequence is the finding.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.46, action: 'recognize-obstetrics-afe-rapid-maternal-collapse-and-coagulopathy-pattern-without-diagnostic-closure',
      narration: 'Name the collapse-then-coagulopathy pattern without closing the diagnosis. Cardiorespiratory collapse followed by diffuse bleeding is the pattern that makes amniotic fluid embolism the leading suspicion here, and in a hemorrhage the order runs the other way — the bleeding comes first and the circulation follows it. A firm uterus and 180 mL do not explain a pressure of 74/42. But suspicion is not closure: high spinal or anesthetic complication, anaphylaxis, pulmonary or air embolism, a cardiac event, sepsis, and a bleeding cause nobody has found yet all stay open.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.64, action: 'review-obstetrics-afe-supplied-cardiac-pulmonary-hemorrhage-coagulation-uterine-anesthetic-thrombotic-infectious-allergic-and-competing-cause-boundary',
      narration: 'Read the coagulation as the second act of one event. A fibrinogen of 105 mg/dL down from 430 and platelets of 68 down from 221, at a measured loss of 240 mL, is not dilution and is not consumption from bleeding — that much fibrinogen has gone somewhere else. Coupled to the hypoxemia, the shock and the timing, it belongs to the same event rather than to a separate problem. None of it identifies the cause, excludes the alternatives, or establishes eligibility for anything.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-afe-fixed-later-breathing-circulation-bleeding-coagulation-and-support-report',
      narration: 'Read the fixed 12-minute report as a checkpoint rather than a direction. It supplies persistent shock, continuing respiratory compromise and a coagulopathy that is still progressing. No treatment, product, dose, route, target, procedure or delivery is chosen here, and nothing says how any individual event of this kind behaves next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-afe-hypoxemia-shock-coagulopathy-bleeding-arrest-procedure-newborn-family-support-and-outcome-risk',
    narration: 'Persistent shock, continuing respiratory compromise and a coagulopathy that is still progressing — nothing here establishes treatment effect, respiratory or hemodynamic recovery, bleeding or coagulation control. Hand off the hypoxemia, the shock, the coagulopathy, the bleeding, the arrest risk, the procedures that may follow, the newborn, her family, the staff who were in the room, and the disposition.' };
}
