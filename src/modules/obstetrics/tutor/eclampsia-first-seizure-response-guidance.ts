import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EclampsiaProgress } from '../eclampsia-first-seizure-response';

export const ECLAMPSIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a seizure that has already stopped.
 *
 * Most eclamptic convulsions stop on their own within a couple of minutes, so
 * the fact that this one ended says nothing reassuring — what matters is that
 * it can happen again, and the readiness for the second one is the work. The
 * error this lesson refuses is treating a first seizure as a diagnostic problem
 * to be solved before the maternal response begins: the pressure of 176/118,
 * five hours of headache and visual spots, platelets of 96 and transaminases at
 * twice the local ceiling are already an eclampsia pattern, and stroke, PRES,
 * thrombosis, hemorrhage, epilepsy, infection, metabolic, toxic and traumatic
 * causes stay open while the response runs rather than before it. None of these
 * prompts times or protects a seizure, positions or examines her, reads the
 * fetal trace, or selects magnesium, an antihypertensive, an airway maneuver or
 * a birth.
 */
export function eclampsiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly eclampsia?: EclampsiaProgress;
}) {
  const patient = input.eclampsia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('eclampsia-trajectory', true,
    'Read the stopped seizure inside five hours of warning symptoms.',
    'A witnessed 70-second convulsion at 38 weeks and 2 days that stopped on its own three minutes ago, in a woman who had reported severe headache, flashing visual spots and epigastric pain for five hours beforehand. She is postictal but rousable and breathing. The pressure is 176/118, the platelets are 96, the creatinine has risen from 0.7 to 1.2, and the transaminases are above twice the local ceiling. The fetal baseline is 125 with minimal variability after transient slowing during the convulsion — which is what a fetus does after a maternal seizure.');
  if (patient.recognitionAtTick === null) return prompt('eclampsia-recognition', true,
    'Call it eclampsia now, and let the dangerous alternatives stay open behind it.',
    'A generalized convulsion in late pregnancy with severe hypertension, five hours of warning symptoms and organ involvement is the pattern, and it does not need the pending imaging, urine protein, hemolysis evaluation or toxicology to be acted on. Naming it excludes nothing: stroke, PRES, cerebral venous thrombosis, hemorrhage, epilepsy, infection, metabolic, toxic and traumatic causes all remain live, and the ones that are not eclampsia are exactly why the imaging still matters afterwards.');
  if (patient.supportAtTick === null) return prompt('eclampsia-support', true,
    'Build for the next seizure rather than the one that has ended.',
    'Injury protection, airway and breathing readiness, monitoring, access, glucose review, the magnesium protocol, the immediate severe-pressure response and obstetric, anesthesia, nursing, pharmacy, critical-care, fetal, neonatal and dignity-centered ownership all begin now, with the cause review running beside them. The seizure stopping on its own is the ordinary course of an eclamptic convulsion rather than evidence that it is over, and recurrence is the specific thing this response exists to be ready for.');
  if (patient.evidenceAtTick === null) return prompt('eclampsia-evidence', true,
    'Keep the fetus and the alternatives coupled to the recovery.',
    'The postictal state, the aspiration risk while she was convulsing, the platelets, the liver and the kidney all belong to one picture, and the fetal minimal variability follows the maternal seizure rather than standing apart from it. The imaging, toxicology and hemolysis evaluation stay pending; nothing here identifies the cause, excludes a stroke, or establishes eligibility for anything.');
  if (patient.reassessmentAtTick === null) return prompt('eclampsia-reassess', false,
    'Read the fixed 20-minute report as one sample rather than as recovery.',
    'It is a contrast rather than a required wait or a predicted response time, and a short fetal sample is a short sample. Nothing here says how any individual eclampsia behaves next.');
  return prompt('eclampsia-handoff', true,
    'Hand off the seizure that has not happened yet.',
    'No recurrent convulsion, improving alertness, 154/100, and a fetal baseline of 145 with moderate variability in a short sample — none of which establishes treatment effect, durable seizure or pressure control, neurologic recovery, fetal safety or delivery readiness, and her headache and visual symptoms persist. The recurrence risk, the airway and aspiration risk, the stroke question, the pressure, the organ trajectory, the fetal status, the birth timing and route, and the disposition all travel with her.');
}
