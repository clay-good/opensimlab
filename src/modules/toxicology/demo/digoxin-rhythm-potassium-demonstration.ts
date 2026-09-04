import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsDigoxin, type DigoxinAction, type DigoxinProgress,
} from '../digoxin-rhythm-potassium';

export const DIGOXIN_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDigoxinDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDigoxin(scenario);
}

export interface DigoxinDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: DigoxinAction; readonly finished?: boolean;
}

/**
 * The worked example for four numbers that only mean something together.
 *
 * A level of 8.6, a potassium of 6.1, a complete block and an escape rhythm at
 * 36 each look like the headline, and this example refuses all four closures in
 * one beat. It treats the potassium as a marker of how poisoned she is rather
 * than as an electrolyte problem, reads the level with the sampling clock that
 * makes it interpretable, and finishes on the number that is deliberately
 * absent: after immune Fab a standard total digoxin assay measures bound drug
 * and would mislead, so the 60-minute report has no level in it and the absence
 * is what gets handed over. It selects no vial count, dose, rate, electrolyte,
 * pacing, dialysis, cardioversion, or antiarrhythmic.
 */
export function digoxinDemonstrationStep(
  patient?: DigoxinProgress,
): DigoxinDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with a rhythm that has come back, a potassium heading the other way, and a laboratory number nobody should trust for a while. Nothing was proven and nothing was excluded. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-digoxin-product-clock-gi-visual-perfusion-rhythm-potassium-and-whole-patient',
      narration: 'Say the vomiting and the yellow vision alongside the rhythm. Seven hours after an immediate-release digoxin ingestion, with repeated vomiting, yellow-tinted blurred vision, drowsiness, an escape rhythm at 36 and a MAP of 53. The gastrointestinal and visual findings are part of the poisoning rather than background noise, and the quantity and coingestants stay qualified-team work.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-digoxin-life-threatening-pattern-without-level-rhythm-or-potassium-only-closure',
      narration: 'Name this as life-threatening and refuse all four ways of closing it early. The level of 8.6, the potassium of 6.1, the complete block and the escape rate each look like the headline, and none of them is the whole finding. Pacing the block would capture a rhythm in a poisoned myocardium and leave the poisoning. The potassium misleads hardest: here it is a marker of how poisoned she is rather than an electrolyte problem standing on its own.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-digoxin-poison-center-resuscitation-cardiac-electrolyte-airway-and-safety-ownership',
      narration: 'Get the owners in place for an arrhythmia that has not happened yet. Poison center or medical toxicology, emergency and critical care, nursing and pharmacy, cardiac and perfusion owners, someone watching the potassium, an airway-capable clinician, and compassionate nonjudgmental safety ownership. There is frequent ectopy without sustained ventricular tachycardia, and atropine and an initial vasopressor have already failed.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-digoxin-supplied-ecg-level-timing-potassium-renal-coingestion-and-antidote-boundary',
      narration: 'Read the level with the clock that makes it interpretable, and the potassium as a trajectory rather than a value. The 8.6 ng/mL was drawn seven hours after the last dose and before any antidote, which is what lets it mean anything, and renal function, magnesium, acid-base and coingestion sit with it. The potassium of 6.1 is about to become the opposite problem, because immune Fab pulls it down quickly — so what refractory-arrhythmia rescue would mean, and who decides it, belongs here rather than at the arrest.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-digoxin-bounded-qualified-immune-fab-surveillance-and-rescue-intent-with-strict-later-review',
      narration: 'Record the immune-Fab, rhythm-potassium surveillance and refractory-rescue intents as intents, let the authored interval pass, and read the qualified team’s 60-minute report. The interval is a contrast rather than a required wait, and nothing here says how any individual poisoning answers.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-digoxin-recurrent-arrhythmia-potassium-shift-level-interference-renal-rescue-and-active-risk',
    narration: 'Sinus at 62, MAP 75, potassium down to 4.7, lactate 2.1, no sustained ventricular arrhythmia — none of which proves the treatment did it or that the rhythm will hold. There is deliberately no repeat digoxin concentration, because a standard total assay after Fab measures bound drug and would be clinically misleading, and the next team needs that told to them rather than left to discover. Hand off recurrent arrhythmia, a potassium still falling, renal impairment, the rescue question and her safety as live.' };
}
