import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsAspirationRiskRecognition } from '../aspiration-risk-recognition';

/**
 * What this worked example reads.
 *
 * The sixteenth observed-state demonstration in the anaesthesia module, and the
 * second to read an assessment sidecar rather than physiology. Its beats read
 * ticks that are either null or not, which is the easy shape — nothing here can
 * go backwards the way a pressure or a twitch count can.
 */
export interface AspirationRiskProgress {
  readonly cuesReviewedAtTick: number | null;
  readonly classification: 'elevated' | 'routine' | null;
  readonly plan: 'defer-and-replan' | 'proceed-routine' | null;
}

export const ASPIRATION_RISK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAspirationRiskDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAspirationRiskRecognition(scenario);
}

export interface AspirationRiskDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const choose = (action: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'aspiration-risk-assessment', payload: { action } });

/**
 * The worked example for the fasting interval that is not the question.
 *
 * Read from the latest stage backwards, as the fifteen before it are, though a
 * recorded step never becomes unrecorded so none of these gates can reverse.
 *
 * It cancels nobody's operation, gives no drug, and predicts no outcome.
 */
export function aspirationRiskDemonstrationStep(
  patient?: AspirationRiskProgress,
): AspirationRiskDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.plan !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Deferred, with a reason recorded that belongs to this patient. The last objective is worth reading carefully, because it is the only one here that no single click earns: it asks whether the completed path tied the decision to an escalating dose and active symptoms rather than to the drug class. A learner who defers every GLP-1 user on principle would reach the same disposition and fail it. The argument runs the other way too — most patients on these drugs, at a stable dose and without symptoms, are not this patient, and a blanket rule would delay their operations for nothing. This ends the example, not the evaluation.' };
  }
  if (patient.classification !== null) {
    return { id: 'defer', focus: 'actions', progress: 0.8,
      dispatch: choose('defer-and-replan'),
      narration: 'Defer and replan, together with the patient and the surgeon. This is an elective list and the case can move, which is the fact that makes the decision easy here and would make it hard in an emergency — the same risk with no option to wait is a different problem with a different answer, and this lesson does not model that one.' };
  }
  if (patient.cuesReviewedAtTick !== null) {
    return { id: 'classify', focus: 'analysis', progress: 0.6,
      dispatch: choose('classify-elevated'),
      narration: 'Elevated risk. Not because of the drug, and not because of the fasting time, which is entirely ordinary — but because the dose was escalated recently and she has active gastrointestinal symptoms now. Those two together are what predict a stomach that has not emptied on the usual schedule, and either one alone would be a weaker argument.' };
  }
  return { id: 'review', focus: 'actions', progress: 0.3,
    dispatch: choose('review-cues'),
    narration: 'Review the cues together rather than one at a time, and the engine will not let you classify before you do. Medication phase, symptoms now, the fasting interval, and how urgent the operation is — the point of taking them together is that three of the four look reassuring in isolation. The fasting time is normal. It is not the question.' };
}
