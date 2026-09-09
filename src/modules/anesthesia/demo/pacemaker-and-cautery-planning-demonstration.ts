import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsPacemakerAndCauteryPlanning } from '../pacemaker-and-cautery-planning';

/**
 * What this worked example reads.
 *
 * The twentieth observed-state demonstration in the anaesthesia module and the
 * sixth to read an assessment sidecar. The plan field is a string rather than a
 * tick, and the example gates on it being recorded at all rather than on which
 * plan it holds — because a plan cannot be replaced once written, and a beat
 * that waited for the right one would never fire after a wrong one.
 */
export interface PacemakerAndCauteryPlanningProgress {
  readonly deviceRecordReviewedAtTick: number | null;
  readonly procedureRiskReviewedAtTick: number | null;
  readonly plan: string | null;
  readonly planAtTick: number | null;
  readonly backupAndRestorationDocumentedAtTick: number | null;
}

export const PACEMAKER_AND_CAUTERY_PLANNING_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPacemakerAndCauteryPlanningDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPacemakerAndCauteryPlanning(scenario);
}

export interface PacemakerAndCauteryPlanningDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const step = (action: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'cied-planning-assessment', payload: { action } });

/**
 * The worked example for the plan you only get to make once.
 *
 * Read from the latest stage backwards, as the nineteen before it are. None of
 * these gates can reverse: a review stays reviewed and a plan, once recorded,
 * stays the plan that was recorded.
 *
 * It programs nobody's device and predicts no outcome for anyone.
 */
export function pacemakerAndCauteryPlanningDemonstrationStep(
  patient?: PacemakerAndCauteryPlanningProgress,
): PacemakerAndCauteryPlanningDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.backupAndRestorationDocumentedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The plan is complete. Two things about this lesson are worth carrying away and neither is the plan itself. The first is that the magnet shortcut costs two objectives rather than one: a run that does both reviews properly, reaches for the magnet, and then documents backup and restoration exactly as you just watched is scored met, met, not met, NOT met — the documentation was genuinely done and is not credited, because what it followed was not a coordinated plan. The second is that the engine records one plan per attempt. Recognising the shortcut afterwards and choosing correctly is refused, and the debrief still reads the first answer. That is unlike most refusals in this module, which cost nothing once heeded. One honest limit: nothing here programs a device, applies a magnet, or models electrosurgery, and the record and procedure are fixed vignette facts rather than an interrogation. This ends the example, not the evaluation.' };
  }
  if (patient.plan !== null) {
    return { id: 'document', focus: 'analysis', progress: 0.85,
      dispatch: step('document-backup-and-restoration'),
      narration: 'Now document the backup and the restoration together: external pacing and defibrillation available, continuous monitoring, and — the half that gets left off — explicit restoration of the preprocedure settings before this patient leaves monitored care. A device left asynchronous is a plan that was never finished rather than a plan that worked.' };
  }
  if (patient.procedureRiskReviewedAtTick !== null) {
    return { id: 'plan', focus: 'actions', progress: 0.65,
      dispatch: step('coordinate-asynchronous-pacing'),
      narration: 'Now the plan, and coordinate asynchronous pacing with the team that owns the device. The reasoning is the two things just read placed side by side: this patient is pacing dependent, and the interference is above the umbilicus. What makes this the answer rather than the magnet is that the record documents a magnet response for this device — documentation is not a universal rule, and reaching for a magnet on the strength of one is the shortcut this lesson exists to name. Choose carefully: this attempt records one plan.' };
  }
  if (patient.deviceRecordReviewedAtTick !== null) {
    return { id: 'procedure', focus: 'analysis', progress: 0.45,
      dispatch: step('review-procedure-emi'),
      narration: 'Now read the procedure against the device rather than on its own. Right shoulder surgery with monopolar electrosurgery puts the current path and the generator in the same region, which is what turns anticipated interference into a question about this patient. The same operation below the umbilicus is a different question, and neither review answers it alone.' };
  }
  return { id: 'device', focus: 'analysis', progress: 0.2,
    dispatch: step('review-device-record'),
    narration: 'Start with the device record, before anything about the operation. Type, indication, whether the patient is pacing dependent, whether recent function was normal, and what magnet response is documented for this specific device. Pacing dependence is the fact that changes every decision after it, and it is not something to discover once the drapes are on.' };
}
