import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { AdrenalCrisisSnapshot } from '@platform/kernel/protocol';
import { supportsAdrenalCrisis, type AdrenalCrisisAction } from '../adrenal-crisis';

export const ADRENAL_DEMONSTRATION_VERSION = '0.1.1';

export function supportsAdrenalDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.2' && supportsAdrenalCrisis(scenario);
}

export interface AdrenalDemonstrationStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: AdrenalCrisisAction;
  readonly finished?: boolean;
}

/** The accepted patient state chooses the next step, never a scripted treatment clock. */
export function adrenalDemonstrationStep(patient?: AdrenalCrisisSnapshot): AdrenalDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Ongoing treatment, monitoring, and prevention ownership are handed off. This ends the example, not the illness. Open the debrief to review the decisions.'
    : 'Instructor takeover ended this branch. No clinical outcome is predicted. Open the debrief or restart to rehearse the missed decision.', focus: 'actions', progress: 1, finished: true };
  if (patient.hydrocortisoneAtTick === null) return { id: 'steroid', narration: 'Known adrenal insufficiency, vomiting, and shock call for qualified parenteral hydrocortisone. Begin without waiting for cortisol or the full record. This example selects no dose.', focus: 'actions', progress: 0.1, action: 'hydrocortisone' };
  if (patient.salineAtTick === null) return { id: 'fluid', narration: 'Add qualified isotonic saline resuscitation with repeated assessment. Steroid replacement and circulatory support are complementary; neither replaces the other.', focus: 'actions', progress: 0.2, action: 'saline' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate qualified emergency, endocrine, nursing, and monitoring support. The example shows these parallel priorities one at a time; help is not a prerequisite for either urgent treatment.', focus: 'actions', progress: 0.3, action: 'call-support' };
  if (!patient.recordReviewed) return { id: 'record', narration: 'Review the interrupted-replacement record while treatment continues. Initial laboratory results remain initial; they do not update silently as circulation changes.', focus: 'actions', progress: 0.4, action: 'review-record' };
  if (patient.responseDueInSeconds !== null) return { id: 'observation', narration: 'Continue treatment and observation. The authored response takes simulated time; this is not a prediction of steroid or fluid kinetics. Pause freely to read. No new action is sent while this example waits.', focus: 'monitor', progress: 0.5 };
  if (!patient.responseObserved) return { id: 'reassess', narration: 'The authored response checkpoint has passed. Request a fresh bedside reassessment instead of assuming that treatment or a changed monitor proves recovery.', focus: 'actions', progress: 0.7, action: 'reassess' };
  if (!patient.preventionPlanned) return { id: 'prevention', narration: 'Carry steroid continuity, precipitant care, serial monitoring, emergency supplies, and education into the receiving team’s plan. Improvement does not establish discharge readiness.', focus: 'actions', progress: 0.8, action: 'prevention' };
  return { id: 'handoff', narration: 'Hand off active treatment and unresolved risk with clear ownership. The recorded plan does not prove recovery or emergency-injection competence.', focus: 'actions', progress: 0.9, action: 'handoff' };
}
