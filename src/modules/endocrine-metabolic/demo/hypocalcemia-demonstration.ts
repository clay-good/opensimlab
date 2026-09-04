import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { HypocalcemiaSnapshot } from '@platform/kernel/protocol';
import { supportsHypocalcemia, type HypocalcemiaAction } from '../hypocalcemia';

export const HYPOCALCEMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHypocalcemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHypocalcemia(scenario);
}

export interface HypocalcemiaDemonstrationStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: HypocalcemiaAction;
  readonly finished?: boolean;
}

/** Accepted care and requested observations select each learner-paced decision. */
export function hypocalcemiaDemonstrationStep(patient?: HypocalcemiaSnapshot): HypocalcemiaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Continuing calcium care, magnesium review, and postoperative risk are handed off. This ends the example, not the illness. Open the debrief to review the decisions.'
    : 'Instructor takeover ended this branch. No patient outcome is predicted. Open the debrief or restart to rehearse the missed decision.', focus: 'actions', progress: 1, finished: true };
  if (patient.calciumAtTick === null) return { id: 'calcium-rescue', narration: 'Start qualified IV calcium rescue with ECG monitoring for this supplied symptomatic emergency. Do not wait for cause review, magnesium correction, or a support acknowledgment. No dose, infusion setting, or procedure is selected.', focus: 'actions', progress: 0.05, action: 'calcium-rescue' };
  if (patient.riskAssessedAtTick === null) return { id: 'risk', narration: 'Review airway, seizure, and postoperative neck concerns while rescue continues. The supplied airway is patent, but that does not remove the need for vigilance or qualified escalation if it changes. The supplied QTc is not a live waveform calculation.', focus: 'actions', progress: 0.15, action: 'assess-risk' };
  if (patient.causeReviewedAtTick === null) return { id: 'cause', narration: 'Open the supplied postoperative cause panel to inform continuing care. Review parathyroid hormone, magnesium, phosphate, and renal information while rescue continues. This is review of supplied evidence, not ordering or interpreting a new test.', focus: 'actions', progress: 0.25, action: 'review-cause' };
  if (patient.magnesiumAtTick === null) return { id: 'magnesium', narration: 'Arrange qualified magnesium correction after reviewing the supplied low result. Magnesium care proceeds alongside calcium and continuing treatment; calcium rescue did not need to wait. No replacement dose or normalized magnesium value is modeled.', focus: 'actions', progress: 0.35, action: 'magnesium' };
  if (patient.continuingCareAtTick === null) return { id: 'continuing-care', narration: 'Arrange qualified continuing calcium and cause-directed care. Relief of spasm is not sustained calcium control. This pathway can start independently of magnesium correction after cause review; no prescription is selected.', focus: 'actions', progress: 0.4, action: 'continuing-care' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate qualified endocrine, surgical, emergency, nursing, and monitoring support. These parallel priorities are shown one at a time. Rescue must not wait for the call to be acknowledged.', focus: 'actions', progress: 0.45, action: 'call-support' };
  if (patient.calciumDueInSeconds !== null) return { id: 'calcium-observation', narration: 'Continue ECG and frequent bedside monitoring. The authored 15-minute relief checkpoint is not treatment kinetics or a safe interval without reassessment. Never wait if the patient worsens. Pause freely; this phase sends no treatment.', focus: 'monitor', progress: 0.5 };
  if (!patient.calciumResponseObserved && patient.responseDueInSeconds !== null) return { id: 'calcium-reassessment', narration: 'Request a fresh calcium and bedside reassessment. Less spasm does not establish a normal calcium or remove airway and seizure risk. The laboratory value belongs to this requested observation, not a live monitor.', focus: 'actions', progress: 0.6, action: 'reassess' };
  if (patient.responseDueInSeconds !== null) return { id: 'continuing-observation', narration: 'Continue qualified care and frequent reassessment through the authored 1-hour complete-care checkpoint. This is a partial-support teaching contrast, not recovery or treatment kinetics. The earlier calcium stays historical; never wait if the person worsens.', focus: 'monitor', progress: 0.7 };
  if (!patient.responseObserved) return { id: 'continuing-reassessment', narration: 'Request a new calcium and bedside assessment after the complete-care checkpoint. An earlier observation cannot establish the current response. Review symptoms, airway and seizure concerns, ECG monitoring, and the ongoing treatment plan together.', focus: 'actions', progress: 0.85, action: 'reassess' };
  return { id: 'handoff', narration: 'Calcium remains low. Hand off serial calcium and magnesium review, continuing calcium and cause-directed care, ECG monitoring, and postoperative risk with clear ownership. Partial relief is not recovery or discharge clearance.', focus: 'actions', progress: 0.95, action: 'handoff' };
}
