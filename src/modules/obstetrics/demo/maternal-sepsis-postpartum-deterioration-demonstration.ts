import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMaternalSepsis, type MaternalSepsisAction, type MaternalSepsisProgress,
} from '../maternal-sepsis-postpartum-deterioration';

export const MATERNAL_SEPSIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMaternalSepsisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMaternalSepsis(scenario);
}

export interface MaternalSepsisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MaternalSepsisAction; readonly finished?: boolean;
}

/**
 * The worked example for an emergency that is already fully assembled.
 *
 * Nothing here is waiting to be discovered, and the error this refuses is
 * spending the next interval confirming what is already on the page — a score,
 * a culture, a named source. This example calculates no score, acquires no
 * culture or sample, selects no antimicrobial, fluid or vasopressor, and
 * performs no source control.
 */
export function maternalSepsisDemonstrationStep(
  patient?: MaternalSepsisProgress,
): MaternalSepsisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with better numbers, a source nobody has controlled, and a repeat lactate still pending. Nothing was proven and nothing was excluded — not the source, not the organ recovery, not the causes that were never infection. This ends the example, not the sepsis.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-obstetrics-sepsis-postpartum-clock-infection-organ-dysfunction-and-whole-person',
      narration: 'Put the infection and the failing organs in the same view before anything else. Thirty-eight hours after a cesarean birth that followed a day of ruptured membranes: 39.1°C, a heart rate of 132, a pressure of 88/52, breathing at 28, a tender uterus and malodorous lochia — and, separately, slowed responses, falling urine output, a creatinine that has doubled to 1.4, and a lactate of 4.2. The infection is the easy half. The organ dysfunction is the half that says how little time there is.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-obstetrics-maternal-sepsis-emergency-without-fever-score-source-or-single-value-closure',
      narration: 'Call it a maternal-sepsis emergency now, and do not wait for a score or a source. Suspected infection plus organ dysfunction nothing else explains is the whole definition; a screening score exists to compare populations rather than to permit treatment, and the source is frequently not identified until later or at all. Naming it also closes nothing — pulmonary embolism, concealed hemorrhage, a hypertensive disorder and a medication effect can all present like this and stay open behind the name.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.46, action: 'activate-obstetrics-sepsis-obstetric-critical-care-anesthesia-nursing-pharmacy-microbiology-source-newborn-and-dignity-ownership',
      narration: 'Bring every owner at once, source control and microbiology included. Obstetrics, critical care, anesthesia, nursing, pharmacy, microbiology, source control, organ support, newborn support and dignity-centered ownership all start together rather than in sequence, because source control is the slowest of them to arrange and the one most often started last. She is thirty-eight hours postpartum with a newborn somewhere else — the newborn support and the privacy are part of the response rather than courtesies added to it.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.64, action: 'review-obstetrics-sepsis-supplied-infectious-noninfectious-culture-lactate-perfusion-and-source-boundary',
      narration: 'Read the supplied evidence as a boundary rather than an answer. The temperature, the white count, the tender uterus and the lochia point at an obstetric source; the creatinine and the lactate say organs are involved. None of that identifies the source, and none of it excludes the noninfectious causes. Cultures are drawn without delaying anything, and no single value here is a decision.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'record-obstetrics-sepsis-bounded-qualified-immediate-care-source-control-intent-and-strict-later-review',
      narration: 'Record the bounded qualified immediate-care and source-control intent, let the authored interval pass, and read the qualified team’s 30-minute report. No product, dose, route, volume, target or procedure is chosen here. The interval is a contrast rather than a required wait, and nothing here says how fast any individual sepsis turns around.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-sepsis-shock-source-organ-antimicrobial-vte-newborn-survivor-and-outcome-risk',
    narration: 'A rate of 122, a pressure of 94/58, clearer responses and an unchanged temperature — none of which proves the antimicrobials are working, that the shock is resolving, or that her kidneys will recover. Hand off the repeat lactate and urine output still pending, the unresolved source control, the antimicrobial review, the thromboembolism risk, her pain and privacy, the feeding and newborn support, and the disposition.' };
}
