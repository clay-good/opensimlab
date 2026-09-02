import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricSepsis, type PediatricSepsisAction, type PediatricSepsisProgress,
} from '../pediatric-sepsis';

export const PEDIATRIC_SEPSIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricSepsisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricSepsis(scenario);
}

export interface PediatricSepsisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricSepsisAction; readonly finished?: boolean;
}

/**
 * The worked example for a child who does not look like the emergency he is.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example examines nobody, calculates no score, acquires and
 * interprets no culture, specimen, lactate, laboratory test or image,
 * identifies no source or pathogen, chooses no antimicrobial, drug, dose,
 * concentration, route, interval, access, fluid, bolus, volume, rate,
 * vasoactive, oxygen, device or flow, performs no source-control procedure,
 * and determines no disposition or outcome.
 */
export function pediatricSepsisDemonstrationStep(
  patient?: PediatricSepsisProgress,
): PediatricSepsisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is cooler, slower and passing urine, and his clotting is exactly where it was two hours ago. The people taking over know both of those things, know what is still pending, and know who owns each part of it. This ends the example, not the evaluation.' };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-sepsis-infection-and-organ-dysfunction',
      narration: 'He does not look like the emergency his blood results say he is. Start there. A previously well six-year-old, 20 kg, thirty hours of fever with dysuria and right-flank discomfort, reduced intake and vomiting. He arrived tired but awake and fully interactive, warm, with normal-volume pulses, a refill of two seconds and a blood pressure of 106/64. A qualified examination supports a probable urinary source, and neither the source nor the pathogen is confirmed. What makes this sepsis rather than a febrile illness is not the fever and not the heart rate — it is the organ dysfunction underneath: platelets of 82,000 and an INR of 1.5, with a lactate of 2.6. Fever and tachycardia are the context you read that finding in, not a shortcut to it.' };
  }
  if (patient.shockBoundaryAtTick === null) {
    return { id: 'shockBoundary', focus: 'monitor', progress: 0.28, action: 'distinguish-pediatric-sepsis-without-shock',
      narration: 'Say what this is and what it is not, in both directions. The supplied expert report assigns two coagulation points and zero cardiovascular, respiratory and neurological points: authored sepsis, and no current shock. You do not calculate that score and Phoenix is not an early screening tool — it is a classification handed to you. Both halves of the sentence carry weight. No shock now means no routine fluid bolus is authored for him, because a bolus given to a child who is not shocked buys nothing and costs something. And preserved pressure, refill, pulse quality, mentation, breathing and room-air oxygenation do not establish low risk — they describe this minute. The reason the next check stays close is precisely that this boundary can move.' };
  }
  if (patient.careAtTick === null) {
    return { id: 'care', focus: 'actions', progress: 0.46, action: 'confirm-pediatric-sepsis-qualified-care-ownership',
      narration: 'Name who owns the care that is already running. The record you were handed is a good one: blood culture and source-directed specimens obtained without materially delaying anything, a lactate measured, and local empiric broad-spectrum antimicrobial therapy delivered by the experienced team at minute twenty-five. None of that was yours to choose, and the agent, the dose, the concentration, the route, the interval, the access, the fluids and the oxygen all stay theirs. What you are recording is that pediatric, nursing, pharmacy, laboratory and escalation ownership continues — for the evaluation, the antimicrobial care, the unresolved source work and the frequent reassessment. Care that nobody owns is care that quietly stops.' };
  }
  if (patient.sourceReviewAtTick === null) {
    return { id: 'source', focus: 'actions', progress: 0.64, action: 'review-pediatric-sepsis-source-organs-and-alternatives',
      narration: 'Keep the source work and the organ work running side by side. The urinary source is probable, not proven, and the cultures are pending. Waiting for every result before thinking again is how a wrong source survives the afternoon, and claiming the source is how the alternative gets missed. Hold both: coagulation and bleeding, mentation, breathing, circulation, urine, lactate, whether the empiric choice still fits, and whether the access is adequate — alongside the alternatives that thirty hours of fever could still turn out to be. None of this delays the care that is already delivered. It is what tells you when the boundary you just drew has stopped being true.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-sepsis-later-response',
      narration: 'Let time pass, then read the fixed report against what has not moved. At minute 120 he is alert and interactive, cooler at 38.3°C, slower at 126 and 24, still warm and well-perfused with a refill of two seconds, passing 1.2 mL/kg/h of urine, and his lactate has come down to 1.9. That is a real improvement and it is worth saying so. Now read the other column: platelets 80,000 and an INR of 1.5, essentially unchanged. The physiology got better and the organ dysfunction did not. Improvement of that shape does not prove the antimicrobial is right, does not prove the source is controlled, does not establish durable recovery, and does not determine where he goes next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-sepsis-active-risk',
    narration: 'Hand off a boy who is better and still actively at risk. What travels is the suspected infection and the unconfirmed urinary source, the persistent coagulation dysfunction and the bleeding surveillance that goes with it, the current no-shock findings together with the shock surveillance that has not stopped, the pending cultures and source-directed work, the qualified treatment review, the organ trends, the alternatives still open, the caregiver context, and the named pediatric, nursing, pharmacy, laboratory and escalation owners. Nothing here identifies a source or a pathogen, diagnoses, scores, treats, determines disposition or prognosis, or predicts an outcome.' };
}
