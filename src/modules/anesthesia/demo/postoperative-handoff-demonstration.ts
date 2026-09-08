import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsPostoperativeHandoff } from '../postoperative-handoff';

/**
 * What this worked example reads.
 *
 * The nineteenth observed-state demonstration in the anaesthesia module, the
 * fifth to read an assessment sidecar, and the longest at six beats. It is also
 * the only one in the module demonstrating a conversation rather than a
 * treatment, which changes what the beats can honestly claim: the model records
 * that content blocks were shared, not that anyone understood them.
 */
export interface PostoperativeHandoffProgress {
  readonly receiverReadyAtTick: number | null;
  readonly patientAndCourseAtTick: number | null;
  readonly currentStateAtTick: number | null;
  readonly risksActionsOwnershipAtTick: number | null;
  readonly receiverReadbackAtTick: number | null;
  readonly transferAcceptedAtTick: number | null;
}

export const POSTOPERATIVE_HANDOFF_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPostoperativeHandoffDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPostoperativeHandoff(scenario);
}

export interface PostoperativeHandoffDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const step = (action: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'postoperative-handoff-assessment', payload: { action } });

/**
 * The worked example for the handoff that is not finished when you stop talking.
 *
 * Read from the latest stage backwards, as the eighteen before it are, though a
 * recorded step never becomes unrecorded so none of these gates can reverse.
 *
 * It hands over nobody's real patient and predicts no outcome for anyone.
 */
export function postoperativeHandoffDemonstrationStep(
  patient?: PostoperativeHandoffProgress,
): PostoperativeHandoffDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.transferAcceptedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Accepted, and responsibility has moved. The step worth arguing about is the read-back, because it is the one that feels redundant when you have just said everything clearly — and it is the one the engine refuses to proceed without. A run that shares every content block and then reaches straight for acceptance has the acceptance declined and keeps the patient: three of the four objectives met, and nothing actually transferred. One honest limit on what you have watched: this model records that content blocks were shared and that a synthesis was given. It cannot record that anyone understood anything, and a handoff that satisfies every step here can still be a bad one. This ends the example, not the evaluation.' };
  }
  if (patient.receiverReadbackAtTick !== null) {
    return { id: 'accept', focus: 'actions', progress: 0.92,
      dispatch: step('accept-transfer'),
      narration: 'Now accept the transfer. This is the moment responsibility changes hands, and it is a separate act from having finished speaking — which is exactly why it is a separate step here rather than something that happens implicitly when the conversation ends.' };
  }
  if (patient.risksActionsOwnershipAtTick !== null) {
    return { id: 'readback', focus: 'analysis', progress: 0.8,
      dispatch: step('receiver-readback'),
      narration: 'Ask for the read-back before anything is accepted. This is the step that turns a monologue into a handoff: silent receipt is not the same as understanding, and the only evidence available that the information arrived is hearing it come back. The engine will refuse an acceptance without it.' };
  }
  if (patient.currentStateAtTick !== null) {
    return { id: 'risks', focus: 'analysis', progress: 0.65,
      dispatch: step('share-risks-actions-ownership'),
      narration: 'Then the part that is easiest to leave implicit: what is still unresolved, what needs doing, by when, by whom, and who to call. An unresolved risk with no name attached to it is not handed over — it is abandoned politely.' };
  }
  if (patient.patientAndCourseAtTick !== null) {
    return { id: 'current-state', focus: 'analysis', progress: 0.5,
      dispatch: step('share-current-state'),
      narration: 'Current state as a separate block from the history. These are two different things and the objective asks for both distinctly, because a receiver who has heard a narrative of the operation still does not know what they are looking at now.' };
  }
  if (patient.receiverReadyAtTick !== null) {
    return { id: 'course', focus: 'analysis', progress: 0.35,
      dispatch: step('share-patient-and-course'),
      narration: 'The patient and the perioperative course. Structure is doing the work here rather than completeness: the same facts in an unordered stream are demonstrably harder to retain, which is the whole reason handoff protocols exist.' };
  }
  return { id: 'readiness', focus: 'actions', progress: 0.15,
    dispatch: step('confirm-receiver-readiness'),
    narration: 'Confirm the receiver is ready before saying anything worth hearing. Who they are, whether the monitoring is up, whether they are actually attending, and whether they will get a chance to ask. Beginning a handoff into a room that is not listening is the commonest way for all of the following steps to be done correctly and none of them to work.' };
}
