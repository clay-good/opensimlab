import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsHypothermiaAndRewarming } from '../hypothermia-and-rewarming';

/**
 * What this worked example reads.
 *
 * The thirty-third observed-state demonstration in the anaesthesia module, and
 * the ninth to open with a beat that deliberately does nothing: every bounded
 * thermal response is refused until the cooling course is running.
 *
 * All three gates are latched ticks, so none can walk backwards even though the
 * temperature they are about falls and then rises.
 */
export interface HypothermiaRewarmingProgress {
  readonly targetTemperatureC: number | null;
  readonly coreTemperatureConfirmedAtTick: number | null;
  readonly forcedAirWarmingAtTick: number | null;
  readonly warmedBulkFluidsAtTick: number | null;
  readonly coreTemperatureC: number;
}

export const HYPOTHERMIA_REWARMING_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHypothermiaRewarmingDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHypothermiaAndRewarming(scenario);
}

export interface HypothermiaRewarmingDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const thermal = (response: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'thermal-response', payload: { response } });

/**
 * The worked example for the two warming actions that are not equal.
 *
 * Read from the latest stage backwards, as the thirty-two before it are.
 *
 * It warms nobody and predicts no outcome for any person.
 */
export function hypothermiaRewarmingDemonstrationStep(
  patient?: HypothermiaRewarmingProgress,
): HypothermiaRewarmingDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.warmedBulkFluidsAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Both warming actions recorded and the temperature is climbing back through 36.5°C. Now the measurement this lesson is worth binding for, and it is about the two objectives you just earned. A run that confirms the temperature and warms ONLY the fluids scores that objective in full — and its temperature is identical to a patient nobody treated at all, tick for tick, bottoming out at 35.51°C and staying there. A run that confirms and starts ONLY the surface warming produces exactly the numbers you just watched, to the digit. So of the two warming objectives here, one carries the entire trajectory and the other moves the modelled temperature by nothing. That is not a reason to skip warmed fluids in a real theatre — the reason to warm them is the heat a cold litre takes out, which this bounded model does not represent — but it is a reason not to read the score as evidence that both interventions worked. One more thing the score cannot see: start the surface warming late and all four objectives are still met, while the temperature nadir falls from 36.36 to 35.83°C. This ends the example, not the evaluation.' };
  }
  if (patient.forcedAirWarmingAtTick !== null) {
    return { id: 'fluids', focus: 'actions', progress: 0.8,
      dispatch: thermal('record-warmed-bulk-fluids'),
      narration: 'Now record warming for the remaining bulk fluids. Be clear about what this is: an intent, recorded against a fixed 700 mL exposure, with no delivery and no thermal transfer modelled. It is the right habit and this simulator will not show you it working — watch the temperature after this and you will see it do nothing that the surface warming was not already doing.' };
  }
  if (patient.coreTemperatureConfirmedAtTick !== null) {
    return { id: 'surface', focus: 'actions', progress: 0.6,
      dispatch: thermal('start-forced-air-warming'),
      narration: 'Start active surface warming. This is the action that turns the trend around — in this model it is the whole of the rewarming trajectory — and starting it early is worth more than the score will tell you, because the fourth objective only asks whether 36.5°C was reached eventually, not how cold the patient got on the way.' };
  }
  if (patient.targetTemperatureC !== null) {
    return { id: 'confirm', focus: 'monitor', progress: 0.3,
      dispatch: thermal('confirm-core-temperature'),
      narration: 'Confirm the core temperature deliberately before warming anything. The engine enforces this: both warming responses are refused until a confirmation is on record. A drifting number on a screen and a confirmed core temperature are different objects, and only one of them is a reason to act.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'The cooling course has not started yet, and every bounded thermal response is refused until it does. Nothing to record. Watch the core temperature rather than the room — this patient loses heat slowly and continuously, which is exactly why it is easy to miss.' };
}
