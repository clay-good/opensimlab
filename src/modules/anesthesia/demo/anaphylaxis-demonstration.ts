import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsPerioperativeAnaphylaxis } from '../perioperative-anaphylaxis';

/**
 * What this worked example reads.
 *
 * The thirteenth observed-state demonstration in the anaesthesia module. Its
 * sequencing quantities are the accepted epinephrine micrograms and the accepted
 * crystalloid millilitres, both of which only rise.
 *
 * The engine's own anaphylaxis severity is private and not on the snapshot, so
 * the trigger is the collapse itself. That is the better reading anyway: it is
 * the observation the learner actually has, and nothing in this lesson announces
 * an allergy.
 */
export interface AnaphylaxisProgress {
  readonly inspiredOxygenFraction: number;
  readonly ventilatorDelivering: boolean;
  readonly epinephrineTotalMicrograms: number;
  readonly crystalloidTotalMl: number;
  readonly meanArterialMmHg: number;
}

export const ANAPHYLAXIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAnaphylaxisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPerioperativeAnaphylaxis(scenario);
}

export interface AnaphylaxisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/** The bounded adult initial dose this lesson accepts, and no other. */
const INITIAL_EPINEPHRINE_MICROGRAMS = 50;

/**
 * The worked example for the collapse that looks like every other collapse.
 *
 * Read from the latest stage backwards, as the twelve before it are.
 *
 * The example never reaches for the vasopressor, and its closing beat says what
 * happens to a run that does: the same reflex, one drug different, and 7.3 mmHg
 * of pressure nadir between them.
 *
 * It gives no real drug and predicts no outcome for anyone.
 */
export function anaphylaxisDemonstrationStep(
  patient?: AnaphylaxisProgress,
): AnaphylaxisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.epinephrineTotalMicrograms > 0 && patient.crystalloidTotalMl >= 2000) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `Epinephrine in within ten seconds, two litres behind it, and the mean pressure at ${patient.meanArterialMmHg.toFixed(0)} mmHg. Worth naming what was NOT used. A vasopressor is on this tray from the first tick, it raises the same number, and reaching for it here is entirely reasonable behaviour for every other cause of an abrupt intraoperative collapse. Measured, a run that makes the identical opening and then gives a second vasopressor instead of this dose ends 7.3 mmHg lower and fails two objectives, because a pure vasoconstrictor works on tone and does nothing about the mast cells. The tell was the timing rather than a rash: an antibiotic went in, and the pressure went shortly after. This ends the example, not the evaluation.` };
  }
  // The engine's anaphylaxis severity is private, so the example triggers on the
  // collapse itself — which is the same observation the learner has. Measured,
  // this patient's mean pressure never falls below 90 mmHg before the exposure
  // and reaches 75 within ten seconds of it, so 80 is unambiguous.
  // Latched on treatment having started, not on the pressure alone. Epinephrine
  // lifts the mean pressure back over 80 for a while, so a gate on the collapse
  // by itself drops out of the treatment branch and walks back into `watching`
  // between the drug and the volume.
  if (patient.epinephrineTotalMicrograms > 0 || patient.meanArterialMmHg < 80) {
    if (patient.epinephrineTotalMicrograms <= 0) {
      return { id: 'epinephrine', focus: 'actions', progress: 0.6,
        dispatch: { type: 'epinephrine', payload: { route: 'iv', doseMicrograms: INITIAL_EPINEPHRINE_MICROGRAMS } },
        narration: `Mean pressure ${patient.meanArterialMmHg.toFixed(0)} mmHg, minutes after a cefazolin dose. Epinephrine, ${INITIAL_EPINEPHRINE_MICROGRAMS} micrograms intravenously — the bounded adult initial dose this model accepts. This is the first thing and not the third: it is the only drug here that acts on the mechanism rather than on the reading, and every minute it waits is a minute of continuing mediator release.` };
    }
    return { id: `volume-${patient.crystalloidTotalMl.toFixed(0)}`, focus: 'actions', progress: 0.85,
      dispatch: { type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 } },
      narration: `A litre, and then another. The objective asks for a thousand millilitres inside two minutes and that is a floor rather than a plan — this is vasodilation and capillary leak at the same time, so the circulation is both too large and emptying, and the volume requirement here is closer to what a haemorrhage would need than what the pressure alone suggests.` };
  }
  if (patient.inspiredOxygenFraction < 0.95 || !patient.ventilatorDelivering) {
    return { id: 'prepare', focus: 'actions', progress: 0.15,
      dispatch: { type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
      narration: 'Oxygen to 100% and ventilation running, before anything has happened. One of the four objectives here is decided entirely by this beat: it asks for high inspired oxygen and active ventilation by sixty seconds after an exposure that has not occurred yet, and it counts settings established beforehand. Preparation is the cheapest of the four.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.3,
    narration: 'Prepared, and waiting. The antibiotic is about to go in and nothing about the next two minutes will announce itself as an allergy — no rash the drapes would show, no history anyone could have taken. What there will be is an abrupt fall in pressure a short time after a drug, and that adjacency is the whole diagnosis.' };
}
