import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricDkaProgress } from '../pediatric-diabetic-ketoacidosis';

export const PEDIATRIC_DKA_TUTOR_VERSION = '0.1.0';

export interface PediatricDkaPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * The thing it will not let a learner do is treat an absence as an exclusion:
 * she has no headache, no bradycardia, no hypertension and no focal sign now,
 * and none of that removes the risk of cerebral injury or the surveillance for
 * it. Care and safety review are unordered, so there is a beat for each of the
 * three ways that pair can be half done. It is silent on the unassisted
 * setting, silent once the handoff is recorded, and silent for any scenario
 * version it was not written against.
 */
export function pediatricDkaInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricDkaProgress },
): PediatricDkaPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('pdka-trajectory', true,
    'Read the child, then the panel. They are one story.',
    'A nine-year-old, 30 kg, two weeks of thirst, frequent urination, tiredness and reported weight loss, then one day of vomiting, abdominal discomfort, deep breathing and almost no intake. She is tired but oriented and answering, with dry mucosa, a heart rate of 124 and a deep respiratory rate of 30. The supplied venous sample reports a glucose of 468, a beta-hydroxybutyrate of 5.6, a pH of 7.14, a bicarbonate of 8, a potassium of 4.6 and a sodium of 132. Notice that the deep breathing and the abdominal pain are already explained by the panel — they are not a second illness, and reading them separately is how a child in this state gets sent for a surgical opinion instead.');
  if (patient.recognitionAtTick === null) return prompt('pdka-recognition', true,
    'Three findings make this, not one. And say what the calm does not mean.',
    'Hyperglycemia, ketonemia and metabolic acidosis together establish authored DKA; a glucose of 468 on its own does not, and you did not diagnose or grade it. Two boundaries follow and both matter. She is not in shock: orientation, warm extremities, normal pulse volume, a refill of two seconds and a preserved pressure say so. And there is no cerebral-injury warning cluster right now — no headache, no recurrent vomiting after arrival, no bradycardia, no hypertension, no hypoxemia, no focal sign. That is a description of this minute and not an exclusion. Cerebral injury stays possible in this child, which is why the neurological surveillance is a step of its own rather than a footnote.');
  if (patient.careAtTick === null && patient.safetyAtTick === null) return prompt('pdka-parallel', true,
    'Two things run together: the protocol, and the watch on her brain.',
    'Start with the care ownership. Experienced pediatric, diabetes, nursing, pharmacy and laboratory teams take locally protocolized fluid, insulin, glucose, electrolyte and access work, intake and output, frequent biochemical, rhythm and neurological monitoring, and escalation. The sequence, the solution, the route, the concentration, the bolus, the dose, the rate, the threshold, the pump and the formula are all theirs, and none of them is universal — the differences between local protocols are real and this lab teaches none of them as the answer.');
  if (patient.careAtTick === null) return prompt('pdka-care', true,
    'The surveillance is set. The protocol still has no owner.',
    'Reviewing the neurological and metabolic risks was right and it delivers nothing. Activating care ownership means experienced pediatric, diabetes, nursing, pharmacy and laboratory teams own the locally protocolized fluid, insulin, glucose, electrolyte and access work, the input and output, the frequent biochemical and neurological monitoring, and the escalation. You choose no sequence, solution, route, concentration, bolus, dose, rate, threshold or formula. What you record is that the people who do are running it.');
  if (patient.safetyAtTick === null) return prompt('pdka-safety', true,
    'Care is owned. Now name what you are watching her brain for.',
    'This is the step the lesson exists for. Serial consciousness and behavior, headache, vomiting, pupils, breathing, oxygenation, heart rate, blood pressure, perfusion, rhythm, glucose, electrolytes, acid-base status, ketones, renal context, fluid balance and urine — alongside the precipitant nobody has found yet. The fixed negatives you were handed are snapshots. No single sign proves cerebral injury and no single sign excludes it, so what protects her is the repetition rather than any one reassuring number.');
  if (patient.laterResponseAtTick === null) return prompt('pdka-later', true,
    'Let time pass, then make the reassessment count.',
    'At minute sixty she is still tired but alert, interactive and oriented, with no new headache, no recurrent emesis, no focal sign, no bradycardia, no hypertension and no hypoxemia. Her heart rate is 108, her breathing is still deep at 24, her MAP is 79. The repeat panel reports a glucose of 342, a beta-hydroxybutyrate of 4.5, a pH of 7.20, a bicarbonate of 11, a potassium of 4.1 and a sodium of 134. Every one of those is moving the right way, and that is the moment to be most careful: improving trends do not prove the treatment caused them, do not resolve the ketoacidosis, and above all do not exclude cerebral injury. The surveillance does not relax because the numbers did.');
  return prompt('pdka-handoff', true,
    'Hand off a child who is improving and still at risk of the thing nobody has seen yet.',
    'What travels is the two-week history and the one-day deterioration, the fixed panel and the improving repeat, the findings that argue against current shock, the absent cerebral-injury warning cluster stated as an absence rather than an exclusion, the neurological observations and how often they are due, the fluid, insulin, glucose and electrolyte work with the team that owns it, the intake and output, the precipitant still unidentified, the caregiver context including that this may be a new diagnosis for the family, and the named pediatric, diabetes, nursing, pharmacy and laboratory owners. Nothing here claims a treatment effect, biochemical resolution, an excluded cerebral injury, durable recovery, disposition, prognosis or outcome.');
}
