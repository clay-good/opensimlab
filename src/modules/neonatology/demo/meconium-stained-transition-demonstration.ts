import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMeconiumTransition, type MeconiumTransitionAction, type MeconiumTransitionProgress,
} from '../meconium-stained-transition';

export const MECONIUM_TRANSITION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMeconiumTransitionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMeconiumTransition(scenario);
}

export interface MeconiumTransitionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MeconiumTransitionAction; readonly finished?: boolean;
}

/**
 * The worked example for two negatives that are not the same negative.
 *
 * The answer here is guessable from the title, so the example is not about
 * reaching it. It is about the difference between declining an intervention
 * and excluding a disease, and about a parent who has asked for the suction
 * directly and deserves better than a rule quoted back. It suctions nothing,
 * positions nothing, handles no device and manages no airway, and it finishes
 * on thirty minutes of quiet breathing with meconium aspiration still open.
 */
export function meconiumTransitionDemonstrationStep(
  patient?: MeconiumTransitionProgress,
): MeconiumTransitionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn is handed on having needed nothing done to her airway, with meconium aspiration and other respiratory disease both still open. Declining the suction was correct and settled only the suction. This ends the example, not the watching.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-meconium-stained-transition-prepared-newborn-airway-and-dyad-support',
      narration: 'Confirm airway-ready attendance, which is what the meconium actually changes: a trained newborn-capable clinician, an airway-ready birth team, the shared clock, communication, dignity and parent support. Meconium-stained fluid does not call for a suction. It calls for someone present who could clear an airway if she stopped looking like this.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-meconium-stained-transition-fluid-breathing-tone-heart-rate-airway-and-whole-dyad',
      narration: 'Describe the newborn rather than the fluid. Forty weeks and one day, thin meconium staining, thirty seconds elapsed, spontaneous breathing with a strong cry, good flexed tone, heart rate 138, 36.8°C, mouth and nose visible, no apparent obstruction, dried and covered and skin-to-skin with an awake parent. Every one of those except the staining is about her.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.4, action: 'recognize-vigorous-meconium-stained-transition-without-routine-suction',
      narration: 'Say what is not indicated without saying what is excluded. Routine oral, nasal or tracheal suctioning is not recommended solely because the fluid is meconium stained, and a newborn who breathes well or cries can stay in protected transition care. That declines an intervention. It does not exclude meconium aspiration, and it does not make her well.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.56, action: 'review-qualified-selective-airway-clearing-observation-and-escalation-boundaries',
      narration: 'Review what would change the answer, so that the answer stays a decision. Airway clearing is reserved for apparent obstruction; if ventilation becomes necessary and appears obstructed, selective mouth or nose suction may be considered; tracheal suction belongs only to the uncommon apparent tracheal-obstruction branch when ventilation stays ineffective despite corrective steps. Knowing the trigger is what makes declining now something other than a habit.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-meconium-stained-transition-fixed-thirty-minute-qualified-report',
      narration: 'Let the authored thirty minutes pass and read the qualified team’s report. The interval is a contrast rather than a required wait or a safe observation period, and nothing here says how long a newborn who passed meconium has to breathe well before anyone stops watching.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-meconium-stained-transition-respiratory-thermal-feeding-parent-and-outcome-risk',
    narration: 'Regular breathing without apnea, grunting, retractions or cyanosis, heart rate 132, preductal saturation 96%, 36.7°C, airway visible, skin-to-skin continuing. Hand off the two negatives separately: no suction was indicated, and neither meconium aspiration nor other respiratory disease has been excluded.' };
}
