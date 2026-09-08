import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsUnexpectedHemorrhage } from '../unexpected-intraoperative-hemorrhage';

/**
 * What this worked example reads.
 *
 * The seventh observed-state demonstration in the anaesthesia module. Its
 * distinctive problem is that the event it responds to is declared by the
 * scenario rather than caused by the learner, and the engine exposes it as a
 * single flag — hemorrhage active or not. That flag goes true and then false
 * again when the surgeon controls the bleeding, so it can start the sequence and
 * cannot order it; what orders the later beats is the accepted crystalloid
 * total and the released blood products, both of which only ever go up.
 */
export interface UnexpectedHemorrhageProgress {
  readonly inspiredOxygenFraction: number;
  readonly endTidalOxygenFraction: number;
  /** True only while the modelled loss is running, and false again after control. */
  readonly hemorrhageActive: boolean;
  readonly crystalloidTotalMl: number;
  readonly bloodProductsReleased: boolean;
  readonly packedRedBloodCellUnits: number;
  readonly meanArterialMmHg: number;
  readonly remifentanilPlasma: number;
  readonly propofolPlasma: number;
  readonly intubated: boolean;
  readonly airwayAttempts: number;
  readonly airwayAttemptInProgress: boolean;
}

export const UNEXPECTED_HEMORRHAGE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsUnexpectedHemorrhageDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsUnexpectedHemorrhage(scenario);
}

export interface UnexpectedHemorrhageDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the bleeding you did not cause and cannot stop.
 *
 * Read from the latest stage backwards, as the six before it are. It finishes on
 * the released blood products rather than on the pressure, because a pressure
 * held up by crystalloid is the thing this lesson is careful not to call a
 * result.
 *
 * There is no vasopressor beat, and its absence is deliberate. The engine's
 * vasopressor effect decays below any sane "none on board" threshold within
 * about ten seconds while the pressure is still down, so a beat gated on it
 * re-fires forever — and every reordering that closes that loop makes the beat
 * unreachable instead. The reference transcripts carry the bridging dose; the
 * example does not need to, and says so in its closing beat.
 *
 * It gives no real drug, transfuses nobody, and predicts no outcome for anyone.
 */
