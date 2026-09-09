import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsPostExtubationObstruction } from '../post-extubation-obstruction';

/**
 * What this worked example reads.
 *
 * The twenty-eighth observed-state demonstration in the anaesthesia module, and
 * the fifth to open with a beat that deliberately does nothing: the scripted
 * pattern arrives at tick 100 and both timed objectives measure from it.
 *
 * The maneuver is held for a bounded number of seconds rather than latched, so
 * its gate reads the remaining seconds and the beat after it reads the patency
 * -- a quantity that only rises once the bundle is complete.
 */
export interface PostExtubationObstructionProgress {
  readonly obstructionSeverity: number;
  readonly helpRequestedAtTick: number | null;
  readonly ventilatorDelivering: boolean;
  readonly inspiredOxygenFraction: number;
  readonly jawThrustCpapSecondsRemaining: number;
  readonly patencyFraction: number;
}

export const POST_EXTUBATION_OBSTRUCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPostExtubationObstructionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPostExtubationObstruction(scenario);
}

export interface PostExtubationObstructionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the bundle that only works whole.
 *
 * Read from the latest stage backwards, as the twenty-seven before it are.
 *
 * It opens nobody's airway and predicts no outcome for any person.
 */
export function postExtubationObstructionDemonstrationStep(
  patient?: PostExtubationObstructionProgress,
): PostExtubationObstructionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  // Patency is 1.0 before the scripted obstruction arrives, so this gate also
  // requires the latched help tick: without it the example finishes at tick 1.
  if (patient.helpRequestedAtTick !== null && patient.ventilatorDelivering
    && patient.patencyFraction >= 0.95) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The airway is open, the tidal volume is back to 500 mL and the carbon dioxide is coming down. The run worth comparing against is the one the monitor rewards. Turn the oxygen to 100% with active delivery and do nothing else, and the saturation reads 100% for the rest of the case — BETTER than the 97% a patient gets when nothing at all is done — while the modelled airway stays half closed, the tidal volume stays at 250 mL, and the carbon dioxide climbs to 55. Neither half of this bundle works alone: the held jaw thrust without delivery leaves the airway exactly where the untreated run leaves it, and the delivery without the jaw thrust does the same. The objective asks for both at once because in this model both at once is the only thing that opens anything. The saturation is the wrong instrument for this lesson — watch the tidal volume and the capnogram. Limits: soft-tissue obstruction only, and there is no pathway here for an airway that does not respond. This ends the example, not the evaluation.' };
  }
  if (patient.ventilatorDelivering && patient.inspiredOxygenFraction >= 0.95) {
    return { id: 'maneuver', focus: 'actions', progress: 0.75,
      dispatch: { type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' } },
      narration: 'Now the jaw thrust with CPAP, held, and note that it goes on TOP of the breath delivery rather than instead of it. This is the half that opens the airway; the delivery is the half that gets gas through it once it is open. The objective wants both inside 45 seconds of the pattern starting, and it wants them together.' };
  }
  if (patient.helpRequestedAtTick !== null) {
    return { id: 'deliver', focus: 'actions', progress: 0.5,
      dispatch: { type: 'ventilator',
        payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
      narration: 'Start active breath delivery at 100% oxygen. On its own this will not open anything — it is half of a bundle — but it is the half that has to be running before the maneuver can move any gas, so it goes first by a few seconds and not by a few minutes.' };
  }
  if (patient.obstructionSeverity > 0.05) {
    return { id: 'recognize', focus: 'actions', progress: 0.25,
      dispatch: { type: 'call-for-help', payload: { context: 'airway' } },
      narration: 'Call for airway help — the objective allows 30 seconds. What has just appeared is obstructed breathing after a tube came out, and the reason to escalate now is that the saturation will not tell you: it sits at 97% while the tidal volume halves. Read the effort and the volume, not the oximeter.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'Nothing has happened yet. The pattern arrives shortly and both timed objectives measure from that moment, so acting now records nothing against them. Watch the tidal volume and the shape of the breathing rather than the saturation.' };
}
