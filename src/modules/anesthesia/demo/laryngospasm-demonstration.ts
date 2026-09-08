import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsLaryngospasmAfterAirwayStimulation } from '../laryngospasm-after-airway-stimulation';

/**
 * What this worked example reads.
 *
 * The fifth observed-state demonstration in the anaesthesia module. What is new
 * here is that the response is a conjunction rather than a list: the engine
 * relieves the modelled closure only while the held maneuver, positive pressure,
 * 95% oxygen and a depth index at or below 60 are all true at once. So the
 * example reads the airway's patency fraction and the depth index together, and
 * its deepening beat exists to satisfy a precondition rather than to add a
 * second treatment beside the first.
 */
export interface LaryngospasmProgress {
  readonly inspiredOxygenFraction: number;
  readonly ventilatorDelivering: boolean;
  readonly endTidalOxygenFraction: number;
  /** 1 while the airway is open; it falls when the scripted closure begins. */
  readonly patencyFraction: number;
  /** Seconds left in the bounded held maneuver, and 0 before one is applied. */
  readonly jawThrustSecondsRemaining: number;
  readonly depthIndex: number;
  readonly spo2Percent: number;
}

export const LARYNGOSPASM_DEMONSTRATION_VERSION = '0.1.0';

export function supportsLaryngospasmDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsLaryngospasmAfterAirwayStimulation(scenario);
}

export interface LaryngospasmDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the airway that shuts while you are watching it.
 *
 * Read from the latest stage backwards, as the four before it are. The patency
 * fraction falls and then rises again, so it cannot order the beats on its own;
 * what carries the ordering is the held maneuver, which once applied leaves a
 * countdown running whether or not the airway has opened.
 *
 * It intubates nobody, gives no real drug, and predicts no outcome for anyone.
 */
export function laryngospasmDemonstrationStep(
  patient?: LaryngospasmProgress,
): LaryngospasmDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.jawThrustSecondsRemaining > 0 && patient.patencyFraction > 0.95) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `The airway is open again and the saturation never went below ${patient.spo2Percent.toFixed(0)}%. Worth being precise about which of those two facts the last minute earned. Measured in this model, a patient who reached the closure with a full reserve does not desaturate over this whole window even if nothing at all is done about the spasm — so the number on the screen is mostly the three minutes of oxygen, not the maneuver. What the maneuver and the dose bought is the airway itself, and they only bought it together: the closure does not relieve until the held maneuver, the positive pressure, the oxygen and a depth index at or below 60 are all true at once. This ends the example, not the evaluation.` };
  }
  if (patient.patencyFraction < 0.95) {
    if (patient.jawThrustSecondsRemaining <= 0) {
      return { id: 'maneuver', focus: 'actions', progress: 0.6,
        dispatch: { type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' } },
        narration: 'The bag is not moving, the capnogram is gone, and the chest is working against a closed larynx. Held jaw thrust with continuous positive airway pressure, and the oxygen is already where it needs to be. This is the first thing and it is not sufficient on its own — the model will not open the airway on this alone, which is the honest version of the algorithm rather than a shortcut through it.' };
    }
    if (patient.depthIndex > 60) {
      return { id: 'deepen', focus: 'analysis', progress: 0.75,
        dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } },
        narration: `Depth index ${patient.depthIndex.toFixed(0)}, and that is the number holding the larynx shut. Propofol, 2 mg/kg, and the size matters rather than the gesture: the closure relieves only at a depth of 60 or below, so a token dose given at exactly the right moment scores the same on the timing and leaves the airway exactly as closed. The reflex is being driven by a plane that is too light, and deepening is not an adjunct to the maneuver — it is what makes the maneuver work.` };
    }
    return { id: 'holding', focus: 'monitor', progress: 0.88,
      narration: `Depth is below 60 now and the maneuver is still held. Nothing more to do but keep holding it and watch the patency come back. Saturation ${patient.spo2Percent.toFixed(0)}%. This lesson stops here on purpose: there is no suction, no airway adjunct, no succinylcholine and no refractory pathway in it, so what happens if this does not work is outside what the model is entitled to show you.` };
  }
  if (patient.inspiredOxygenFraction < 0.95 || !patient.ventilatorDelivering) {
    return { id: 'oxygen', focus: 'actions', progress: 0.1,
      dispatch: { type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control' } },
      narration: 'Oxygen to 100% and actually delivering, long before anything happens. He had a respiratory infection recently and still coughs in the mornings, which is the entire reason to expect the next few minutes.' };
  }
  if (patient.endTidalOxygenFraction < 0.9) {
    return { id: 'filling', focus: 'monitor', progress: 0.25,
      narration: 'Watching the end-tidal oxygen climb, not the flowmeter. This is the beat that decides the case, and it happens before anything has gone wrong — which is exactly why it is the one that gets skipped.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.4,
    narration: 'Reserve full, and now waiting. An oral airway is about to go in while the plane is light, and that is the stimulus. Nothing to click: the point of this beat is that the preparation is already finished and there is nothing left to do at the moment it matters.' };
}
