import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SevereHyponatremiaProgress } from '../severe-hyponatremia-with-seizure';

export const SEVERE_HYPONATREMIA_TUTOR_VERSION = '0.1.0';

export interface SevereHyponatremiaPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * This lesson has two dangers pointing in opposite directions, about an hour
 * apart. First the brain is swelling and the sodium has to be raised quickly.
 * Then the same correction becomes the hazard, and the tell is not the sodium
 * at all — it is the urine output.
 *
 * It is silent on the unassisted setting, silent once the guardrails are
 * recorded, and silent for any scenario version it was not written against.
 */
export function severeHyponatremiaInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: SevereHyponatremiaProgress },
): SevereHyponatremiaPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.guardrailsAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.patternReviewedAtTick === null) return prompt('hyp-pattern', true,
    'The seizure has stopped and she has not. That is what makes this severe.',
    'A witnessed generalised seizure, now over, with deep somnolence persisting and a repeat sodium of 112. The word doing the work is symptomatic: a sodium of 112 found on a routine panel in someone chatting to you is a different problem with a different tempo, and it is the brain, not the number, that sets the urgency here. Glucose 96 and measured osmolality 238 close the two loopholes worth closing — this is genuine hypotonicity rather than a laboratory artefact from glucose or another osmole, which is why the measured osmolality is on the panel at all. No ongoing convulsion, trauma, hyperglycaemia or exogenous osmole is authored. This screen does not examine, validate samples, or interpret real laboratory data.');

  if (patient.stabilizedAtTick === null) return prompt('hyp-stabilization', true,
    'Protect her first — she has already had one seizure and may have another.',
    'Injury protection, airway and breathing support, oxygen and suction to hand, continuous monitoring, access, the glucose you already have, and critical-care plus endocrine or renal help called in parallel rather than in sequence. The postictal patient with a sodium of 112 is at real risk of a second seizure while you are drawing up the treatment for the first, and a lateral position with suction available is what stands between that and an aspiration. Calling for help belongs here rather than later because the decisions coming up — how fast, how far, and when to stop — are ones you want someone else looking at with you. Examination, equipment use, access, testing and team performance are not simulated.');

  if (patient.hypertonicAtTick === null) return prompt('hyp-hypertonic', true,
    'Now raise the sodium — quickly, by a small amount, and stop.',
    'A local-protocol intermittent hypertonic-saline bolus intent in a close-monitoring environment, aimed at a rise of about 5 mmol/L in the first hour with repeat neurologic and sodium review. Two things are counterintuitive in that sentence. The target is small: 5 mmol/L is usually enough to pull water out of a swollen brain and stop the seizures, and the goal of the first hour is not a normal sodium but a safe one. And boluses rather than an open infusion, because a bolus is a dose you have finished giving — an infusion left running is how the rise carries on past the point anyone intended while attention is elsewhere. Concentration, bolus volume, access, preparation, delivery, sodium kinetics and individual response are not simulated.');

  if (patient.reassessedAtTick === null) return prompt('hyp-reassess', true,
    'Check the response — and then read the urine output, which is the real news.',
    'Sodium 117, a rise of 5, and she opens her eyes and answers simple questions with residual confusion, breathing spontaneously, no further seizure. That is exactly the intended result and it is only half the panel. The urine output has gone from 35 to 180 mL an hour. That is a water diuresis starting: whatever was holding the antidiuretic hormone up has let go, and her kidneys have begun correcting the sodium themselves, faster than you were planning to. The danger has just changed direction. From here the risk is no longer a swollen brain but osmotic demyelination from a correction that overshoots, and the number that warned you was not the sodium. These are authored findings rather than a predicted response.');

  return prompt('hyp-guardrails', true,
    'Stop the saline, write down the ceilings, and go looking for the cause.',
    'The hypertonic saline stops after neurologic improvement and a 5 mmol/L rise, because its job is done and continuing it now adds only risk. The ceilings that get handed over are a total rise of no more than 10 mmol/L in the first twenty-four hours and 8 mmol/L per twenty-four hours after that, with serial sodium and urine output, because an autocorrecting patient can breach those without a further drop of treatment. Hold the chlorthalidone — a thiazide is the commonest drug cause of exactly this picture. Paired serum and urine studies, thyroid and adrenal review, and a specialist plan to halt or even deliberately reverse an overcorrection, which is a real and effective thing to do if the sodium runs away. Testing, diagnosis, fluid selection, desmopressin or free-water treatment, later course, disposition and outcome are outside this lesson.');
}
