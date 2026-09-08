import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsLocalAnestheticSystemicToxicity } from '../local-anesthetic-systemic-toxicity';

/**
 * What this worked example reads.
 *
 * The eleventh observed-state demonstration in the anaesthesia module. Its
 * ordering problem is that the toxicity fraction and the seizure fraction both
 * fall as the treatment works, so neither can sequence the beats — a beat gated
 * on "is he still fitting" fires again the moment the benzodiazepine wears
 * toward the edge of the model. What orders it instead are three quantities that
 * only ever rise or latch: the running lipid infusion, the accepted epinephrine
 * micrograms, and the ventilator's own delivering flag.
 */
export interface LastProgress {
  readonly inspiredOxygenFraction: number;
  readonly ventilatorDelivering: boolean;
  readonly tidalVolumeMl: number;
  readonly respiratoryRateBpm: number;
  /** Above zero only while the modelled exposure is running. */
  readonly toxicityFraction: number;
  readonly seizureFraction: number;
  /** Latches once the weight-banded protocol is accepted, and does not fall. */
  readonly lipidInfusionMlPerMin: number;
  readonly epinephrineTotalMicrograms: number;
  readonly weightKg: number;
}

export const LAST_DEMONSTRATION_VERSION = '0.1.0';

export function supportsLastDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsLocalAnestheticSystemicToxicity(scenario);
}

export interface LastDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the toxicity whose treatment is a checklist.
 *
 * Read from the latest stage backwards, as the ten before it are.
 *
 * The example never reaches for a full-dose pressor, and its closing beat says
 * what would happen if it did: the engine refuses any intravenous epinephrine
 * bolus above 1 microgram per kilogram while the toxicity is running, so the
 * reduced dose is a precondition rather than a preference.
 *
 * It gives no real drug, resuscitates nobody, and predicts no outcome for anyone.
 */
export function lastDemonstrationStep(
  patient?: LastProgress,
): LastDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  const reducedDose = Math.round(patient.weightKg * 0.83);
  if (patient.lipidInfusionMlPerMin > 0 && patient.epinephrineTotalMicrograms > 0) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `Oxygen and ventilation, the seizure suppressed, ${patient.lipidInfusionMlPerMin.toFixed(1)} mL/min of 20% lipid running behind its weight-banded bolus, and ${patient.epinephrineTotalMicrograms.toFixed(0)} micrograms of epinephrine. That last number is the one worth dwelling on. In an arrest you would reach for 500 or 1,000 micrograms without thinking, and here the ceiling is 1 microgram per kilogram — ${patient.weightKg.toFixed(0)} for this patient. The cockpit does not merely mark a larger dose down afterwards: it refuses it outright while the toxicity is running, and tells you why. The reason is that a big pressor bolus in this state worsens the arrhythmia and works against the lipid. If you take one thing, take the order: airway and oxygen, stop the seizure, lipid early, and pressors small. This ends the example, not the evaluation.` };
  }
  if (patient.lipidInfusionMlPerMin > 0) {
    return { id: 'epinephrine', focus: 'actions', progress: 0.9,
      dispatch: { type: 'epinephrine', payload: { route: 'iv', doseMicrograms: reducedDose } },
      narration: `Epinephrine now, at ${reducedDose} micrograms — under 1 microgram per kilogram. This is the beat where the habit from every other emergency is wrong, and the engine will not let you act on it: anything above ${patient.weightKg.toFixed(0)} micrograms is refused while the toxicity is running. Small, and then reassess rather than repeat.` };
    }
  if (patient.toxicityFraction > 0) {
    if (patient.inspiredOxygenFraction < 0.95 || !patient.ventilatorDelivering
      || patient.tidalVolumeMl <= 0 || patient.respiratoryRateBpm <= 0) {
      return { id: 'oxygenate', focus: 'actions', progress: 0.3,
        dispatch: { type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control', tidalVolumeMl: 450, respiratoryRateBpm: 12 } },
        narration: 'Oxygen and ventilation first, and all four parts of it in one action: 100%, delivering, a tidal volume and a rate. The objective reads every one of them, because "the oxygen is on" and "he is being ventilated" are different claims and only the second one treats the acidosis that is making the toxicity worse.' };
    }
    if (patient.seizureFraction > 0) {
      return { id: 'seizure', focus: 'actions', progress: 0.55,
        dispatch: { type: 'seizure-suppression', payload: { route: 'iv', medicationClass: 'benzodiazepine' } },
        narration: 'Benzodiazepine for the seizure, and the reason is metabolic rather than neurological: the fitting is driving an acidosis, and acidosis increases the free fraction of the local anaesthetic that caused it. Stopping the seizure is treating the toxicity, not just the sign.' };
    }
    return { id: 'lipid', focus: 'actions', progress: 0.75,
      dispatch: { type: 'lipid-emulsion', payload: { route: 'iv', protocol: 'initial', concentrationPercent: 20 } },
      narration: `Lipid emulsion, 20%, and early rather than as a last resort. The engine computes the weight band for you and will refuse any other concentration, which is a teaching bound rather than a dosing claim — the point being demonstrated is that the bolus and the infusion are both weight-derived and neither is a number you should be recalling under pressure.` };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.1,
    narration: 'Block placed, and nothing wrong yet. The whole of this lesson happens in the two minutes after an injection that felt ordinary, so the thing to have ready is not a drug but an order of operations.' };
}
