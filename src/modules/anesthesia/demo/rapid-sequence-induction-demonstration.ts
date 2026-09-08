import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsRapidSequenceInduction } from '../rapid-sequence-induction';

/**
 * What this worked example reads.
 *
 * The third observed-state demonstration in the anaesthesia module, and the
 * first whose hardest gate is not a level but a direction. Reversal in this
 * engine is refused unless the block is receding, and the post-tetanic count
 * cannot tell you that on its own: it reads 3 while the block is deepening and
 * 1 again while it is wearing off, so a beat gated on the count alone fires on
 * the wrong limb and is rejected.
 *
 * What separates the limbs is the pair of rocuronium curves. During onset the
 * plasma runs ahead of the effect site; during offset the effect site is the
 * higher of the two. The crossover IS the recovery limb, and it is the same
 * hysteresis the module's explainer is about — so the example gates on it and
 * says so, rather than waiting a fixed number of minutes.
 */
export interface RapidSequenceInductionProgress {
  readonly inspiredOxygenFraction: number;
  readonly endTidalOxygenFraction: number;
  readonly depthIndex: number;
  readonly trainOfFourCount: number;
  readonly trainOfFourRatio: number;
  readonly postTetanicCount: number;
  readonly remifentanilPlasma: number;
  readonly propofolPlasma: number;
  readonly rocuroniumPlasma: number;
  /** Above the plasma only while the block is receding. That is the whole gate. */
  readonly rocuroniumEffectSite: number;
  readonly intubated: boolean;
  readonly reversed: boolean;
  readonly airwayAttempts: number;
  readonly airwayAttemptInProgress: boolean;
}

export const RAPID_SEQUENCE_INDUCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsRapidSequenceInductionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.2.0' && supportsRapidSequenceInduction(scenario);
}

export interface RapidSequenceInductionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the induction that has an order as well as a clock.
 *
 * Read from the latest stage backwards, as the two before it are, because the
 * physiological gates here go both ways: the post-tetanic count returns to 1
 * twice, the train-of-four count returns to 4 twice, and the depth index falls
 * and drifts back up. Only two facts in the run cannot go backwards — an airway
 * attempt made, and a reversal accepted — and the structure leans on both.
 *
 * It gives no real drug, paralyses nobody, and predicts no outcome for anyone.
 */
