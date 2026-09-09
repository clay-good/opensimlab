import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsHighSpinalAfterEpiduralTopUp } from '../high-spinal-after-epidural-top-up';

/**
 * What this worked example reads.
 *
 * The twenty-sixth observed-state demonstration in the anaesthesia module. It
 * opens with a no-dispatch beat, as the opioid and pneumothorax ones do: the
 * bounded ephedrine action is refused before the scripted event fires, and every
 * objective is timed from it.
 */
export interface HighSpinalProgress {
  readonly severity: number;
  readonly helpRequestedAtTick: number | null;
  readonly ventilatorDelivering: boolean;
  readonly inspiredOxygenFraction: number;
  readonly crystalloidTotalMl: number;
  readonly ephedrineTotalMg: number;
}

export const HIGH_SPINAL_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHighSpinalDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsHighSpinalAfterEpiduralTopUp(scenario);
}

export interface HighSpinalDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the treatment that is scored and the one that matters.
 *
 * Read from the latest stage backwards, as the twenty-five before it are. Every
 * gate is a latched tick or a cumulative total, so none can walk backwards.
 *
 * It gives no real drug to anyone and predicts no outcome for any person.
 */
export function highSpinalDemonstrationStep(
  patient?: HighSpinalProgress,
): HighSpinalDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ephedrineTotalMg > 0) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'All four objectives are met and the saturation never left the nineties. The comparison worth carrying away is uncomfortable, and it is between two runs that each do most of this correctly. A run that calls for help promptly, gives this same 500 mL and this same 12 mg inside the window, and never starts breath delivery earns the circulation objective outright — and its saturation reaches 0%. A run that ventilates exactly as you just did and gives no fluid and no ephedrine at all holds 97%, identical to this one, and loses only that objective. So the circulation treatment here is scored and does not save anyone, and the breathing is the entire difference. Two further limits worth stating plainly. The mean arterial pressure settles near 35 mmHg on every path including this one, so the fluid and the ephedrine did not fix the pressure either — the bounded model calibrates a response rather than restoring a number. And the saturation objective has no gradient: a run that reaches 87% fails it exactly as a run that reaches 0% does. This ends the example, not the evaluation.' };
  }
  if (patient.crystalloidTotalMl > 0) {
    return { id: 'ephedrine', focus: 'actions', progress: 0.85,
      dispatch: { type: 'ephedrine', payload: { doseMg: 12, route: 'iv' } },
      narration: 'Now 12 mg of ephedrine intravenously — a listed dose, because this bounded action accepts 6 or 12 and nothing else. The block has taken the sympathetic outflow with it, so this is vasodilation rather than bleeding, and the fluid alone is treating the wrong half of that.' };
  }
  if (patient.ventilatorDelivering && patient.inspiredOxygenFraction >= 0.95) {
    return { id: 'crystalloid', focus: 'actions', progress: 0.7,
      dispatch: { type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 500 } },
      narration: 'With the breathing secured, turn to the circulation: 500 mL of balanced crystalloid, inside the same 60-second window. Note the order — this comes after the ventilation rather than before it, and the order is not a stylistic preference here. It is the difference between a saturation in the nineties and one that reaches zero.' };
  }
  if (patient.helpRequestedAtTick !== null) {
    return { id: 'breathe', focus: 'actions', progress: 0.5,
      dispatch: { type: 'ventilator',
        payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
      narration: 'Support the breathing now, and understand that this is the action the patient lives or dies by. A high block climbs through the intercostals to the diaphragm; the pressure is frightening on the monitor and the ventilation is what kills. Breath delivery at 100% oxygen, within 60 seconds of the event.' };
  }
  if (patient.severity > 0.01) {
    return { id: 'help', focus: 'actions', progress: 0.25,
      dispatch: { type: 'call-for-help', payload: { context: 'high-spinal' } },
      narration: 'Call for help first — the objective allows 30 seconds. A block that is climbing needs more hands than one person has, and asking early is what makes the airway and the circulation possible in parallel rather than in sequence.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'Nothing has happened yet, and this beat waits deliberately. Every objective in this lesson is timed from the moment the block declares itself, and the bounded ephedrine action is refused entirely before then, so acting early records nothing and treats nothing. Watch the pressure and the breathing together.' };
}
