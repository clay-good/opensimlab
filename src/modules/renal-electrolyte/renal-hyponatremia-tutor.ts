import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHyponatremiaSnapshot } from '@platform/kernel/protocol';

export const RENAL_HYPONATREMIA_SOURCE_HREF = 'https://www.endocrinology.org/media/xhrhxhxm/emergency-management-of-severe-and-moderately-severely-symptomatic-hyponatraemia-in-adult-patients-2022.pdf';

/** Requested full observations, not sodium alone or hidden physiology, establish the teaching response. */
export function renalHyponatremiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalHyponatremia?: RenalHyponatremiaSnapshot;
}) {
  const patient = input.renalHyponatremia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: RENAL_HYPONATREMIA_SOURCE_HREF };
  if (patient.rescueAtTick === null) return prompt('renal-hyponatremia-rescue', true,
    'Arrange qualified symptom-led rescue for the supplied presentation.',
    'Confusion, headache, and nausea matter alongside sodium. Initial rescue does not wait for support acknowledgment, cause classification, or a new laboratory click; no dose or delivery schedule is selected.');
  if (!patient.supportActive) return prompt('renal-hyponatremia-support', true,
    'Coordinate qualified acute-care, specialist, and nursing ownership.',
    'Rescue and monitoring proceed while the teams align. The original sodium of 118 remains the correction baseline rather than resetting after treatment.');
  if (patient.contextReviewedAtTick === null) return prompt('renal-hyponatremia-context', true,
    'Review the pretreatment specimens, medications, and diagnostic uncertainty.',
    'The supplied urine results were collected before treatment. Thiazide exposure confounds interpretation; these findings do not independently prove SIAD. Cause review must not delay initial rescue.');
  if (patient.monitoringAtTick === null) return prompt('renal-hyponatremia-monitor', true,
    'Arrange sodium, urine-output, neurologic, and bedside surveillance.',
    'A sodium-only or neurologic-only check is partial information. Neither refreshes the full paired assessment or establishes symptom recovery.');
  if (!patient.initialResponseObserved) return patient.rescueDueInSeconds !== null
    ? prompt('renal-hyponatremia-observe-initial', false, 'Continue qualified rescue and close reassessment.',
      'The 60-minute contrast is authored, not a required clinical wait. New findings need explicit assessment; a treatment request does not prove its response.')
    : prompt('renal-hyponatremia-reassess-initial', true, 'Request sodium, symptoms, and bedside findings together.',
      'Assess whether the patient improved, not just whether sodium rose. Partial checks retain their own timestamps and cannot replace the selected full assessment.');
  if (patient.additionalRescueAtTick === null) return prompt('renal-hyponatremia-additional', true,
    'Request the selected qualified limited additional rescue for persistent symptoms.',
    'The observed first response did not resolve confusion, headache, or nausea. This follows the selected Society for Endocrinology pathway, not a universal regional rule or a prescription. Neurologic and alternate-cause evaluation can proceed in parallel.');
  if (patient.neurologicReviewAtTick === null) return prompt('renal-hyponatremia-neurology', true,
    'Arrange neurologic and alternate-cause evaluation for continuing symptoms.',
    'Evaluation is available at any time, does not gate rescue, and does not itself cure symptoms or confirm a diagnosis.');
  if (patient.additionalRescueDueInSeconds !== null) return prompt('renal-hyponatremia-observe-additional', false,
    'Continue expert treatment review and repeated assessment.',
    'The next 30-minute contrast is authored. Neither the clock nor an additional treatment request establishes symptom improvement or a reason to stop care.');
  if (!patient.additionalResponseObserved) return prompt('renal-hyponatremia-reassess-additional', true,
    'Request a fresh full assessment after additional rescue.',
    'Keep the original baseline and cumulative observed rise beside current symptoms. A newer sodium-only result does not refresh the older neurologic or full assessment.');
  return prompt('renal-hyponatremia-handoff', false, 'Hand off persistent symptoms and continuing expert review.',
    'The observed +6 mmol/L rise is not a clinical stopping rule. Treatment, sodium and neurologic monitoring, and cause evaluation remain active responsibilities, not discharge clearance.');
}