export function rapidSequenceInductionDemonstrationStep(
  patient?: RapidSequenceInductionProgress,
): RapidSequenceInductionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reversed && patient.trainOfFourRatio >= 0.9) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `Train-of-four ratio ${patient.trainOfFourRatio.toFixed(2)}, which is the number the objective actually asks for — the reversal being accepted is not the same claim as the block being gone, and this run had to show both. Three things carried this induction and none of them was a drug choice. The oxygen went in on the end-tidal clock rather than the flowmeter's. The hypnotic went in before the relaxant, because paralysis prevents movement and does not produce sleep. And the reversal waited for the effect site to come back down past the plasma, which is what "receding" means and what the model refuses to accept a guess about. This ends the example, not the evaluation.` };
  }
  if (patient.intubated) {
    // The direction, not the level. The post-tetanic count reads 3 while the
    // block is still deepening and 1 again while it is wearing off, so a beat
    // gated on the count alone fires on the wrong limb and is refused.
    if (patient.trainOfFourCount === 0 && patient.postTetanicCount >= 1
      && patient.rocuroniumEffectSite > patient.rocuroniumPlasma) {
      return { id: 'reverse', focus: 'actions', progress: 0.88,
        dispatch: { type: 'neuromuscular-reversal', payload: { agent: 'sugammadex', route: 'iv', doseMgPerKg: 4 } },
        narration: `No twitches and a post-tetanic count of ${patient.postTetanicCount}, and the rocuronium effect site has come back down past the plasma — the two curves have crossed, which is what tells you this is the wearing-off limb rather than the onset one. That matters because the count on its own does not: it read the same on the way in. Deep block with a post-tetanic count takes 4 mg/kg; 2 would be the dose if there were twitches, and the model refuses the wrong pairing rather than pretending.` };
    }
    if (patient.depthIndex >= 48 && patient.propofolPlasma < 3) {
      return { id: 'top-up', focus: 'analysis', progress: 0.72,
        dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 50, unit: 'mg' } },
        narration: `Depth index ${patient.depthIndex.toFixed(0)} and the propofol nearly gone, with the block still complete. This is the beat with nothing dramatic on the monitor and the most at stake: she cannot move, cannot breathe, and cannot tell you she is awake, and a relaxant hides every sign that a lighter patient would show you. The depth index is a processed number with real limits — it does not prove awareness or exclude it — and the reason to act on it here is that the usual signs have been taken away.` };
    }
    return { id: 'waiting-block', focus: 'monitor', progress: 0.8,
      narration: 'Ventilating, and now waiting. Nothing to do but let the block recede far enough to be reversed against something measured. Watch the post-tetanic count rather than the clock: a fixed number of minutes is what people use when there is no monitor, and there is one here.' };
  }
  if (patient.airwayAttemptInProgress) {
    return { id: `attempt-${patient.airwayAttempts}`, focus: 'monitor', progress: 0.62,
      narration: 'The attempt is running and she is not being ventilated during it. That interval is the one this whole preparation was for, and the reserve built earlier is what is paying for it.' };
  }
  if (patient.rocuroniumPlasma > 0) {
    // Gated on attempts made rather than on the count, because the count returns
    // to 4 later and would send the example backwards into the onset beat.
    if (patient.airwayAttempts > 0) {
      return { id: `airway-again-${patient.airwayAttempts}`, focus: 'actions', progress: 0.6,
        dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
        narration: 'That attempt did not place the tube, which the distribution allows in a patient whose assessment predicted nothing. Going again, with the block still complete and the reserve still holding.' };
    }
    if (patient.trainOfFourCount > 0) {
      return { id: 'onset', focus: 'monitor', progress: 0.52,
        narration: `Train-of-four still showing ${patient.trainOfFourCount}, so not yet. This is the wait that a full stomach makes uncomfortable, and shortening it does not make the intubation faster — it makes it worse, against a larynx that is not ready. Watch the count go to zero.` };
    }
    return { id: 'airway', focus: 'actions', progress: 0.58,
      dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
      narration: 'Count zero, so now. And the peripheral monitor is a proxy: an adductor pollicis reading zero does not guarantee the larynx, which relaxes earlier and recovers earlier than the thumb. It is the best signal on the screen and it is not a promise.' };
  }
  if (patient.propofolPlasma > 0) {
    return { id: 'relaxant', focus: 'analysis', progress: 0.45,
      dispatch: { type: 'bolus', payload: { drugId: 'rocuronium', amount: 0.6, unit: 'mg/kg' } },
      narration: 'Rocuronium now, and only now, because she is asleep. The syringe also offers 1.0 and 1.2 mg/kg, which give a faster and much longer block; 0.6 is taken here so the block can be reversed against a measured depth inside this case rather than outlasting it. That is a trade the scenario leaves open and this is one side of it.' };
  }
  if (patient.remifentanilPlasma > 0) {
    return { id: 'hypnotic', focus: 'analysis', progress: 0.38,
      dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 1.5, unit: 'mg/kg' } },
      narration: 'Propofol before the relaxant. Reversing that order is the single error this lesson is built around, and it is not a sequencing preference: a paralysed patient who is not asleep looks exactly like a paralysed patient who is, and the monitor that would have told you has been switched off by the drug.' };
  }
  if (patient.inspiredOxygenFraction < 0.9) {
    return { id: 'oxygen', focus: 'actions', progress: 0.08,
      dispatch: { type: 'ventilator', payload: { fio2: 1 } },
      narration: 'Oxygen to 100% first. She has a full stomach and is still vomiting, so there is no bag-mask ventilation between the induction and the tube — the reserve built now is the entire supply for that interval.' };
  }
  if (patient.endTidalOxygenFraction < 0.9) {
    return { id: 'filling', focus: 'monitor', progress: 0.2,
      narration: 'Watch the end-tidal oxygen climb rather than the flowmeter. The inspired number went to 1.0 the moment the dial moved; the end-tidal one is the one that says the nitrogen has actually come out of her lungs, and it is what the objective is scored on.' };
  }
  return { id: 'opioid', focus: 'analysis', progress: 0.3,
    dispatch: { type: 'bolus', payload: { drugId: 'remifentanil', amount: 50, unit: 'µg' } },
    narration: 'Remifentanil first, to blunt the pressor response to the laryngoscope. It costs pressure, which this patient can afford better than the two before her, and it wears off fast enough to matter later.' };
}
