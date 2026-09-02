import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricDehydrationProgress } from '../pediatric-dehydration-with-hypovolemia';

export const PEDIATRIC_DEHYDRATION_TUTOR_VERSION = '0.1.0';

export interface PediatricDehydrationPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * The reflex it exists to interrupt is arithmetic: two weights a week apart
 * make a percentage, a percentage makes a deficit, and a deficit makes a
 * cannula — for a child who is interactive, warm and perfusing, in whom the
 * mouth is the right route. As in septic shock, rehydration and safety review
 * are unordered, so there is a beat for each of the three ways that pair can
 * be half done. It is silent on the unassisted setting, silent once the
 * handoff is recorded, and silent for any scenario version it was not written
 * against.
 */
export function pediatricDehydrationInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricDehydrationProgress },
): PediatricDehydrationPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('pdh-trajectory', true,
    'You have two weights a week apart. Resist turning them into a percentage.',
    'A previously well two-year-old, 12 kg today against a reliable same-scale 12.6 kg a week ago, after three days of non-bloody watery diarrhea, repeated vomiting, minimal intake and one urine in twelve hours. That weight change is a good clue and it is one clue: it is not a stand-alone dehydration percentage and it is not an intravascular deficit, because a week-old weight also contains a week of not eating. Read it alongside what is in front of you — dry mucosa, no tears, mildly sunken eyes, reduced turgor, and a child who is irritable but consolable and still interacting with you.');
  if (patient.recognitionAtTick === null) return prompt('pdh-recognition', true,
    'Name the compensation, and say plainly that this is not shock.',
    'The supplied experienced-team assessment is clinical dehydration with compensated volume depletion. What makes it compensated is on the other side of the chart: she is interactive, her extremities are warm, her pulses are normal volume, her refill is two seconds and her pressure is preserved at 90/56. No single sign, no score and no calculated percentage established that classification, and you did not diagnose it. The absences — no fever, no blood or mucus in the stool, no bilious emesis, no severe focal abdominal finding, no distension, no diabetes history — are fixed snapshots rather than permanent exclusions, which is exactly why the safety review does not stop here.');
  if (patient.rehydrationAtTick === null && patient.safetyAtTick === null) return prompt('pdh-parallel', true,
    'Two things run together: the fluid going in, and the watch for being wrong.',
    'Start with rehydration ownership. Experienced pediatric and nursing teams take locally protocolized oral rehydration in small frequent amounts, the breastfeeding and phase-appropriate feeding context, intake and output, tolerance, serial whole-child reassessment, and escalation of route if she deteriorates or cannot keep it down. In a child who is alert, warm and perfusing, the mouth is the route this evidence supports; you select no solution, route, volume, rate, access, device, drug or feeding plan, and glucose, electrolytes and renal function stay qualified work for when they are indicated.');
  if (patient.rehydrationAtTick === null) return prompt('pdh-rehydration', true,
    'The watch is set. Nobody owns the fluid yet.',
    'Reviewing the losses and the red flags was right, and it puts nothing into this child. Activating rehydration ownership means experienced pediatric and nursing teams take locally protocolized oral rehydration in small frequent amounts, the feeding context, intake and output, tolerance, serial reassessment, and route escalation if she deteriorates or cannot tolerate it. The solution, the route, the volume, the rate, the access and the feeding plan are all theirs. What you record is that they own it.');
  if (patient.safetyAtTick === null) return prompt('pdh-safety', true,
    'Rehydration is owned. Now keep watching for the reason it will not work.',
    'Oral rehydration is the plan, not a guarantee, and this is where the failure modes get named while there is still time: ongoing stool and emesis against what she is taking, oral tolerance, urine, hydration signs, consciousness, circulation, the weight trend, whether glucose or electrolytes have become a concern, how reliably the caregiver can keep this going, and the red flags for shock or a serious alternative cause. The fixed negative findings you were given are snapshots. Reviewing them again is what turns them from a conclusion back into a question.');
  if (patient.laterResponseAtTick === null) return prompt('pdh-later', true,
    'Let time pass, then reassess before you reassure.',
    'At minute sixty she is alert, engaging and tolerating small frequent amounts, with a temperature of 37.4°C, a heart rate of 116, a MAP of 69, tears present, a moistening mouth, less-sunken eyes, warm normal-volume pulses and a refill of two seconds. One urine, one further watery stool, no further vomiting. That is genuinely better. Now notice what you were not given: no repeat weight, no complete intake total, no laboratory panel, no full deficit correction and no route endpoint. Partial improvement is the honest description, and the losses are still running.');
  return prompt('pdh-handoff', true,
    'Hand off a child who is improving and still losing fluid.',
    'What travels is the loss and intake trajectory with the weight as context rather than a calculation, the hydration signs, the findings that argue against current shock, oral tolerance, urine and stool output, the glucose and electrolyte review that stays conditional, the triggers that would mean rehydration is failing or the cause is something else, the caregiver context including what they can realistically sustain at home, and the named pediatric and nursing owners. Nothing here claims a causal treatment effect, a corrected deficit, durable recovery, readiness to leave care, disposition, prognosis, recurrence or outcome.');
}
