import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsEmergenceWithResidualBlockade } from '../emergence-with-residual-blockade';

/**
 * What this worked example reads.
 *
 * The fifteenth observed-state demonstration in the anaesthesia module, and the
 * first with an assessment sidecar to read. Every earlier one had to gate on
 * physiology because these lessons carry no recorded steps; this lesson does,
 * so the beats read ticks that are either null or not — the shape every other
 * module in the catalog uses, arriving in anaesthesia for the first time.
 *
 * That makes the ordering trivial and the lesson hard, which is the right way
 * round: nothing here is a dial or a syringe, and the whole difficulty is
 * believing a number that disagrees with what your hand can feel.
 */
export interface EmergenceResidualBlockadeProgress {
  readonly monitorReviewedAtTick: number | null;
  readonly classification: 'residual' | 'recovered' | null;
  readonly plan: 'defer-extubation-and-support' | 'proceed-to-extubation' | null;
  readonly trainOfFourCount: number;
  readonly trainOfFourRatio: number;
}

export const EMERGENCE_RESIDUAL_BLOCKADE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsEmergenceResidualBlockadeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsEmergenceWithResidualBlockade(scenario);
}

export interface EmergenceResidualBlockadeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const choose = (action: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'emergence-residual-block-assessment', payload: { action } });

/**
 * The worked example for the number you have to believe.
 *
 * Read from the latest stage backwards, as the fourteen before it are, though
 * here that costs nothing: a recorded step never becomes unrecorded, so none of
 * these gates can go back the way a physiological one can.
 *
 * It extubates nobody, gives no drug, and predicts no outcome for anyone.
 */
export function emergenceResidualBlockadeDemonstrationStep(
  patient?: EmergenceResidualBlockadeProgress,
): EmergenceResidualBlockadeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.plan !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `Tube in, ventilation delivered, and the reason recorded. One thing this lesson is careful about, and it is the last objective rather than a footnote: a ratio at or above 0.9 would have been necessary for extubation and would not have been sufficient for it. Strength is one of several things that have to be true, alongside being awake, protecting an airway, oxygenating, and having somewhere to go — and a monitor that measures one of those cannot clear the other four. This example deferred; it did not declare the patient ready to be extubated later on the strength of a number. This ends the example, not the evaluation.` };
  }
  if (patient.classification !== null) {
    return { id: 'defer', focus: 'actions', progress: 0.8,
      dispatch: choose('defer-extubation-and-support'),
      narration: 'Keep the tube and keep ventilating. This is the plan that follows from the classification rather than a separate judgement — the value of having classified honestly a moment ago is that this choice now makes itself. Extubating a patient at 0.72 risks an airway they cannot protect and a respiratory response to hypoxia that is blunted at exactly this ratio.' };
  }
  if (patient.monitorReviewedAtTick !== null) {
    return { id: 'classify', focus: 'analysis', progress: 0.6,
      dispatch: choose('classify-residual'),
      narration: `Residual blockade, at a ratio of ${patient.trainOfFourRatio.toFixed(2)}. This is the hard beat and it is hard for a reason worth naming: everything except the number looks fine. Four twitches, no fade anyone could feel, and a patient who appears to be waking. Calling this residual means believing an instrument over an examination, which is the entire skill this lesson is teaching.` };
  }
  return { id: 'review', focus: 'actions', progress: 0.3,
    dispatch: choose('review-quantitative-monitor'),
    narration: `Read the quantitative monitor before deciding anything. The engine will not let you classify or plan before you do — and that order is the lesson rather than an interface rule. ${patient.trainOfFourCount} twitches with no detectable fade is what a qualitative assessment reports at any ratio above roughly 0.4, so the count you can see cannot distinguish a patient at 0.4 from one at 1.0. Only the ratio can.` };
}
