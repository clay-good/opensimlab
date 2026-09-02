import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DysreflexiaProgress } from '../autonomic-dysreflexia-authored-trigger';

export const DYSREFLEXIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a blood pressure that is only alarming if you
 * know the usual one.
 *
 * A reading of 178/106 does not look like an emergency until you know his
 * verified seated baseline is 98/62 and his lesion is at T4 — eighty above
 * usual is the number that matters, and in this population a "normal" pressure
 * can be a crisis. The bradycardia belongs to the same reflex rather than being
 * a second problem, and the split at the lesion is the sign: flushed and
 * sweating above, piloerection below. The first intervention costs nothing and
 * is the one most often skipped in the rush to find a cause — sit him up. This
 * is also the one lesson where the learner physically changes something, and it
 * is exactly one thing: a visible external kink. None of these prompts
 * manipulates the catheter, performs bowel care, or selects a drug.
 */
export function dysreflexiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly dysreflexia?: DysreflexiaProgress;
}) {
  const patient = input.dysreflexia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('dysreflexia-trajectory', true,
    'Put his usual pressure next to this one before you judge either.',
    'His verified usual seated pressure is 98/62 with a rate of 68. He is now 178/106 — eighty millimetres above his own systolic, minutes after a routine transfer, with a pounding headache, flushing and sweating above the lesion and piloerection below it, at a rate of 48. In a complete T4 injury that reading is a crisis, and a pressure that would look unremarkable on anyone else can be one too. The bradycardia is part of the reflex rather than a separate problem.');
  if (patient.recognitionAtTick === null) return prompt('dysreflexia-recognition', true,
    'Name the pattern as urgent, and leave the alternatives open.',
    'A baseline-relative surge with the symptoms split above and below a high lesion is enough to act on immediately, and it is not a diagnosis that closes anything. Intracranial, cardiac, medication, pain, infection, urinary, bowel, skin and equipment causes all stay live, and qualified serial pressure, pulse, neurological, cardiopulmonary, abdominal and skin review continues regardless of what the trigger survey finds.');
  if (patient.supportAtTick === null) return prompt('dysreflexia-support', true,
    'Sit him up before you go looking for anything.',
    'Upright with the legs lowered where possible, and loosen anything constricting — this is the intervention that costs nothing, starts working while you are still thinking, and is the first move in every version of this emergency including the ones where no trigger is ever found. It is also the step most often skipped, because hunting the cause feels more like doing something. Frequent pressure and pulse surveillance and spinal-injury, medical, nursing, urology and emergency ownership start with it.');
  if (patient.triggerAtTick === null) return prompt('dysreflexia-trigger', true,
    'Start the survey at the bladder, and free only what you can see.',
    'The urinary system is where this comes from most often, and his suprapubic bag has had no urine in it for two hours — that absence is the finding. The external inspection shows the drainage tubing trapped beneath the chair rail, and releasing that visible kink is the entire physical act available here. No insertion, disconnection, irrigation, replacement, catheterization or bowel examination is yours to do, and none of it is exposed.');
  if (patient.reassessmentAtTick === null) return prompt('dysreflexia-reassess', false,
    'Record the release, let the interval pass, and read the strict reassessment.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how any individual pressure behaves after a trigger is removed.');
  return prompt('dysreflexia-handoff', true,
    'Hand off a pressure that came down and a person who is still at risk.',
    '108/66 with a rate of 64 and an easing headache, after upright support took it to 166/98 and freeing the kink took it to 124/76 with drainage resuming. That sequence is suggestive and it does not prove the kink was the sole cause, that the response would be the same next time, that this is durably resolved, or that a complication has been excluded. The baseline, the trigger list, the recurrence risk, the complications and the prevention plan all travel with him.');
}
