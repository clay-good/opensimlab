import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsRoutineGeriatricInduction } from '../routine-geriatric-induction';

/**
 * What this worked example reads.
 *
 * The tenth observed-state demonstration in the anaesthesia module, and the
 * first whose central beat repeats a fixed number of times. Five 20 mg
 * increments are five separate decisions, and the example has to make each of
 * them a distinct beat without knowing a tick count — so the beats are keyed on
 * the accepted milligrams already given, which only ever goes up.
 *
 * The plasma concentration cannot do that job. It rises with each increment and
 * then falls between them, so a beat gated on it walks backwards.
 */
export interface GeriatricInductionProgress {
  readonly inspiredOxygenFraction: number;
  readonly endTidalOxygenFraction: number;
  /** Accepted propofol milligrams, from the engine rather than a click count. */
  readonly propofolTotalMg: number;
  readonly propofolPlasma: number;
  readonly depthIndex: number;
  readonly meanArterialMmHg: number;
  readonly ventilating: boolean;
  readonly spo2Percent: number;
}

export const GERIATRIC_INDUCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsGeriatricInductionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRoutineGeriatricInduction(scenario);
}

export interface GeriatricInductionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/** The labelled older-adult total, and the ceiling on any one increment. */
const TARGET_TOTAL_MG = 100;
const INCREMENT_MG = 20;

/**
 * The worked example for the induction where the dose is the whole lesson.
 *
 * Read from the latest stage backwards, as the nine before it are. Everything
 * ordering it is monotone: the accepted milligrams and the ventilator's own
 * delivering flag. Neither the plasma concentration nor the depth index
 * sequences anything, because both fall between increments.
 *
 * It intubates nobody, gives no real drug, and predicts no outcome for anyone.
 */
export function geriatricInductionDemonstrationStep(
  patient?: GeriatricInductionProgress,
): GeriatricInductionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.propofolTotalMg >= TARGET_TOTAL_MG && patient.ventilating) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `A hundred milligrams in five increments, a pressure nadir around ${patient.meanArterialMmHg.toFixed(0)} mmHg, and the saturation never below ${patient.spo2Percent.toFixed(0)}%. One honest caveat about what you just watched. In this bounded model it is the TOTAL that moves the pressure, not the rate: the same hundred milligrams given as a single push reaches a nadir within a tenth of a millimetre of mercury of this one. What five increments buy here is the titration objective, not the patient. The clinical argument for giving it this way is about the doses you then do not give — you stop when he is asleep rather than when the syringe is empty — and the run that fails this case gives 144 mg, which is 2 mg/kg, which is the number you would have used on someone thirty years younger. This ends the example, not the evaluation.` };
  }
  if (patient.propofolTotalMg >= TARGET_TOTAL_MG) {
    return { id: 'ventilate', focus: 'actions', progress: 0.9,
      dispatch: { type: 'ventilator', payload: { delivering: true, mode: 'volume-control', tidalVolumeMl: 500 } },
      narration: 'Ventilation now, at 500 mL — 6.9 mL/kg on 72 kg, inside the 6 to 8 the objective asks for. The tidal volume is scaled to him rather than to the machine’s default, which on this ventilator was set before anyone met him.' };
  }
  if (patient.endTidalOxygenFraction < 0.85 && patient.propofolTotalMg === 0) {
    if (patient.inspiredOxygenFraction < 0.9) {
      return { id: 'oxygen', focus: 'actions', progress: 0.08,
        dispatch: { type: 'ventilator', payload: { fio2: 1 } },
        narration: 'Oxygen first. The endpoint this lesson asks for is an end-tidal fraction of 0.85 rather than the 0.90 the younger inductions use, which is a concession to how long it takes rather than to how much reserve he needs.' };
    }
    return { id: 'filling', focus: 'monitor', progress: 0.2,
      narration: 'Watching the end-tidal oxygen climb. Nothing to click. His functional residual capacity is smaller and his closing volume larger than the forty-two-year-old’s, so the same flowmeter setting takes longer to arrive at a lower endpoint.' };
  }
  // Keyed on accepted milligrams, which only rise. The plasma concentration
  // falls between increments and would walk the example backwards into a beat
  // it had already given.
  const given = Math.round(patient.propofolTotalMg / INCREMENT_MG);
  const narration = given === 0
    ? `First increment: 20 mg, and no more than 20 in any one push. The label’s older-adult range is 1 to 1.5 mg/kg — 72 to 108 mg for him — against the 2 mg/kg you would give someone younger, and the reason is not frailty in the abstract: the same milligrams reach the brain in a smaller, slower circulation.`
    : given >= 4
      ? `Fifth and last: that takes him to ${TARGET_TOTAL_MG} mg, or 1.39 mg/kg, inside the labelled range. Depth index ${patient.depthIndex.toFixed(0)}. Stopping here is the decision — not because the range says so, but because he is where he needs to be and there is no reason to spend the rest.`
      : `Increment ${given + 1}. Fifteen seconds since the last one, which is the objective’s floor rather than a target. Watch the depth index and the plasma between pushes: the number on the screen is still catching up with the drug already given, and giving the next one before it has is how you arrive at a dose you did not intend.`;
  return { id: `increment-${given}`, focus: 'analysis', progress: 0.3 + given * 0.12,
    dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: INCREMENT_MG, unit: 'mg' } },
    narration };
}
