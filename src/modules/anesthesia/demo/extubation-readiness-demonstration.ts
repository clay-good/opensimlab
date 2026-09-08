import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsExtubationReadiness } from '../extubation-readiness';

/**
 * What this worked example reads.
 *
 * The eighteenth observed-state demonstration in the anaesthesia module and the
 * fourth to read an assessment sidecar: five beats, each gated on the previous
 * step's tick being recorded.
 */
export interface ExtubationReadinessProgress {
  readonly quantitativeRecoveryReviewedAtTick: number | null;
  readonly awakeAirwayReviewedAtTick: number | null;
  readonly gasExchangeReviewedAtTick: number | null;
  readonly airwayPlanReviewedAtTick: number | null;
  readonly decision: 'ready-for-planned-awake-extubation' | 'continue-support-and-reassess' | null;
  readonly trainOfFourRatio: number;
}

export const EXTUBATION_READINESS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsExtubationReadinessDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsExtubationReadiness(scenario);
}

export interface ExtubationReadinessDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const choose = (action: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'extubation-readiness-assessment', payload: { action } });

/**
 * The worked example for the decision that caution gets wrong.
 *
 * Read from the latest stage backwards, as the seventeen before it are, though
 * a recorded step never becomes unrecorded so none of these gates can reverse.
 *
 * It removes nobody's tube — the lesson stops at the decision — and predicts no
 * outcome for anyone.
 */
export function extubationReadinessDemonstrationStep(
  patient?: ExtubationReadinessProgress,
): ExtubationReadinessDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.decision !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Ready, recorded, and no tube removed — this lesson stops at the decision, because the decision is the part that is assessable. Worth holding this next to the residual-blockade lesson, which runs the same four reviews on a patient whose ratio is 0.72. There, deferring is right. Here, at 0.93 with an awake patient protecting an airway, breathing adequately, and a rescue plan in place, continuing to support is the error — and it scores four of these five objectives, because the four reviews were done correctly and only the decision was wrong. Caution is not a free action. The sequence does not tell you which patient you have; the checkpoints do. This ends the example, not the evaluation.' };
  }
  if (patient.airwayPlanReviewedAtTick !== null) {
    return { id: 'decide', focus: 'actions', progress: 0.9,
      dispatch: choose('ready-for-planned-awake-extubation'),
      narration: 'Ready for a planned awake extubation. Every checkpoint is satisfied and none of them alone would have been enough — that is what "integrate" means in the last objective, and it is why the decision is a separate step rather than a consequence of the fourth review.' };
  }
  if (patient.gasExchangeReviewedAtTick !== null) {
    return { id: 'plan', focus: 'analysis', progress: 0.75,
      dispatch: choose('review-airway-risk-and-rescue'),
      narration: 'Then the part that is about the room rather than the patient: has the airway changed, and if this goes wrong, who and what is available. A rescue plan is not a formality when everything looks fine — it is cheapest to make exactly then, and it is the review most likely to be skipped in a patient who is clearly ready.' };
  }
  if (patient.awakeAirwayReviewedAtTick !== null) {
    return { id: 'gas-exchange', focus: 'analysis', progress: 0.6,
      dispatch: choose('review-spontaneous-gas-exchange'),
      narration: 'Now the breathing: rate, tidal volume, end-tidal carbon dioxide, oxygenation. Strength and wakefulness do not establish that he is ventilating adequately on his own, and this is a separate question with a separate answer.' };
    }
  if (patient.quantitativeRecoveryReviewedAtTick !== null) {
    return { id: 'awake-airway', focus: 'analysis', progress: 0.45,
      dispatch: choose('review-awake-airway-protection'),
      narration: 'Awake response and airway protection next: sustained eye opening, following commands, an effective cough, clearing secretions. This is the half of readiness the monitor cannot measure, and the reason the ratio was necessary and not sufficient.' };
  }
  return { id: 'quantitative', focus: 'actions', progress: 0.25,
    dispatch: choose('review-quantitative-recovery'),
    narration: `Start with the number, and keep it as one input rather than the answer. The train-of-four ratio is ${patient.trainOfFourRatio.toFixed(2)}, which clears the threshold — and clearing it establishes that residual blockade is not the reason to wait, not that there is no reason to wait. Three more reviews decide that.` };
}
