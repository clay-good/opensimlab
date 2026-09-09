import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsRoutinePediatricIvInduction } from '../routine-pediatric-iv-induction';

/**
 * What this worked example reads.
 *
 * The thirty-seventh observed-state demonstration in the anaesthesia module.
 * Its gates are the end-tidal oxygen fraction, the accepted propofol milligrams
 * and the delivered tidal volume -- the first two monotone across this lesson,
 * and the third read only after a dose is in, so no beat can walk backwards.
 */
export interface PediatricIvInductionProgress {
  readonly endTidalOxygenFraction: number;
  readonly propofolTotalMg: number;
  readonly tidalVolumeMl: number;
  readonly ventilatorDelivering: boolean;
  readonly weightKg: number;
}

export const PEDIATRIC_IV_INDUCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricIvInductionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsRoutinePediatricIvInduction(scenario);
}

export interface PediatricIvInductionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const ventilate = (tidalVolumeMl: number): Omit<LearnerAction, 'tick'> => ({
  type: 'ventilator',
  payload: {
    delivering: true, mode: 'volume-control', fio2: 1,
    tidalVolumeMl, respiratoryRateBpm: 18,
  },
});

/**
 * The worked example for the dose that must be entered by weight.
 *
 * Read from the latest stage backwards, as the thirty-six before it are.
 *
 * It induces nobody and predicts no outcome for any child.
 */
export function pediatricIvInductionDemonstrationStep(
  patient?: PediatricIvInductionProgress,
): PediatricIvInductionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.propofolTotalMg > 0 && patient.tidalVolumeMl >= 130
    && patient.tidalVolumeMl <= 160 && patient.ventilatorDelivering) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Induced, and breathing at 140 mL — seven millilitres per kilogram for this twenty-kilogram child. The comparison worth carrying away is about the second objective, and it is not about the milligrams. Enter this same dose as 60 mg instead of 3 mg/kg and the debrief computes it back to 3.00 mg/kg, reports exactly that, and scores the objective PARTLY MET rather than met — for the unit it was entered in. The drug is identical, the child is identical, and every other objective reads the same. What is being scored is a weight-indexed habit rather than an arithmetic result, which is a defensible thing to teach and is not the same as measuring a safer dose. Two more things this model will not show you. Giving 5 mg/kg instead of 3 costs that objective and costs this child nothing measurable — the saturation stays at 100% — and skipping the preoxygenation entirely costs the first objective while the lowest saturation is still 98%. The one thing that does hurt is stopping the breaths: do that after induction and the saturation reaches 36%. This ends the example, not the evaluation.' };
  }
  if (patient.propofolTotalMg > 0 && patient.tidalVolumeMl < 130) {
    return { id: 'ventilate', focus: 'actions', progress: 0.8,
      dispatch: ventilate(140),
      narration: 'Now deliver breaths sized to the child: 140 mL is 7 mL/kg of twenty kilograms, inside the 6 to 8 the objective asks for. The number to resist is the one already familiar from adults — 450 mL here is 22.5 mL/kg, and the objective reads what was entered rather than what would have been reasonable for somebody else.' };
  }
  if (patient.endTidalOxygenFraction >= 0.9) {
    return { id: 'induce', focus: 'actions', progress: 0.5,
      dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 3, unit: 'mg/kg' } },
      narration: 'Now the propofol, and enter it BY WEIGHT: 3 mg/kg, inside the labelled 2.5 to 3.5 for a healthy child of this age. Entering the equivalent 60 mg as an absolute dose gives the identical drug and is scored lower, because what this objective is really about is the habit of indexing paediatric doses to weight rather than the arithmetic of one correct answer.' };
  }
  return { id: 'preoxygenate', focus: 'monitor', progress: 0.2,
    dispatch: { type: 'ventilator', payload: { delivering: true, fio2: 1 } },
    narration: 'Preoxygenate first and wait for the end-tidal oxygen fraction to reach 0.90 — the objective measures modelled denitrogenation rather than the inspired setting, so turning the dial up is not the same as having done it. This ventilator already sits at 120 mL, which is 6 mL/kg and inside the band, so the machine happens to be right for this child before anyone has thought about it.' };
}
