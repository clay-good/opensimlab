import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { AvpDeficiencySnapshot } from '@platform/kernel/protocol';
import { supportsAvpDeficiency, type AvpDeficiencyAction } from '../avp-deficiency';

export const AVP_DEFICIENCY_DEMONSTRATION_VERSION = '0.1.1';
export function supportsAvpDeficiencyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsAvpDeficiency(scenario);
}
export interface AvpDeficiencyDemonstrationStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: AvpDeficiencyAction;
  readonly finished?: boolean;
}

/** The example observes before continuing care to teach the contrast, not to impose a clinical gate. */
export function avpDeficiencyDemonstrationStep(patient?: AvpDeficiencySnapshot): AvpDeficiencyDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Continuing water balance, prescribed medication, and surveillance are handed off. The original sodium and observed peak stay in the record. This ends the example, not the illness. Open the debrief to review the decisions.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse a different response.', focus: 'actions', progress: 1, finished: true };
  if (patient.volumeAtTick === null) return { id: 'volume', narration: 'Start qualified volume restoration for the supplied low blood pressure and circulatory compromise. Fluid-first care does not wait for context review, support acknowledgment, or a laboratory request. Low initial urine output does not exclude the supplied AVP deficiency. No dose or rate is selected.', focus: 'actions', progress: 0.05, action: 'restore-volume' };
  if (patient.contextReviewedAtTick === null) return { id: 'context', narration: 'Review the known AVP deficiency, omitted prescribed desmopressin, restricted drinking access, and supplied electrolytes while volume care continues. Unknown hypernatremia duration is not assumed to be acute sodium loading. This is not a new diagnosis or a fluid-deficit calculation.', focus: 'actions', progress: 0.15, action: 'review-context' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate qualified endocrine, nursing, and monitored-care ownership. Medication reconciliation and access to water are continuing responsibilities. These parallel tasks appear one at a time; urgent care must not await acknowledgment.', focus: 'actions', progress: 0.25, action: 'call-support' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange serial sodium, urine, fluid-balance, and neurologic surveillance. Track water replacement and antidiuresis together; a better pressure or less urine alone cannot establish correction.', focus: 'actions', progress: 0.35, action: 'monitor' };
  if (!patient.circulationRestored) return { id: 'volume-observation', narration: 'Continue close circulation and bedside assessment during volume care. The 15-minute contrast is authored, not a required clinical waiting period or predicted fluid response. Reassess whenever needed. Pause freely; this phase sends no treatment.', focus: 'monitor', progress: 0.4 };
  if (!patient.volumeObserved) return { id: 'volume-reassessment', narration: 'Request fresh sodium, urine-output, and urine-concentration findings alongside bedside reassessment. This example observes the changing pattern first to make it visible; the new laboratory click is not a prerequisite for qualified water or prescribed desmopressin care once circulation is restored.', focus: 'actions', progress: 0.5, action: 'reassess' };
  if (patient.waterAtTick === null) return { id: 'water', narration: 'Arrange tailored water replacement after circulation has improved. It addresses a different problem from volume rescue or desmopressin. Water and qualified medication requests can proceed in either order without another laboratory or administrative gate. No volume, rate, or deficit calculation is selected.', focus: 'actions', progress: 0.6, action: 'replace-water' };
  if (patient.desmopressinAtTick === null) return { id: 'desmopressin', narration: 'Restore qualified desmopressin care for the known AVP deficiency, with assessment and ongoing monitoring. The medication request does not need to wait for a water request or a new laboratory click. Less urine alone will not establish replacement of the water deficit. No dose, route, or automatic redosing is selected.', focus: 'actions', progress: 0.65, action: 'restore-desmopressin' };
  if (patient.responseDueInSeconds !== null) return { id: 'response-observation', narration: 'Continue tailored water and medication care with frequent reassessment. The two-hour combined-care checkpoint is authored, not predicted drug kinetics or a safe interval without checks. Earlier sodium and urine results remain historical.', focus: 'monitor', progress: 0.75 };
  if (!patient.responseObserved) return { id: 'response-reassessment', narration: 'Request a fresh sodium, urine, and bedside assessment. Neither accepted requests nor elapsed time prove response. Review the original sodium, observed peak, circulation, and continuing fluid-balance risks together.', focus: 'actions', progress: 0.85, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand off continuing water balance, sodium and urine surveillance, neurologic review, drinking access, medication reconciliation, and prescribed desmopressin ownership. Partial improvement is not sodium normalization, recovery, or discharge clearance.', focus: 'actions', progress: 0.95, action: 'handoff' };
}
