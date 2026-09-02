import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricDehydration, type PediatricDehydrationAction,
  type PediatricDehydrationProgress,
} from '../pediatric-dehydration-with-hypovolemia';

export const PEDIATRIC_DEHYDRATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricDehydrationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricDehydration(scenario);
}

export interface PediatricDehydrationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricDehydrationAction; readonly finished?: boolean;
}

/**
 * The worked example for a child two weights are not enough to describe.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes rehydration first and safety
 * second, which is one valid order rather than the required one. The example
 * examines nobody, weighs nobody, calculates no percentage, deficit or
 * maintenance, diagnoses nothing, acquires and interprets no glucose,
 * electrolyte, renal, acid-base, urine, stool, culture or imaging test,
 * chooses no solution, route, bolus, volume, rate, electrolyte, access,
 * device, drug or feeding plan, and determines no disposition or outcome.
 */
export function pediatricDehydrationDemonstrationStep(
  patient?: PediatricDehydrationProgress,
): PediatricDehydrationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She has taken fluid by mouth and kept it down, she has made urine, and she is still having watery stools. Nobody put a cannula in her, nobody calculated a deficit, and everyone knows what would change the plan. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-dehydration-losses-and-perfusion',
      narration: 'You have two weights a week apart. Resist turning them into a percentage. A previously well two-year-old, 12 kg today against a reliable same-scale 12.6 kg a week ago, after three days of non-bloody watery diarrhea, repeated vomiting, minimal intake and one urine in twelve hours. That weight change is a good clue and it is one clue: it is not a stand-alone dehydration percentage and it is not an intravascular deficit, because a week-old weight also contains a week of not eating. Read it alongside what is in front of you — dry mucosa, no tears, mildly sunken eyes, reduced turgor, and a child who is irritable but consolable and still interacting with you.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-dehydration-with-hypovolemia',
      narration: 'Name the compensation, and say plainly that this is not shock. The supplied experienced-team assessment is clinical dehydration with compensated volume depletion. What makes it compensated is on the other side of the chart: she is interactive, her extremities are warm, her pulses are normal volume, her refill is two seconds and her pressure is preserved at 90/56. No single sign, no score and no calculated percentage established that classification, and you did not diagnose it. The absences — no fever, no blood or mucus in the stool, no bilious emesis, no severe focal abdominal finding, no distension, no diabetes history — are fixed snapshots rather than permanent exclusions, which is exactly why the safety review does not stop here.' };
  }
  if (patient.rehydrationAtTick === null) {
    return { id: 'rehydration', focus: 'actions', progress: 0.46, action: 'activate-pediatric-dehydration-qualified-rehydration-ownership',
      narration: 'Two things run together: the fluid going in, and the watch for being wrong. Start with rehydration ownership. Experienced pediatric and nursing teams take locally protocolized oral rehydration in small frequent amounts, the breastfeeding and phase-appropriate feeding context, intake and output, tolerance, serial whole-child reassessment, and escalation of route if she deteriorates or cannot keep it down. In a child who is alert, warm and perfusing, the mouth is the route this evidence supports; you select no solution, route, volume, rate, access, device, drug or feeding plan, and glucose, electrolytes and renal function stay qualified work for when they are indicated.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-dehydration-ongoing-losses-and-safety',
      narration: 'Rehydration is owned. Now keep watching for the reason it will not work. Oral rehydration is the plan, not a guarantee, and this is where the failure modes get named while there is still time: ongoing stool and emesis against what she is taking, oral tolerance, urine, hydration signs, consciousness, circulation, the weight trend, whether glucose or electrolytes have become a concern, how reliably the caregiver can keep this going, and the red flags for shock or a serious alternative cause. The fixed negative findings you were given are snapshots. Reviewing them again is what turns them from a conclusion back into a question.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-dehydration-later-response',
      narration: 'Let time pass, then reassess before you reassure. At minute sixty she is alert, engaging and tolerating small frequent amounts, with a temperature of 37.4°C, a heart rate of 116, a MAP of 69, tears present, a moistening mouth, less-sunken eyes, warm normal-volume pulses and a refill of two seconds. One urine, one further watery stool, no further vomiting. That is genuinely better. Now notice what you were not given: no repeat weight, no complete intake total, no laboratory panel, no full deficit correction and no route endpoint. Partial improvement is the honest description, and the losses are still running.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-dehydration-active-risk',
    narration: 'Hand off a child who is improving and still losing fluid. What travels is the loss and intake trajectory with the weight as context rather than a calculation, the hydration signs, the findings that argue against current shock, oral tolerance, urine and stool output, the glucose and electrolyte review that stays conditional, the triggers that would mean rehydration is failing or the cause is something else, the caregiver context including what they can realistically sustain at home, and the named pediatric and nursing owners. Nothing here claims a causal treatment effect, a corrected deficit, durable recovery, readiness to leave care, disposition, prognosis, recurrence or outcome.' };
}
