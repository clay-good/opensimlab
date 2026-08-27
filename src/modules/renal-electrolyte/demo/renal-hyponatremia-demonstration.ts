import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { RenalHyponatremiaSnapshot } from '@platform/kernel/protocol';
import { supportsRenalHyponatremia, type RenalHyponatremiaAction } from '../hyponatremia';

export const RENAL_HYPONATREMIA_DEMONSTRATION_VERSION = '0.1.0';
export function supportsRenalHyponatremiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalHyponatremia(scenario);
}
export interface RenalHyponatremiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalHyponatremiaAction; readonly finished?: boolean;
}

export function renalHyponatremiaDemonstrationStep(patient?: RenalHyponatremiaSnapshot): RenalHyponatremiaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Persistent symptoms and continuing expert treatment review are handed off. The observed rise is not a stopping rule, normalization, or discharge clearance. This ends the example, not the need for care.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.rescueAtTick === null) return { id: 'rescue', narration: 'Arrange qualified symptom-led rescue for confusion, headache, and nausea with the supplied low sodium. Initial treatment does not wait for administrative review, diagnostic certainty, or another laboratory click. No dose or delivery schedule is selected.', focus: 'actions', progress: 0.05, action: 'rescue' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate acute-care, specialist, and nursing support while rescue continues. Reading pauses do not impose a clinical sequence or delay treatment until acknowledgment.', focus: 'actions', progress: 0.15, action: 'call-support' };
  if (patient.contextReviewedAtTick === null) return { id: 'context', narration: 'Review the paired pretreatment blood and urine specimens and thiazide exposure. Urine osmolality and sodium are not enough to establish SIAD in this context. Preserve the original sodium of 118 throughout the correction record.', focus: 'actions', progress: 0.25, action: 'review-context' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange serial sodium, urine-output, neurologic, and bedside surveillance. A sodium-only or neurologic-only check leaves the full paired assessment historical.', focus: 'actions', progress: 0.35, action: 'monitor' };
  if (!patient.initialResponseObserved) return patient.rescueDueInSeconds !== null
    ? { id: 'initial-observation', narration: 'Continue qualified rescue and assessment. This 60-minute contrast is authored, not a required clinical wait. New findings do not appear automatically; pause freely.', focus: 'monitor', progress: 0.42 }
    : { id: 'initial-reassessment', narration: 'Request a full sodium, symptom, and bedside assessment. Decide whether the patient improved rather than assuming that a sodium increase resolved the presentation.', focus: 'actions', progress: 0.50, action: 'reassess' };
  if (patient.additionalRescueAtTick === null) return { id: 'additional-rescue', narration: 'The requested assessment recorded the initial sodium rise with continuing symptoms. Arrange the selected qualified limited additional rescue while investigating other causes. This follows the selected Society for Endocrinology pathway, not a universal regional rule or dose prescription.', focus: 'actions', progress: 0.60, action: 'additional-rescue' };
  if (patient.neurologicReviewAtTick === null) return { id: 'neurology', narration: 'Arrange neurologic and alternate-cause evaluation. This option was available throughout; it is not gated by the sodium response and does not itself resolve confusion, headache, or nausea.', focus: 'actions', progress: 0.70, action: 'evaluate-neurology' };
  if (patient.additionalRescueDueInSeconds !== null) return { id: 'additional-observation', narration: 'Continue expert review and surveillance through the authored 30-minute contrast. Earlier findings remain historical; a treatment request or better number cannot prove symptom recovery.', focus: 'monitor', progress: 0.78 };
  if (!patient.additionalResponseObserved) return { id: 'additional-reassessment', narration: 'Request fresh sodium, symptom, and bedside findings together. Keep the original baseline and total observed rise in the record while reassessing persistent symptoms.', focus: 'actions', progress: 0.86, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand off ongoing symptoms, the correction record, treatment review, monitoring, and cause evaluation. The observed +6 mmol/L rise is not a clinical stopping rule; no automatic cessation or discharge is authorized.', focus: 'actions', progress: 0.95, action: 'handoff' };
}
