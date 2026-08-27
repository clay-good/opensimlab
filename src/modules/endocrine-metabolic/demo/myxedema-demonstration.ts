import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { MyxedemaSnapshot } from '@platform/kernel/protocol';
import { supportsMyxedema, type MyxedemaAction } from '../myxedema';

export const MYXEDEMA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMyxedemaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsMyxedema(scenario);
}

export interface MyxedemaDemonstrationStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: MyxedemaAction;
  readonly finished?: boolean;
}

/** Accepted care and fresh observations determine each learner-paced decision. */
export function myxedemaDemonstrationStep(patient?: MyxedemaSnapshot): MyxedemaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Ongoing ventilation, endocrine treatment, and unresolved risk are handed off. This ends the example, not the illness. Open the debrief to review the decisions.'
    : 'Instructor takeover ended this branch. No clinical outcome is predicted. Open the debrief or restart to rehearse the missed decision.', focus: 'actions', progress: 1, finished: true };
  if (patient.ventilationAtTick === null) return { id: 'ventilation', narration: 'Start qualified breathing support for slow, inadequate ventilation. Oxygen saturation alone does not reveal carbon-dioxide retention. This is a coordination decision, not an airway technique lesson.', focus: 'actions', progress: 0.05, action: 'ventilate' };
  if (patient.hydrocortisoneAtTick === null) return { id: 'steroid', narration: 'Give qualified empiric hydrocortisone coverage before thyroid replacement. Adrenal insufficiency may coexist with severe hypothyroidism; do not wait for confirmatory tests. No dose is selected.', focus: 'actions', progress: 0.15, action: 'hydrocortisone' };
  if (patient.levothyroxineAtTick === null) return { id: 'thyroxine', narration: 'Steroid coverage is accepted. Start the qualified IV levothyroxine pathway now, with no additional timed wait or score gate. This lesson does not choose a dose or T3 treatment.', focus: 'actions', progress: 0.25, action: 'levothyroxine' };
  if (patient.supportiveCareAtTick === null) return { id: 'supportive-care', narration: 'Begin individualized circulation and temperature management, metabolic review, and precipitant care. A low temperature does not make rapid rewarming the default; no warming procedure is simulated.', focus: 'actions', progress: 0.35, action: 'supportive-care' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate qualified emergency, endocrine, critical-care, nursing, and monitoring support. These are parallel priorities shown one at a time; help is not a prerequisite for urgent care.', focus: 'actions', progress: 0.4, action: 'call-support' };
  if (patient.ventilationDueInSeconds !== null) return { id: 'ventilation-observation', narration: 'Qualified ventilation and frequent observation continue. The authored 5-minute respiratory-support contrast is not a clinical response prediction. Never wait for this checkpoint if the person worsens. Pause freely; this waiting phase sends no new action.', focus: 'monitor', progress: 0.45 };
  if (!patient.respiratorySupportObserved) return { id: 'respiratory-reassessment', narration: 'Request a fresh bedside and blood-gas reassessment of breathing support. Review carbon dioxide as well as oxygen saturation; an accepted ventilation request is not proof of its effect or independent breathing.', focus: 'actions', progress: 0.55, action: 'reassess' };
  if (patient.responseDueInSeconds !== null) return { id: 'partial-support-observation', narration: 'Continue qualified care and frequent reassessment. The authored 1-hour complete-care checkpoint represents partial support, not thyroid-hormone kinetics or recovery. The earlier observation stays historical. Never wait if the person worsens; pause whenever you need to read.', focus: 'monitor', progress: 0.65 };
  if (!patient.responseObserved) return { id: 'post-treatment-reassessment', narration: 'The authored partial-support checkpoint has passed. Obtain a fresh whole-person assessment of breathing, circulation, temperature, and alertness. The earlier respiratory observation cannot establish the current response.', focus: 'actions', progress: 0.8, action: 'reassess' };
  return { id: 'handoff', narration: 'The person remains cold, drowsy, and support-dependent. Hand off ventilation, ongoing endocrine treatment, serial monitoring, and precipitant care. Partial improvement is not recovery or discharge clearance.', focus: 'actions', progress: 0.95, action: 'handoff' };
}
