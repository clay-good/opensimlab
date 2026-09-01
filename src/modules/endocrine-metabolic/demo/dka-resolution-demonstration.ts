import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsDkaResolution, type DkaResolutionAction, type DkaResolutionProgress,
} from '../dka-resolution';

export const DKA_RESOLUTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDkaResolutionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDkaResolution(scenario);
}

export interface DkaResolutionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: DkaResolutionAction; readonly finished?: boolean;
}

/**
 * The worked example for a resolution that glucose does not decide.
 *
 * A demonstration is expected to arrive somewhere, and the risk in this lesson
 * is that arriving reads as being finished. So the example ends where the
 * criteria are met and the case is still open: one basal dose has overlapped
 * one infusion, and nothing about access, stability, the precipitant, or
 * discharge has been settled by it. The narration reaches the resolution
 * criteria only after the learner-visible recognition step has recorded them,
 * never before.
 */
export function dkaResolutionDemonstrationStep(
  patient?: DkaResolutionProgress,
): DkaResolutionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The case is handed on with recurrence, hypoglycemia, hypokalemia, the precipitant, insulin access and technique, nutrition, education and follow-up still active. The biochemical criteria are met and the case is not closed. This ends the example, not the admission.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-dka-resolution-endocrine-nursing-pharmacy-electrolyte-nutrition-and-transition-support',
      narration: 'Confirm who owns insulin, electrolytes, nutrition, education, and the transition. A bridged transition fails at the seams, so the owners are named before anything is decided about them.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.22, action: 'reconcile-dka-resolution-initial-triad-treatment-clock-current-ketone-acid-base-potassium-glucose-and-whole-person',
      narration: 'Connect the first panel to the current one across eight hours of qualified treatment. Glucose 468, ketones 5.8, pH 7.14 then; glucose 184, ketones 1.2, pH 7.32 now. Read together these are a trajectory; read alone the second set is only a value.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.38, action: 'recognize-persistent-dka-despite-lower-glucose-and-closed-anion-gap',
      narration: 'Read the ketone and the bicarbonate against the criteria rather than the glucose. Resolution asks for a plasma ketone below 0.6 mmol/L plus a pH of at least 7.3 or bicarbonate of at least 18. Ketones are 1.2 and bicarbonate is 17, and the chloride of 112 keeps a hyperchloremic explanation open as well.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.54, action: 'review-qualified-dka-insulin-dextrose-potassium-monitoring-resolution-and-bridged-transition-boundaries',
      narration: 'Review what qualified continuity requires while ketoacidosis persists: insulin continued with dextrose rather than stopped because glucose fell, serial potassium, kidney and acid-base checks, the precipitant treated, and a basal dose overlapping the infusion before it stops. This example selects no drug, dose, rate, or fluid.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.74, action: 'review-dka-resolution-fixed-four-hour-qualified-report',
      narration: 'Let the authored interval pass and read the qualified team’s report. The four hours are a contrast rather than a required wait or a safe interval between checks, and nothing here predicts how fast a real patient’s ketones fall.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-dka-recurrence-insulin-potassium-nutrition-precipitant-education-follow-up-and-outcome-risk',
    narration: 'Ketones 0.4, pH 7.34, bicarbonate 19: the criteria are met, and a basal dose two hours ago has overlapped the infusion. That is one overlap in progress, not proven insulin access, durable glucose or potassium stability, a resolved precipitant, or discharge readiness. Hand off the risk rather than the reassurance.' };
}
