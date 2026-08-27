import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AvpDeficiencySnapshot } from '@platform/kernel/protocol';

export const AVP_DEFICIENCY_SOURCE_ID = 'sfe-inpatient-avp-deficiency-2018';
export const AVP_DEFICIENCY_SOURCE_HREF = 'https://doi.org/10.1530/EC-18-0154';

/** Only accepted requests, visible circulation, and requested findings inform this tutor. */
export function avpDeficiencyInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly avpDeficiency?: AvpDeficiencySnapshot;
}) {
  const patient = input.avpDeficiency;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: AVP_DEFICIENCY_SOURCE_HREF };
  if (patient.volumeAtTick === null) return prompt('avp-deficiency-volume', true,
    'Start qualified volume restoration for the supplied circulatory compromise.',
    'Low urine output during hypovolemia does not exclude this known AVP deficiency. Fluid-first care must not wait for administrative review or another laboratory result; no dose or rate is selected.');
  if (patient.circulationRestored && patient.waterAtTick === null) return prompt('avp-deficiency-water', true,
    'Arrange tailored water replacement while surveillance continues.',
    'Restored circulation does not replace the remaining water deficit. Qualified water and desmopressin requests can proceed in either order now; neither needs a new laboratory click or administrative acknowledgment.');
  if (patient.circulationRestored && patient.desmopressinAtTick === null) return prompt('avp-deficiency-desmopressin', true,
    'Restore the qualified desmopressin pathway for known AVP deficiency.',
    'This is a supplied diagnosis with omitted prescribed medication, not a diagnostic challenge. The request includes qualified assessment and monitoring; no new laboratory click, water request, or administrative acknowledgment is required.');
  if (patient.contextReviewedAtTick === null) return prompt('avp-deficiency-context', true,
    'Review the supplied medication, drinking-access, and electrolyte context.',
    'Omitted desmopressin and restricted access to drinking water explain important hazards without establishing the duration of hypernatremia. Keep medication reconciliation and access to water in the continuing plan.');
  if (!patient.supportActive) return prompt('avp-deficiency-support', true,
    'Coordinate qualified endocrine and monitored-care support.',
    'One team needs ownership of circulation, water replacement, prescribed medication, sodium, and urine surveillance. A support acknowledgment must not delay urgent care.');
  if (patient.monitoringAtTick === null) return prompt('avp-deficiency-monitor', true,
    'Arrange serial sodium, urine, fluid-balance, and neurologic checks.',
    'Water replacement and antidiuresis must be followed together. A better blood pressure or less urine alone cannot establish correction or safety.');
  if (!patient.circulationRestored) return prompt('avp-deficiency-observe-volume', false,
    'Continue close circulatory assessment during qualified volume care.',
    'The 15-minute circulation contrast is authored, not a required clinical wait or predicted fluid response. Reassess whenever needed; do not use the clock as permission to delay care.');
  if (!patient.volumeObserved) return prompt('avp-deficiency-reassess-volume', true,
    'Request fresh sodium and urine findings alongside bedside reassessment.',
    'The low initial urine output may not describe the patient after circulation improves. Requested findings help follow the trajectory; they are not a prerequisite for restoring the known treatment pathway.');
  if (patient.responseDueInSeconds !== null) return prompt('avp-deficiency-observe-response', false,
    'Continue tailored care and frequent reassessment.',
    'The two-hour combined-care checkpoint is authored, not a predicted sodium change or permission to stop checking. Older sodium and urine results remain historical.');
  if (!patient.responseObserved) return prompt('avp-deficiency-reassess-response', true,
    'Request a fresh sodium, urine, and bedside assessment.',
    'Both requests and elapsed time are insufficient evidence of response. Compare the new result with the original sodium and the highest supplied or requested value.');
  return prompt('avp-deficiency-handoff', false, 'Hand off continuing water balance and medication ownership.',
    'Keep sodium, urine, fluid balance, neurologic surveillance, drinking access, and prescribed desmopressin together. Partial improvement is not sodium normalization, recovery, or discharge clearance.');
}
