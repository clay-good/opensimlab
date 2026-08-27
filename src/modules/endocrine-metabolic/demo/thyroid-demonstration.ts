import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { ThyroidStormSnapshot } from '@platform/kernel/protocol';
import { supportsThyroidStorm, type ThyroidStormAction } from '../thyroid-storm';

export const THYROID_DEMONSTRATION_VERSION = '0.1.0';

export function supportsThyroidDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsThyroidStorm(scenario);
}

export interface ThyroidDemonstrationStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: ThyroidStormAction;
  readonly finished?: boolean;
}

/** Accepted decisions and observations choose the next checkpoint, never a scripted treatment clock. */
export function thyroidDemonstrationStep(patient?: ThyroidStormSnapshot): ThyroidDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Ongoing treatment, monitoring, and unresolved risk are handed off. This ends the example, not thyroid storm. Open the debrief to review the decisions.'
    : 'Instructor takeover ended this branch. No clinical outcome is predicted. Open the debrief or restart to rehearse the missed decision.', focus: 'actions', progress: 1, finished: true };
  if (patient.synthesisAtTick === null) return { id: 'synthesis', narration: 'Begin the qualified thionamide synthesis-blockade pathway for this suspected-storm presentation. Confirmatory laboratories and the full assessment must not delay urgent treatment. No drug or dose is selected here.', focus: 'actions', progress: 0.05, action: 'synthesis-blockade' };
  if (patient.supportiveCareAtTick === null) return { id: 'supportive-care', narration: 'Begin qualified glucocorticoid, cooling, oxygenation, individualized circulatory support, and precipitant care alongside thyroid-directed treatment. These priorities do not wait for the iodine interval.', focus: 'actions', progress: 0.1, action: 'supportive-care' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate qualified emergency, endocrine, critical-care, nursing, and monitoring support. The example shows parallel priorities one at a time; support acknowledgment is not a prerequisite for urgent care.', focus: 'actions', progress: 0.15, action: 'call-support' };
  if (patient.circulationAssessedAtTick === null) return { id: 'circulation', narration: 'Assess circulation, perfusion, and possible congestion before an individualized rate-control decision. Heart rate alone cannot establish which treatment the person can tolerate.', focus: 'actions', progress: 0.2, action: 'assess-circulation' };
  if (patient.rateControlReviewedAtTick === null) return { id: 'rate-control-review', narration: 'The opened circulation assessment shows congestion and poor perfusion. Ask the qualified team to individualize rate control with cardiac assessment and close monitoring. This review gives no beta blocker automatically and guarantees no agent is safe.', focus: 'actions', progress: 0.3, action: 'rate-control-review' };
  if (patient.iodineAtTick === null) {
    if (patient.observation === null) return { id: 'early-reassessment', narration: 'Reassess the person while urgent care continues. A current bedside observation is useful now; the iodine sequence is not a reason to leave the patient unobserved.', focus: 'actions', progress: 0.4, action: 'reassess' };
    if (patient.iodineDueInSeconds !== 0) return { id: 'iodine-observation', narration: 'Continue qualified care and monitoring. This selected US ATA-based pathway requires at least 1 hour after synthesis blockade before iodine; some specialist pathways differ. The interval is source-derived, not an untreated waiting period. Pause whenever you need to read.', focus: 'monitor', progress: 0.45 };
    return { id: 'iodine', narration: 'The accepted synthesis-blockade start now meets the selected pathway’s minimum 1-hour interval. Request qualified iodine treatment while ongoing support and monitoring continue. No dose or delivery technique is simulated.', focus: 'actions', progress: 0.6, action: 'iodine' };
  }
  if (patient.responseDueInSeconds !== null) return { id: 'partial-support-observation', narration: 'Continue treatment and monitoring through the authored 2-hour complete-care checkpoint. It represents an early partial-support contrast, not expected hormone kinetics or clinical recovery. The earlier observation stays historical. Pause freely; no further action is sent during this waiting phase.', focus: 'monitor', progress: 0.7 };
  if (!patient.responseObserved) return { id: 'post-treatment-reassessment', narration: 'The authored partial-support checkpoint has passed. Request a fresh bedside reassessment; a changed monitor or a past observation does not prove thyroid storm has resolved.', focus: 'actions', progress: 0.85, action: 'reassess' };
  return { id: 'handoff', narration: 'The new observation still shows fever, tachycardia, and ongoing illness. Hand off active treatment, cardiac and hemodynamic review, serial monitoring, and precipitant care. Improvement is not discharge clearance or proof of beta-blocker safety.', focus: 'actions', progress: 0.95, action: 'handoff' };
}
