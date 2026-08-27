import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HyponatremiaCorrectionSnapshot } from '@platform/kernel/protocol';

export const HYPONATREMIA_CORRECTION_SOURCE_ID = 'sfe-emergency-hyponatremia-2022';
export const HYPONATREMIA_CORRECTION_SOURCE_HREF = 'https://www.endocrinology.org/media/xhrhxhxm/emergency-management-of-severe-and-moderately-severely-symptomatic-hyponatraemia-in-adult-patients-2022.pdf';
export const HYPONATREMIA_CORRECTION_LIMITS_SOURCE_HREF = 'https://doi.org/10.2215/CJN.0000000000000244';

/** Guidance knows accepted requests and requested observations, never hidden sodium. */
export function hyponatremiaCorrectionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly hyponatremiaCorrection?: HyponatremiaCorrectionSnapshot;
}) {
  const patient = input.hyponatremiaCorrection;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: HYPONATREMIA_CORRECTION_SOURCE_HREF };
  if (patient.aquaresisObserved && patient.waterLossControlAtTick === null) return prompt('sodium-correction-control', true,
    'Request qualified management of the observed water diuresis.',
    'Stopping hypertonic saline does not stop sodium rising when water loss increases. Support and risk review must not delay a response to observed excessive correction. No fluid or desmopressin dose is selected.');
  if (patient.overcorrectionObserved && patient.reloweringAtTick === null) return prompt('sodium-correction-relower', true,
    'Request expert-directed relowering after the observed limit breach.',
    'This high-risk plan counts from the original sodium of 106, not the post-rescue 111. Water-loss control and relowering can be requested in either order; neither erases the observed peak.');
  if (patient.riskReviewedAtTick === null) return prompt('sodium-correction-risk', true,
    'Review the original correction window and the high-risk plan.',
    'The supplied rise is already 5 mmol/L in one hour. Malnutrition, alcohol-use disorder, low potassium, and unknown duration call for cautious qualified surveillance; potassium care also contributes to correction.');
  if (!patient.supportActive) return prompt('sodium-correction-support', true,
    'Make specialist and monitoring ownership explicit.',
    'Qualified endocrine, emergency, renal, and nursing support need one shared correction record and a continuing potassium, nutrition, and cause-review plan.');
  if (patient.monitoringAtTick === null) return prompt('sodium-correction-monitor', true,
    'Arrange serial sodium, urine-output, and neurologic surveillance.',
    'The seizure has stopped, but symptom relief cannot establish controlled correction. Requested results remain historical rather than becoming a live sodium monitor.');
  if (!patient.aquaresisObserved) return patient.aquaresisDueInSeconds !== null
    ? prompt('sodium-correction-observe', false, 'Continue surveillance and reassess whenever needed.',
      'The next authored observation checkpoint is not a safe waiting interval. A new result must be requested; neither stable symptoms nor stopped saline proves a stable sodium.')
    : prompt('sodium-correction-reassess', true, 'Request a fresh sodium and urine-output assessment.',
      'Compare the new requested result with the original sodium of 106 and the full correction window. Do not infer the present result from an older observation.');
  if (patient.responseDueInSeconds !== null) return prompt('sodium-correction-observe-response', false,
    'Continue qualified care and frequent reassessment.',
    'The 60-minute reassessment checkpoint is authored, not a drug prediction, proof of response, or permission to stop checking. Earlier results and the observed peak remain part of the same correction window.');
  if (!patient.responseObserved) return prompt('sodium-correction-reassess-response', true,
    'Request a fresh sodium, urine-output, and bedside assessment.',
    'Accepting a response is not observing its effect. Review the whole correction record, including the highest supplied or requested sodium, before handing off care.');
  return prompt('sodium-correction-handoff', false, 'Hand off the correction window and continuing risks.',
    'Keep the original baseline, observed peak, prior choices, potassium plan, and 24–48-hour sodium, urine, and neurologic surveillance together. This is neither discharge clearance nor proven prevention of osmotic demyelination.');
}
