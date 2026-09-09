import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsRoutinePediatricInhalationalInduction } from '../routine-pediatric-inhalational-induction';

/**
 * What this worked example reads.
 *
 * The thirty-eighth and last observed-state demonstration in the anaesthesia
 * module. Its gates are the fresh-gas flow, the vaporizer setting and the
 * recorded end-tidal concentration -- and the reduce beat fires on the end-tidal
 * value rather than on a tick, because the objective it serves is measured from
 * the moment of reduction and reducing before the wash-in target would not count
 * at all.
 */
export interface PediatricInhalationalInductionProgress {
  readonly inspiredOxygenFraction: number;
  readonly freshGasFlowLPerMin: number;
  readonly sevofluranePercent: number;
  readonly endTidalSevofluranePercent: number;
  readonly ventilatorDelivering: boolean;
}

export const PEDIATRIC_INHALATIONAL_INDUCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricInhalationalInductionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsRoutinePediatricInhalationalInduction(scenario);
}

export interface PediatricInhalationalInductionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/** Eight tenths of the age-adjusted MAC this lesson washes in through. */
const WASH_IN_TARGET_PERCENT = 2;

/**
 * The worked example for the vaporizer that must come down on time.
 *
 * Read from the latest stage backwards, as the thirty-seven before it are.
 *
 * It anaesthetises no child and predicts no outcome for one.
 */
export function pediatricInhalationalInductionDemonstrationStep(
  patient?: PediatricInhalationalInductionProgress,
): PediatricInhalationalInductionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.sevofluranePercent > 0 && patient.sevofluranePercent <= 3) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Turned down to 2%, and the next sixty seconds hold a depth of 49 with a pressure of 60 mmHg. The comparison worth carrying away is about WHEN that reduction happened, not whether it did. A run that leaves 6% running and comes back to turn it down at tick 1,800 ends this case at a depth of 49 and a pressure of 60 — the same settled numbers you are looking at now — and still scores the third objective only partly met. The sixty seconds the objective reads are the sixty immediately after the reduction, and at that moment that child was still far too deep. Finishing in the right place is not the same as having got there safely, and this rubric is built to tell those apart. A run that never reduces at all sits at a depth of 16 and a mean arterial pressure of 34 for the rest of the case. One more thing about the first objective: it wants the oxygen and the flow up with the vaporizer still OFF, and turning the vaporizer on as part of the same setup loses it outright — the preparation is then recorded as the machine defaults, 21% oxygen at 2 L/min. This ends the example, not the evaluation.' };
  }
  if (patient.endTidalSevofluranePercent >= WASH_IN_TARGET_PERCENT) {
    return { id: 'reduce', focus: 'actions', progress: 0.8,
      dispatch: { type: 'ventilator', payload: { sevofluranePercent: 2 } },
      narration: 'The end-tidal concentration has reached the wash-in target, so turn the vaporizer down to 2% now. Now rather than in a minute: the objective measures the sixty seconds that follow this action, so a reduction made late is scored against a child who is still too deep, however well the case ends afterwards.' };
  }
  if (patient.freshGasFlowLPerMin >= 6 && patient.inspiredOxygenFraction >= 0.95) {
    return { id: 'wash-in', focus: 'actions', progress: 0.5,
      dispatch: { type: 'ventilator', payload: { sevofluranePercent: 6 } },
      narration: 'The circuit is ready, so start the volatile — 6%, inside the labelled 0 to 8% induction range. Watch the END-TIDAL number rather than the dial: the two are not interchangeable, and it is the recorded end-tidal concentration rising through 0.8 age-adjusted MAC that this objective reads.' };
  }
  return { id: 'prepare', focus: 'actions', progress: 0.2,
    dispatch: { type: 'ventilator',
      payload: { delivering: true, fio2: 1, freshGasFlowLPerMin: 6, sevofluranePercent: 0 } },
    narration: 'Prepare the circuit first: 100% oxygen and 6 L/min of fresh gas, with the vaporizer left at zero. The vaporizer staying off is part of the objective rather than an omission — turning it on in the same movement loses the preparation mark entirely, because there is then no moment before volatile delivery at which the machine was ready.' };
}
