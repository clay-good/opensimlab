import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsObstetricGeneralAnesthesia } from '../obstetric-general-anesthesia';

/**
 * What this worked example reads.
 *
 * The ninth observed-state demonstration in the anaesthesia module, and the one
 * whose preparation beat has two halves rather than one. The objective asks for
 * an inspired fraction AND a fresh-gas flow, because a circle system left at
 * 2 L/min does not wash a functional residual capacity out however high the dial
 * reads — so the example sets both in a single accepted action and says why.
 */
export interface ObstetricGeneralAnesthesiaProgress {
  readonly inspiredOxygenFraction: number;
  readonly freshGasFlowLPerMin: number;
  readonly endTidalOxygenFraction: number;
  readonly trainOfFourCount: number;
  readonly propofolPlasma: number;
  readonly rocuroniumPlasma: number;
  readonly intubated: boolean;
  readonly ventilating: boolean;
  readonly spo2Percent: number;
  readonly airwayAttempts: number;
  readonly airwayAttemptInProgress: boolean;
}

export const OBSTETRIC_GENERAL_ANESTHESIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsObstetricGeneralAnesthesiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsObstetricGeneralAnesthesia(scenario);
}

export interface ObstetricGeneralAnesthesiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the induction with the smallest margin in the module.
 *
 * Read from the latest stage backwards, as the eight before it are. The airway
 * attempts and the plasma concentrations order it; the train-of-four count does
 * not, because it returns to four later and would send the example back into the
 * beat where it is still waiting for the block.
 *
 * It intubates nobody, gives no real drug, and predicts no outcome for anyone.
 */
export function obstetricGeneralAnesthesiaDemonstrationStep(
  patient?: ObstetricGeneralAnesthesiaProgress,
): ObstetricGeneralAnesthesiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.intubated && patient.ventilating) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `The tube is in, the capnogram is back, and the saturation never went below ${patient.spo2Percent.toFixed(0)}%. That last number is the one to hold on to, because the floor this lesson is scored against is 95% rather than the 92% the earlier inductions used, and it is not an arbitrary tightening: a pregnant patient at term has a smaller functional residual capacity and a higher oxygen consumption at the same time, so the reserve is smaller and it is spent faster. Everything that kept her above it happened before the first drug — both halves of the preparation, and the wait measured on the end-tidal number rather than on the flowmeter. One thing this example never does is start the ventilator: the engine begins delivering the moment the tube is placed, so there is no beat to click. Do not read that as the placement being self-evident — placement is a claim and the sustained capnogram is the evidence for it, and the objective is written on the second of those. This ends the example, not the evaluation.` };
  }
  if (patient.airwayAttemptInProgress) {
    return { id: `attempt-${patient.airwayAttempts}`, focus: 'monitor', progress: 0.8,
      narration: 'The attempt is running and she is not being ventilated during it. This is the interval the whole preparation was for, and in this patient it is the shortest one the module has modelled.' };
  }
  if (patient.rocuroniumPlasma > 0) {
    // Gated on attempts made rather than on the count, because the count returns
    // to four later and would send the example backwards into the onset beat.
    if (patient.airwayAttempts > 0 && !patient.intubated) {
      return { id: `airway-again-${patient.airwayAttempts}`, focus: 'actions', progress: 0.78,
        dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
        narration: 'That attempt did not place the tube, which the distribution allows. Going again — and in an obstetric airway the plan for what happens after a second failure is one you are expected to have made before the first.' };
    }
    if (patient.airwayAttempts === 0 && patient.trainOfFourCount > 0) {
      return { id: 'onset', focus: 'monitor', progress: 0.62,
        narration: `Train-of-four still showing ${patient.trainOfFourCount}. Not yet. This is the wait a full stomach and a waiting obstetrician both make uncomfortable, and shortening it does not make the intubation faster — it makes it worse, against a larynx that is not ready, in the patient with the least margin to spend on a second look.` };
    }
    return { id: 'airway', focus: 'actions', progress: 0.72,
      dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
      narration: 'Count zero, so now. The peripheral monitor is a proxy rather than a promise — the adductor pollicis is not the larynx — and it is the best signal on the screen.' };
  }
  if (patient.propofolPlasma > 0) {
    return { id: 'relaxant', focus: 'analysis', progress: 0.55,
      dispatch: { type: 'bolus', payload: { drugId: 'rocuronium', amount: 1.2, unit: 'mg/kg' } },
      narration: 'Rocuronium now, and only now, because she is asleep. 1.2 mg/kg rather than 1.0 for a faster onset, which is the trade this case is willing to make: the block will outlast the operation and there is no reversal in this lesson, and the thing being bought is a shorter interval without ventilation.' };
  }
  if (patient.inspiredOxygenFraction < 0.95 || patient.freshGasFlowLPerMin < 10) {
    return { id: 'prepare', focus: 'actions', progress: 0.1,
      dispatch: { type: 'ventilator', payload: { fio2: 1, freshGasFlowLPerMin: 10 } },
      narration: 'Both halves of this, in one action. Oxygen to 100% and the fresh-gas flow to 10 L/min — the second is the half that gets forgotten, and without it a circle system rebreathes her own nitrogen back at her however high the dial reads. The objective asks for both because the machine needs both.' };
  }
  if (patient.endTidalOxygenFraction < 0.9) {
    return { id: 'filling', focus: 'monitor', progress: 0.28,
      narration: 'Now watch the end-tidal oxygen rather than the flowmeter. This is the beat that decides the case and it looks like nothing happening; in this patient the wash-in is what buys the entire apnoeic interval, and there is less of it to buy than in anyone the module has induced so far.' };
  }
  return { id: 'hypnotic', focus: 'analysis', progress: 0.45,
    dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } },
    narration: 'Propofol before the relaxant. Reversing that order is not a sequencing preference — a paralysed patient who is not asleep looks exactly like a paralysed patient who is, and this is a lesson where the second person in the room is not modelled and cannot tell you.' };
}
