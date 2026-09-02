import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricDka, type PediatricDkaAction, type PediatricDkaProgress,
} from '../pediatric-diabetic-ketoacidosis';

export const PEDIATRIC_DKA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricDkaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricDka(scenario);
}

export interface PediatricDkaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricDkaAction; readonly finished?: boolean;
}

/**
 * The worked example for a child whose numbers are all improving.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes care first and safety second,
 * which is one valid order rather than the required one. The example examines
 * nobody, performs no neurological examination, calculates no dehydration,
 * sodium, osmolality, anion gap, deficit, maintenance, dose or rate,
 * diagnoses and grades nothing, acquires and interprets no test, chooses no
 * fluid, solution, bolus, volume, rate, insulin, dextrose, potassium,
 * phosphate, bicarbonate, access or device, and determines no disposition or
 * outcome.
 */
export function pediatricDkaDemonstrationStep(
  patient?: PediatricDkaProgress,
): PediatricDkaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Every number moved the right way and nothing about her brain was settled by that. The team taking over knows when the next neurological observation is due and what would make them act on it. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-dka-illness-and-fixed-pattern',
      narration: 'Read the child, then the panel. They are one story. A nine-year-old, 30 kg, two weeks of thirst, frequent urination, tiredness and reported weight loss, then one day of vomiting, abdominal discomfort, deep breathing and almost no intake. She is tired but oriented and answering, with dry mucosa, a heart rate of 124 and a deep respiratory rate of 30. The supplied venous sample reports a glucose of 468, a beta-hydroxybutyrate of 5.6, a pH of 7.14, a bicarbonate of 8, a potassium of 4.6 and a sodium of 132. Notice that the deep breathing and the abdominal pain are already explained by the panel — they are not a second illness, and reading them separately is how a child in this state gets sent for a surgical opinion instead.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-dka-and-current-risk',
      narration: 'Three findings make this, not one. And say what the calm does not mean. Hyperglycemia, ketonemia and metabolic acidosis together establish authored DKA; a glucose of 468 on its own does not, and you did not diagnose or grade it. Two boundaries follow and both matter. She is not in shock: orientation, warm extremities, normal pulse volume, a refill of two seconds and a preserved pressure say so. And there is no cerebral-injury warning cluster right now — no headache, no recurrent vomiting after arrival, no bradycardia, no hypertension, no hypoxemia, no focal sign. That is a description of this minute and not an exclusion. Cerebral injury stays possible in this child, which is why the neurological surveillance is a step of its own rather than a footnote.' };
  }
  if (patient.careAtTick === null) {
    return { id: 'care', focus: 'actions', progress: 0.46, action: 'activate-pediatric-dka-qualified-care-ownership',
      narration: 'Two things run together: the protocol, and the watch on her brain. Start with the care ownership. Experienced pediatric, diabetes, nursing, pharmacy and laboratory teams take locally protocolized fluid, insulin, glucose, electrolyte and access work, intake and output, frequent biochemical, rhythm and neurological monitoring, and escalation. The sequence, the solution, the route, the concentration, the bolus, the dose, the rate, the threshold, the pump and the formula are all theirs, and none of them is universal — the differences between local protocols are real and this lab teaches none of them as the answer.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-dka-neurologic-and-metabolic-safety',
      narration: 'Care is owned. Now name what you are watching her brain for. This is the step the lesson exists for. Serial consciousness and behavior, headache, vomiting, pupils, breathing, oxygenation, heart rate, blood pressure, perfusion, rhythm, glucose, electrolytes, acid-base status, ketones, renal context, fluid balance and urine — alongside the precipitant nobody has found yet. The fixed negatives you were handed are snapshots. No single sign proves cerebral injury and no single sign excludes it, so what protects her is the repetition rather than any one reassuring number.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-dka-later-response',
      narration: 'Let time pass, then make the reassessment count. At minute sixty she is still tired but alert, interactive and oriented, with no new headache, no recurrent emesis, no focal sign, no bradycardia, no hypertension and no hypoxemia. Her heart rate is 108, her breathing is still deep at 24, her MAP is 79. The repeat panel reports a glucose of 342, a beta-hydroxybutyrate of 4.5, a pH of 7.20, a bicarbonate of 11, a potassium of 4.1 and a sodium of 134. Every one of those is moving the right way, and that is the moment to be most careful: improving trends do not prove the treatment caused them, do not resolve the ketoacidosis, and above all do not exclude cerebral injury. The surveillance does not relax because the numbers did.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-dka-active-risk',
    narration: 'Hand off a child who is improving and still at risk of the thing nobody has seen yet. What travels is the two-week history and the one-day deterioration, the fixed panel and the improving repeat, the findings that argue against current shock, the absent cerebral-injury warning cluster stated as an absence rather than an exclusion, the neurological observations and how often they are due, the fluid, insulin, glucose and electrolyte work with the team that owns it, the intake and output, the precipitant still unidentified, the caregiver context including that this may be a new diagnosis for the family, and the named pediatric, diabetes, nursing, pharmacy and laboratory owners. Nothing here claims a treatment effect, biochemical resolution, an excluded cerebral injury, durable recovery, disposition, prognosis or outcome.' };
}
