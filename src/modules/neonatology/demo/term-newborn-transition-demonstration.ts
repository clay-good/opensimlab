import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsTermTransition, type TermTransitionAction, type TermTransitionProgress,
} from '../term-newborn-transition';

export const TERM_TRANSITION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTermTransitionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTermTransition(scenario);
}

export interface TermTransitionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TermTransitionAction; readonly finished?: boolean;
}

/**
 * The worked example for the newborn who needs nothing done to her.
 *
 * A demonstration wants to show a rescue, and this one has none to show. What
 * it demonstrates instead is that recognizing a normal transition is work: the
 * team confirmed before it looks needed, the birth and thermal and parent facts
 * assembled rather than sensed, the protective care named including the parts
 * that are omissions, and an hour of quiet handed on as a checkpoint rather
 * than a result. It performs no cord care, no drying, no positioning and no
 * feeding, because those belong to the qualified team, and it never turns
 * "she does not need resuscitation" into "she is finished."
 */
export function termTransitionDemonstrationStep(
  patient?: TermTransitionProgress,
): TermTransitionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn is handed on after an hour in which nothing had to be done to her, and nothing about her was closed. Breathing, warmth, glucose, feeding and the parents all stay under watch. This ends the example, not the first day.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-term-newborn-transition-prepared-newborn-and-dyad-support',
      narration: 'Confirm the prepared team before concluding that nothing is needed. A trained newborn-capable clinician, the birth-team roles, the shared clock, the family communication and the support ownership cost least to establish while everything still looks easy — and they are the same ones needed if she stops breathing at four minutes.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-term-newborn-transition-gestation-birth-breathing-tone-heart-rate-temperature-and-whole-dyad',
      narration: 'Assemble the normal rather than sensing it. Thirty-nine weeks and four days, an uncomplicated labour, the birth clock at twenty seconds, a strong cry, flexed tone, heart rate 142, 36.8°C, skin-to-skin with the airway visible, and a parent who has asked a question that deserves an answer.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.4, action: 'recognize-term-newborn-transition-without-resuscitation-or-well-newborn-closure',
      narration: 'Breathing with good tone and an adequate heart rate supports ongoing transition care and no need for resuscitation. That is not a discharge. Apnea, respiratory difficulty, thermal instability, glucose, infection and jaundice all stay open, and a low saturation in these first minutes is expected rather than read alone.' };
  }
  if (patient.careAtTick === null) {
    return { id: 'care', focus: 'actions', progress: 0.56, action: 'review-term-newborn-transition-qualified-cord-skin-to-skin-thermal-and-observation-care',
      narration: 'Name the protective care the qualified team is giving, including the parts that are omissions: deferred cord clamping for at least sixty seconds in most instances of this stable pattern, drying, protected skin-to-skin with the mouth and nose visible, warm coverings, continued breathing and temperature evaluation, feeding support. Routine suction, separation, stimulation and supplemental oxygen are left off, and leaving them off is the decision.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-term-newborn-transition-fixed-one-hour-qualified-report',
      narration: 'Let the authored hour pass and read the qualified team’s report. The interval is a contrast rather than a required wait, and nothing here says how long an undisturbed first hour has to run before anyone can relax.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-term-newborn-transition-breathing-temperature-feeding-parent-and-outcome-risk',
    narration: 'Uninterrupted skin-to-skin, regular breathing without apnea or increased work, heart rate 136, 36.7°C, airway visible, feeding cues beginning. That is a checkpoint, not a result, so hand off durable safety, glucose, feeding success and discharge readiness as the open questions they still are.' };
}
