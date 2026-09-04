import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHhsOsmolality, type HhsOsmolalityAction, type HhsOsmolalityProgress,
} from '../hhs-osmolality';

export const HHS_OSMOLALITY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHhsOsmolalityDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHhsOsmolality(scenario);
}

export interface HhsOsmolalityDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HhsOsmolalityAction; readonly finished?: boolean;
}

/**
 * The worked example for an illness whose reassuring numbers are the trap.
 *
 * The lesson can be failed twice with the same error: once at the start, where
 * low ketones and a near-normal pH read as mild, and once at the report, where
 * three numbers moving the right way read as recovery. So the example takes the
 * second reading as carefully as the first, and ends on what is still moving
 * rather than on what has improved.
 */
export function hhsOsmolalityDemonstrationStep(
  patient?: HhsOsmolalityProgress,
): HhsOsmolalityDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The case is handed on with hyperosmolality, reduced urine output, cognition below baseline, fluid tolerance, glucose and potassium safety, and the precipitant all still active. Three numbers moved the right way and none of them closed the case. This ends the example, not the illness.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-hhs-endocrine-resuscitation-nursing-renal-cardiac-and-monitoring-support',
      narration: 'Confirm who owns fluid, insulin timing, electrolytes, the kidneys and the heart. Cautious correction in someone with heart failure and chronic kidney disease is several people’s judgement at once, so the owners are named before anything else.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.22, action: 'reconcile-hhs-glucose-sodium-osmolality-ketone-perfusion-cognition-and-whole-person',
      narration: 'Connect four days of thirst, polyuria, poor intake and increasing confusion to the numbers in front of you, along with the family’s account of her usual independent cognition and her difficulty reaching drinks and medicines. Apart these are a history and a panel; together they are a trajectory.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.38, action: 'recognize-hhs-hyperosmolality-without-glucose-sodium-or-ketone-only-closure',
      narration: 'Read the osmolality, the dehydration and the cognition as one finding. Ketones of 1.1 and a pH of 7.36 answer whether this is ketoacidosis, not whether it is serious — total osmolality is 362 with drowsiness and a creatinine of 2.0 from a baseline of 1.1.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.54, action: 'review-qualified-hhs-cautious-correction-osmolality-potassium-monitoring-and-harm-prevention',
      narration: 'Review what cautious correction has to be followed by: the osmolality trajectory and the clinical response together, potassium, urine output and fluid balance, cardiac and kidney tolerance, the precipitant, thrombosis and pressure-injury prevention, and escalation for new neurologic change. A sodium rising as glucose falls does not by itself call for hypotonic fluid. This example selects no fluid, insulin, dose, or rate.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.74, action: 'review-hhs-fixed-four-hour-qualified-report',
      narration: 'Let the authored interval pass and read the qualified team’s report. The average falls it quotes — 90 mg/dL an hour of glucose, 4.75 mOsm/kg an hour of osmolality — describe what happened here. They are not a target and not a safe interval between measurements.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-hhs-osmolality-cognition-fluid-electrolyte-precipitant-and-outcome-risk',
    narration: 'Glucose 540, pressure 110/64, osmolality 343: three things going the right way. She is still hyperosmolar, still passing 0.4 mL/kg/h, and still below her own cognition, and the precipitant is still under assessment. Hand off what is still moving rather than what has improved.' };
}
