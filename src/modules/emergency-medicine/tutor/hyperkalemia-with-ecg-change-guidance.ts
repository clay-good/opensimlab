import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HyperkalemiaWithEcgChangeProgress } from '../hyperkalemia-with-ecg-change';

export const HYPERKALEMIA_WITH_ECG_CHANGE_TUTOR_VERSION = '0.1.0';

export interface HyperkalemiaWithEcgChangePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is believing the tracing. Calcium changes the
 * electrocardiogram without changing the chemistry, so the most reassuring
 * thing that happens in the next few minutes is also the least informative:
 * the authored report brings the QRS back from 140 ms to 104 ms with the
 * potassium still exactly 7.1 mmol/L.
 *
 * Four lanes follow the calcium and none waits on another, so that claim lives
 * in the beat for the state where none of them has been recorded — the only one
 * of those beats every path passes through.
 *
 * It is silent on the unassisted setting, silent once the reassessment is
 * recorded, and silent for any scenario version it was not written against.
 */
export function hyperkalemiaWithEcgChangeInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: HyperkalemiaWithEcgChangeProgress },
): HyperkalemiaWithEcgChangePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.patternReviewedAtTick === null) return prompt('hyk-pattern', true,
    'Read the tracing and the drug list together. Both of them got him here.',
    'A non-haemolysed repeat at 7.1 mmol/L, so this is real rather than a squeezed sample, with bradycardia at 48, peaked T waves, flattening P waves and a QRS of 140 ms. That widening is the finding that makes this an emergency rather than a result: the conduction system is failing in the order it always fails in, and the step after a wide QRS is a sine wave. Then the drivers, which are four and additive — stage 4 chronic kidney disease, two days of diarrhoea and poor intake, lisinopril, and a new course of trimethoprim-sulfamethoxazole. That last one surprises people: trimethoprim blocks the distal sodium channel much as amiloride does, so it is a potassium-sparing diuretic wearing an antibiotic label, and prescribing it alongside an ACE inhibitor in stage 4 CKD is how a stable outpatient arrives like this. This screen acquires no specimen and interprets no real ECG.');

  if (patient.calciumAtTick === null) return prompt('hyk-calcium', true,
    'Calcium first — and be clear with yourself about what it is buying.',
    'An immediate local-protocol intravenous calcium salt, because the QRS is 140 ms and the myocardium needs to survive the next twenty minutes. Calcium raises the threshold potential and restores the gradient the potassium has eroded; it antagonises the effect at the membrane. It removes nothing. Not one millimole leaves the body and none of it goes into a cell — the serum potassium after calcium is the same number it was before. Recording this intent also does not change the tracing on this screen, because this is a record of a decision rather than a drug going in. Salt selection, dose, access, delivery, repeat dosing and individual response are not simulated.');

  const noLanes = patient.postCalciumEcgAtTick === null && patient.insulinGlucoseAtTick === null
    && patient.betaAgonistAtTick === null && patient.removalAtTick === null;
  if (noLanes) return prompt('hyk-lanes', true,
    'Four lanes are open at once now, and the one that will look most reassuring is the one that proves least.',
    'They are unordered on purpose: the repeat tracing, the insulin-glucose, the adjunct beta-2 agonist, and the removal-plus-cause-control all proceed in parallel. What is worth holding onto is that they are three different jobs and only one of them lowers the total. Calcium protected. Insulin and salbutamol shift — potassium moves from the serum into cells, which is a loan rather than a payment, and the body has to give it back over the next few hours. Only dialysis, a binder, or a working kidney removes any. So when the post-team ECG comes back with the QRS down to 104 ms and the potassium still reading 7.1, that pairing is the whole lesson in one line: the tracing improved and the chemistry did not move at all. In a man with stage 4 kidney disease the borrowed potassium has nowhere to go, which is why the removal lane is not the optional one. No dose, delivery, kinetics, binder, diuresis or dialysis is simulated.');

  if (patient.postCalciumEcgAtTick === null) return prompt('hyk-ecg', true,
    'Read the later report, and read the potassium next to it.',
    'The authored treating-team report after delivered local-protocol care: heart rate 62, P waves visible again, QRS back to 104 ms, T waves less prominent. And potassium 7.1 mmol/L, unchanged. That improvement is an authored response to care that was delivered, not to the click that recorded an intent, and it is not biochemical resolution or proof of any single cause. A tracing that has stopped shouting is the thing most likely to end a resuscitation early.');

  if (patient.insulinGlucoseAtTick === null) return prompt('hyk-insulin', true,
    'Insulin and glucose — and the glucose surveillance is part of the order, not a courtesy.',
    'A local-protocol intravenous insulin-glucose intent with a baseline and structured post-treatment glucose checks. The baseline here is 108 mg/dL. Insulin is the most reliable shifting agent available and it is also the one that hurts people: the hypoglycaemia arrives an hour or more later, after the team that gave it has moved on, and it is worse in exactly this patient because chronic kidney disease slows insulin clearance. Booking the glucose checks at the same moment you record the insulin is what makes that a treatment rather than a trade. Dose, formulation, infusion, the potassium shift, hypoglycaemia and rescue are not simulated.');

  if (patient.betaAgonistAtTick === null) return prompt('hyk-beta', true,
    'Add the nebulised beta-2 agonist as an adjunct — and only as an adjunct.',
    'It shifts potassium into cells by a different route from insulin, so the two add up, and it is easy to give while other things are happening. What it is not is a treatment on its own: the effect is modest, the response varies a great deal between people, and a meaningful proportion of patients barely respond at all. Reaching for it alone in a patient with a 140 ms QRS is the version of this that ends badly. Agent, dose, delivery, response variability and adverse effects are not simulated.');

  if (patient.removalAtTick === null) return prompt('hyk-removal', true,
    'Now the only lane that lowers the total — and the two prescriptions you can stop right here.',
    'Hold the lisinopril and hold the trimethoprim. That is the part of this a clinician in the department can actually finish, and it is the difference between treating an episode and preventing the next one. Then dehydration and kidney-injury evaluation, renal expertise, a local potassium-removal strategy, and an explicit dialysis contingency for hyperkalaemia that will not stay down — because in stage 4 disease the shifted potassium comes back and there is no reserve to excrete it. Binder, diuretic, fluid and dialysis selection or delivery are not simulated.');

  return prompt('hyk-reassess', true,
    'Let time pass, then read all three together: potassium, glucose, tracing.',
    'The one-hour panel is potassium 5.8 mmol/L, glucose 92 mg/dL, heart rate 68, P waves present, QRS 98 ms, no new instability. Severe toxicity has improved and the danger has not left the building: most of that fall is potassium sitting inside cells on a promise, the kidney that would settle the account is at stage 4, and the glucose of 92 is a number heading in a direction worth watching after insulin. This step is gated behind a further tick because a panel drawn at the moment of an intent would tell you about the clock rather than the patient. What gets handed off is continued ECG, potassium, glucose, renal, removal and recurrence surveillance. Dialysis, later course, disposition and outcome are outside this lesson.');
}
