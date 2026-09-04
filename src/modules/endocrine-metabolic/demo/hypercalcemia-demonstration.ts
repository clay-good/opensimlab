import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { HypercalcemiaSnapshot } from '@platform/kernel/protocol';
import { supportsHypercalcemia, type HypercalcemiaAction } from '../hypercalcemia';

export const HYPERCALCEMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHypercalcemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHypercalcemia(scenario);
}

export interface HypercalcemiaDemonstrationStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: HypercalcemiaAction;
  readonly finished?: boolean;
}

/** Observe accepted decisions, never dispatch on a wall-clock schedule. */
export function hypercalcemiaDemonstrationStep(patient?: HypercalcemiaSnapshot): HypercalcemiaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Ongoing calcium treatment, fluid monitoring, and cancer care are handed off. This ends the example, not the illness. Open the debrief to review the decisions.'
    : 'Instructor takeover ended this branch. No clinical outcome is predicted. Open the debrief or restart to rehearse the missed decision.', focus: 'actions', progress: 1, finished: true };
  if (patient.fluidsAtTick === null) return { id: 'hydration', narration: 'Start qualified, tailored hydration for dehydration. This includes immediate bedside volume and cardiac assessment because heart failure and kidney disease limit fluid tolerance. No fluid volume or rate is selected.', focus: 'actions', progress: 0.05, action: 'tailored-fluids' };
  if (patient.calcitoninAtTick === null) return { id: 'calcitonin', narration: 'Start the qualified calcitonin bridge while arranging longer-acting care. It need not wait for hydration to finish or the separate cardiorenal review. This is a short bridge, not definitive treatment.', focus: 'actions', progress: 0.15, action: 'calcitonin' };
  if (patient.cardiorenalAssessedAtTick === null) return { id: 'cardiorenal-review', narration: 'Review the supplied HFpEF, CKD stage 3b, and creatinine above baseline. This informs ongoing fluid tolerance and qualified antiresorptive selection. Urgent hydration and calcitonin are already underway.', focus: 'actions', progress: 0.25, action: 'assess-cardiorenal' };
  if (patient.antiresorptiveAtTick === null) return { id: 'antiresorptive', narration: 'Start the qualified antiresorptive pathway after renal-risk review. It addresses calcium release from bone but does not work immediately. Do not wait for hydration to finish; agent and dose selection are outside this lesson.', focus: 'actions', progress: 0.35, action: 'antiresorptive' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate qualified emergency, endocrine, oncology, nursing, and monitoring support. These are parallel priorities shown one at a time; calling help is not a prerequisite for urgent treatment.', focus: 'actions', progress: 0.4, action: 'call-support' };
  if (patient.fluidDueInSeconds !== null) return { id: 'fluid-observation', narration: 'Continue frequent bedside checks during hydration. The authored 15-minute checkpoint shows a circulation contrast, not a predicted response or a safe interval without monitoring. Never wait if the person worsens. Pause or take the controls at any time.', focus: 'monitor', progress: 0.45 };
  if (!patient.fluidResponseObserved) return { id: 'fluid-reassessment', narration: 'Request a fresh calcium and bedside assessment, including fluid tolerance. Better circulation does not prove calcium correction. These values become an explicitly requested observation, not a live laboratory feed.', focus: 'actions', progress: 0.55, action: 'reassess' };
  if (patient.bridgeDueInSeconds !== null) return { id: 'bridge-observation', narration: 'Continue care and frequent monitoring. The authored 4-hour calcitonin checkpoint is a partial teaching contrast, not treatment kinetics or an antiresorptive response. It takes about 4 minutes at 60× from bridge initiation. Never wait if the person worsens; pause or take the controls freely.', focus: 'monitor', progress: 0.65 };
  if (!patient.bridgeResponseObserved) return { id: 'bridge-reassessment', narration: 'Request a new calcium and bedside assessment after the authored bridge checkpoint. The earlier result remains historical until you assess again. Review calcium, mental status, circulation, breathing, and fluid tolerance together.', focus: 'actions', progress: 0.8, action: 'reassess' };
  return { id: 'handoff', narration: 'Calcium is still high; partial improvement is not recovery. Hand off serial calcium, renal function, fluid balance, the short calcitonin bridge, longer-acting treatment, and cancer care with clear ownership. This is not discharge clearance.', focus: 'actions', progress: 0.95, action: 'handoff' };
}
