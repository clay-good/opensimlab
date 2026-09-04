import type { Scenario } from '@anesthesia/scenarios/types';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsObstructivePleuralShock, OBSTRUCTIVE_PLEURAL_SHOCK_DISPATCHES as DISPATCH,
  type ObstructivePleuralShockProgress,
} from '../obstructive-shock-tension-pneumothorax';
import { obstructivePleuralShockInlinePrompt } from '../tutor/obstructive-shock-tension-pneumothorax-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ObstructivePleuralShockProgress): string {
  const prompt = obstructivePleuralShockInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const OBSTRUCTIVE_PLEURAL_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsObstructivePleuralShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsObstructivePleuralShock(scenario);
}

export interface ObstructivePleuralShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  /**
   * Unlike every other lesson here, each beat carries its own whole dispatch,
   * because the four steps go through four different engine action types.
   */
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for a lesson scored on a clock.
 *
 * Four beats, none of them gated against another by the engine — the order
 * below is a defensible one rather than an enforced one, and the example says
 * so. It examines nobody, delivers no oxygen, calls nobody, performs no
 * decompression, images nothing, and predicts no outcome.
 */
export function obstructivePleuralShockDemonstrationStep(
  patient?: ObstructivePleuralShockProgress,
): ObstructivePleuralShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.decompressedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Nothing in this example was refused for being out of order, because the engine gates none of these four against another — and that is exactly what makes it different from every other lab in this module. What it grades is the interval: the assessment and the call at thirty seconds from the event, the oxygen inside a minute, the needle inside a minute. A run that does all four correctly and reaches the chest at two minutes scores worse than this one, and the patient is the reason rather than the rubric. Nothing here was examined, delivered, called, imaged or decompressed, the recovery that follows is a bounded teaching trajectory rather than a prognosis, and no technique, equipment or complication is simulated. This ends the example, not the evaluation.' };
  }
  if (patient.assessedAtTick === null) {
    return { id: 'assess', focus: 'monitor', progress: 0.15,
      dispatch: DISPATCH.assess, narration: narrate(patient) };
  }
  if (patient.helpRequestedAtTick === null) {
    return { id: 'help', focus: 'actions', progress: 0.4,
      dispatch: DISPATCH.help, narration: narrate(patient) };
  }
  if (!patient.highConcentrationOxygen) {
    return { id: 'oxygen', focus: 'actions', progress: 0.65,
      dispatch: DISPATCH.oxygen, narration: narrate(patient) };
  }
  return { id: 'decompress', focus: 'actions', progress: 0.88,
    dispatch: DISPATCH.decompress, narration: narrate(patient) };
}