export function unexpectedHemorrhageDemonstrationStep(
  patient?: UnexpectedHemorrhageProgress,
): UnexpectedHemorrhageDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.packedRedBloodCellUnits > 0) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `Two units released and the mean pressure at ${patient.meanArterialMmHg.toFixed(0)} mmHg on ${patient.crystalloidTotalMl.toFixed(0)} mL of crystalloid. Be careful what you call that. The model retains a quarter of a crystalloid bag intravascularly, so five litres of it stands in for rather more than a litre of blood, and a pressure held up that way is a number rather than an oxygen-carrying circulation — which is precisely why the objective calls this temporizing and not replacement. The other half of this case was decided before the abdomen was opened, at a syringe: the run beside this one gives the same fluid at the same ticks after 2 mg/kg instead of 0.5, and it loses fourteen millimetres of mercury and the pressure objective with them. A vasopressor has its place in the minutes before the volume arrives, and it is a bridge across a gap rather than an answer to one. This ends the example, not the evaluation.` };
  }
  if (patient.bloodProductsReleased) {
    return { id: 'transfuse', focus: 'actions', progress: 0.92,
      dispatch: { type: 'blood-product', payload: { productId: 'packed-red-blood-cells', units: 2 } },
      narration: 'Red cells now. This is the beat the crystalloid was buying time for, and the distinction is the whole of the second objective: a balanced salt solution expands a circulation and carries no oxygen, so it holds a number up while the thing the number stands for keeps falling.' };
  }
  // The airway first, always. This scenario declares a slow loss from tick 300
  // as well as the tamponade release at 2,400, so `hemorrhageActive` is true
  // through the induction too and cannot be allowed to outrank it — reading it
  // as "the abdomen is open" sent the example straight past the induction the
  // first time this was written.
  if (patient.intubated) {
    if (patient.crystalloidTotalMl < 1000) {
      return { id: 'preload', focus: 'actions', progress: 0.55,
        dispatch: { type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 } },
        narration: 'A litre now, before anything has gone wrong. She is pale and cold with a rate of 112 and a narrow pulse pressure, and her mean pressure is normal — which is the compensated picture and the least reassuring version of a normal number there is. Blood has been collecting in that abdomen since before you met her.' };
    }
    if (patient.hemorrhageActive && patient.meanArterialMmHg < 72
      && patient.crystalloidTotalMl < 3000) {
      return { id: 'volume', focus: 'actions', progress: 0.72,
        dispatch: { type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 2000 } },
        narration: `The pressure is going and the suction bottle is the monitor rather than the screen. Two litres, now and in quantity. Mean pressure ${patient.meanArterialMmHg.toFixed(0)} mmHg — and note how late that number moved compared with what the surgeon could already see, which is the same compensation that was hiding how dry she was before any of this started.` };
    }
    if (patient.hemorrhageActive && patient.crystalloidTotalMl >= 3000
      && !patient.bloodProductsReleased) {
      return { id: 'blood-bank', focus: 'actions', progress: 0.8,
        dispatch: { type: 'blood-bank-request', payload: {} },
        narration: 'Ask for blood while the crystalloid is going in, not after it. The request takes time that the bleeding does not wait for, and the bounded model here releases products rather than simulating a laboratory, a porter or a crossmatch — so treat the delay as read rather than as absent.' };
    }
    return { id: `waiting-${Math.round(patient.crystalloidTotalMl / 1000)}`, focus: 'monitor', progress: 0.66,
      narration: `Mean pressure ${patient.meanArterialMmHg.toFixed(0)} mmHg, and nothing to give at this moment. The surgeon is about to open an abdomen that is holding its own tamponade shut, and being ready for that means having already done it: the litre is in, the access is there, and the next ninety seconds are not the time to start preparing.` };
  }
  if (patient.airwayAttemptInProgress) {
    return { id: `attempt-${patient.airwayAttempts}`, focus: 'monitor', progress: 0.5,
      narration: 'The attempt is running. A straightforward airway, and the reason to be quick about it is not the oxygen — it is that the surgeon is waiting and what happens when the abdomen opens is the whole case.' };
  }
  if (patient.propofolPlasma > 0) {
    if (patient.airwayAttempts > 0) {
      return { id: `airway-again-${patient.airwayAttempts}`, focus: 'actions', progress: 0.48,
        dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
        narration: 'That attempt did not place the tube, which the distribution allows. Going again.' };
    }
    return { id: 'airway', focus: 'actions', progress: 0.45,
      dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
      narration: 'The airway, promptly. Nothing about this part is difficult, and it is worth doing quickly for a reason outside itself.' };
  }
  if (patient.remifentanilPlasma > 0) {
    return { id: 'hypnotic', focus: 'analysis', progress: 0.35,
      dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 0.5, unit: 'mg/kg' } },
      narration: 'Propofol, 0.5 mg/kg. The syringe offers 2 mg/kg and the preset is right there, and this is the single most consequential click in the case: an identical run that takes it, and then does every other thing here at exactly the same tick, loses fourteen millimetres of mercury of pressure nadir and fails an objective this one meets. A shocked patient needs a fraction of the textbook dose because the same dose reaches the brain in a smaller, faster circulation.' };
  }
  if (patient.inspiredOxygenFraction < 0.9) {
    return { id: 'oxygen', focus: 'actions', progress: 0.08,
      dispatch: { type: 'ventilator', payload: { fio2: 1 } },
      narration: 'Oxygen to 100%. Her saturation is not what is under threat here, and the order does not change because of that.' };
  }
  if (patient.endTidalOxygenFraction < 0.9) {
    return { id: 'filling', focus: 'monitor', progress: 0.2,
      narration: 'Watching the end-tidal oxygen climb rather than the flowmeter, as in every induction.' };
  }
  return { id: 'opioid', focus: 'analysis', progress: 0.28,
    dispatch: { type: 'bolus', payload: { drugId: 'remifentanil', amount: 10, unit: 'µg' } },
    narration: 'Remifentanil, 10 µg — a fifth of a routine dose. It costs pressure, and she has none to spend; the reason to give any at all is the laryngoscope.' };
}
