import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsBetaBlocker, type BetaBlockerAction, type BetaBlockerProgress,
} from '../beta-blocker-cardiogenic-shock';

export const BETA_BLOCKER_DEMONSTRATION_VERSION = '0.1.0';

export function supportsBetaBlockerDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsBetaBlocker(scenario);
}

export interface BetaBlockerDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: BetaBlockerAction; readonly finished?: boolean;
}

/**
 * The worked example for a shock whose most visible number is not the one that
 * matters.
 *
 * A rate of 42 invites a rate answer, and this example spends its first two
 * beats explaining why that is the wrong end of the problem: the poor global
 * contraction and the lactate describe a pump failing rather than a clock
 * running slow, and atropine and a first vasopressor have already been tried
 * and have already failed. It keeps the glucose of 62 inside the poisoning, and
 * it finishes by pointing at the two numbers that are moving because of the
 * treatment rather than because she is better. It selects no product, dose,
 * rate, target, access, airway, pacing, dialysis, lipid, or extracorporeal
 * support.
 */
export function betaBlockerDemonstrationStep(
  patient?: BetaBlockerProgress,
): BetaBlockerDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with a pressure that is holding for now, on a treatment whose own effects are the next thing to watch. Nothing was proven and nothing was excluded. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-beta-blocker-product-clock-pulse-perfusion-mentation-glucose-ecg-and-whole-patient',
      narration: 'Say the pressure, the mentation and the glucose out loud, not just the rate. Two hours after immediate-release metoprolol, drowsy but arousable after vomiting, MAP 51, glucose 62, breathing spontaneously. The rate of 42 is the number everyone says first, and it is one of five findings here — with the quantity and the coingestants still qualified-team work.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-beta-blocker-cardiogenic-shock-pattern-without-pulse-only-closure',
      narration: 'Name this as shock rather than as bradycardia. Globally reduced left ventricular contraction with a lactate of 3.8 is a pump that is not moving blood, not a clock running slow. Closing on the pulse, or on pacing, answers the visible half and leaves the half that is killing her — and the low glucose belongs to this poisoning rather than sitting beside it.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-beta-blocker-poison-center-resuscitation-cardiac-glucose-airway-and-safety-ownership',
      narration: 'Assemble for a shock that is expected to be difficult. Poison center or medical toxicology, emergency and critical care, nursing and pharmacy for the infusions this will take, cardiac and perfusion owners, someone watching the glucose, an airway-capable clinician, and compassionate nonjudgmental safety ownership. Atropine and an initial vasopressor have already been tried without success, which is the reason to build the room rather than try the next single thing.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-beta-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary',
      narration: 'Read the contractility, the glucose and the failed prior care together, and say what the treatment will do to the numbers. PR 220 ms with a narrow QRS, poor global contraction, glucose 62, lactate 3.8, pH 7.31. That atropine and a first vasopressor did not fix it is information rather than a gap, and a high-dose-insulin approach makes glucose and potassium surveillance part of the treatment rather than a check on it. What refractory rescue would mean, and who decides it, belongs here rather than at the arrest.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-beta-blocker-bounded-qualified-vasopressor-glucagon-insulin-euglycemia-and-rescue-intent-with-strict-later-review',
      narration: 'Record the vasopressor, glucagon, insulin-euglycemia and refractory-rescue intents as intents, let the authored interval pass, and read the qualified team’s 45-minute report. The interval is a contrast rather than a required wait, and nothing here says how any individual poisoning answers.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-beta-blocker-recurrent-shock-bradycardia-hypoglycemia-electrolyte-volume-rescue-and-active-risk',
    narration: 'HR 58, MAP 73, clearer mentation, lactate 2.8 — none of which proves the treatment did it or that the perfusion will hold. Glucose 104 and potassium 3.5 are the therapy showing up in the chart rather than the patient improving, and the potassium is the one still moving. Hand off recurrent shock, bradycardia, AV block, hypoglycemia, hypokalemia, volume overload, the rescue question and her safety as live.' };
}
