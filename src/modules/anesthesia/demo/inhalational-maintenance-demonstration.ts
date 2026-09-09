import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsRoutineInhalationalMaintenance } from '../routine-inhalational-maintenance';

/**
 * What this worked example reads.
 *
 * The thirty-fifth observed-state demonstration in the anaesthesia module, and
 * the only one whose beats are gated on the CLOCK rather than on latched state.
 * That is forced by the lesson: the stimulus arrives at a known tick and the
 * whole skill is acting fifty ticks before it rather than five hundred, so there
 * is no observable that distinguishes "too early" from "just right" except the
 * time itself.
 */
export interface InhalationalMaintenanceProgress {
  readonly tick: number;
  readonly stimulusActive: boolean;
  readonly sevofluranePercent: number;
  readonly remifentanilRate: number;
  readonly depthIndex: number;
}

export const INHALATIONAL_MAINTENANCE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsInhalationalMaintenanceDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsRoutineInhalationalMaintenance(scenario);
}

export interface InhalationalMaintenanceDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const sevoflurane = (percent: number): Omit<LearnerAction, 'tick'> =>
  ({ type: 'ventilator', payload: { sevofluranePercent: percent } });

/**
 * The worked example for the deepening that must not come early.
 *
 * Read from the latest stage backwards, as the thirty-four before it are.
 *
 * It anaesthetises nobody and predicts no outcome for any person.
 */
export function inhalationalMaintenanceDemonstrationStep(
  patient?: InhalationalMaintenanceProgress,
): InhalationalMaintenanceDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  // Each phase is a half-open tick window, so no beat can be re-entered once
  // the clock has passed it. An earlier draft gated only on `tick >= 2350` and
  // the volatile percentage, which re-emitted the deepen beat after the
  // withdrawal had brought the percentage back down -- in the cockpit that
  // would have re-dispatched 4% sevoflurane.
  if (patient.tick >= 3700) {
    if (patient.remifentanilRate === 0) {
      return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
        narration: 'The stimulus is over, the infusion is off and the depth is back in band. The finding worth carrying away is about timing, and it is not the one most people would guess. Take the four actions you just watched and move the volatile step 550 ticks EARLIER — everything else identical — and the measured pressure rise goes from 19.5% to 29.6%, which is worse than doing nothing at all, where it is 27.3%. The rise is measured against the pressure immediately before the stimulus, so deepening early lowers its own denominator: you spend the drug, you drop the baseline, and the percentage you are scored on gets bigger. Fifty ticks before is right; five hundred and fifty is worse than nothing. Two more things this model will not reward you for. The remifentanil rate makes almost no difference to that rise: a sixteen-fold range from 0.05 to 0.8 moves it by a tenth of a percentage point, while moving the volatile step in time moves it by ten. What the second objective really reads is that an infusion was running, plus what the volatile did and when. And a run that leaves the volatile at 4% rather than withdrawing it earns this same stimulus objective while ending the case at 43 mmHg with a depth index of 20. This ends the example, not the evaluation.' };
    }
    return { id: 'stop-infusion', focus: 'actions', progress: 0.9,
      dispatch: { type: 'infusion', payload: { drugId: 'remifentanil', rate: 0 } },
      narration: 'The dissection has finished, so stop the remifentanil — the third objective allows 30 seconds from offset. An opioid still running against a stimulus that has gone is the commonest way a smooth maintenance turns into a slow, hypotensive emergence.' };
  }
  if (patient.tick >= 2600) {
    if (patient.sevofluranePercent > 2) {
      return { id: 'withdraw', focus: 'actions', progress: 0.7,
        dispatch: sevoflurane(1.4),
        narration: 'Bring the volatile back down now, to 1.4%. This is the step that separates a good run from a scored one: leave it at 4% and the stimulus objective is still met while the depth trace spends two thirds of the case below the band and the case ends at 43 mmHg. Deepening for a stimulus is a loan, not a gift.' };
    }
    return { id: 'settling', focus: 'monitor', progress: 0.8,
      narration: 'The volatile is back down and the dissection is still running. Nothing to add: this beat holds until the stimulus ends, because the next action is the one the third objective times from that moment rather than from now.' };
  }
  if (patient.tick >= 2350) {
    if (patient.sevofluranePercent < 2) {
      return { id: 'deepen', focus: 'actions', progress: 0.5,
        dispatch: sevoflurane(4),
        narration: 'Now — fifty ticks before the dissection — take the volatile to 4%. The timing is the whole skill. Doing this four minutes earlier is not more cautious, it is measurably worse: the rise the objective scores is measured against the pressure immediately before the stimulus, so an early deepening lowers the number it will be compared against and inflates the result.' };
    }
    return { id: 'holding', focus: 'monitor', progress: 0.6,
      narration: 'Deepened, and now holding through the stimulus. The volatile takes time to reach effect, which is exactly why this step could not be left until the dissection had already started — and exactly why it must not be left in place once it has finished.' };
  }
  if (patient.remifentanilRate > 0) {
    return { id: 'waiting', focus: 'monitor', progress: 0.35,
      narration: 'The infusion is running and the stimulus is still minutes away. Nothing to do but watch: this beat holds deliberately, because the next action is worth less if it is taken now than if it is taken just before the dissection starts.' };
  }
  return { id: 'infusion', focus: 'actions', progress: 0.2,
    dispatch: { type: 'infusion', payload: { drugId: 'remifentanil', rate: 0.2 } },
    narration: 'Start the remifentanil infusion well before the stimulus — the second objective requires it to be running when the dissection begins, and an infusion started afterwards cannot satisfy it however fast it is titrated. The rate matters less than the fact of it, which is a limit of this model rather than of the drug.' };
}
