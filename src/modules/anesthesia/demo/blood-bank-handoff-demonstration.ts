import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsBloodBankHandoff } from '../blood-bank-handoff';

/**
 * What this worked example reads.
 *
 * The thirty-first observed-state demonstration in the anaesthesia module, and
 * the seventh to open with a beat that deliberately does nothing -- here for a
 * reason unique in the module. Reaching for a product before the release is not
 * merely refused: the refusal is recorded and the second objective is capped at
 * partly met for the rest of the case. Acting early is permanently expensive.
 */
export interface BloodBankHandoffProgress {
  readonly hemorrhageActive: boolean;
  readonly bloodProductsReleased: boolean;
  readonly packedRedBloodCellUnits: number;
  readonly hemoglobinGPerDl: number;
  readonly meanArterialMmHg: number;
}

export const BLOOD_BANK_HANDOFF_DEMONSTRATION_VERSION = '0.1.0';

export function supportsBloodBankHandoffDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsBloodBankHandoff(scenario);
}

export interface BloodBankHandoffDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the pressure that can be bought too cheaply.
 *
 * Read from the latest stage backwards, as the thirty before it are. Every gate
 * is a latch or a cumulative unit count, so none can walk backwards.
 *
 * It transfuses nobody and predicts no outcome for any person.
 */
export function bloodBankHandoffDemonstrationStep(
  patient?: BloodBankHandoffProgress,
): BloodBankHandoffDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.packedRedBloodCellUnits > 0) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Two units in, and the hemoglobin and the calculated oxygen delivery both moved. The comparison worth carrying away is a run that never calls the blood bank at all and gives two litres of crystalloid instead. It nearly works: its mean arterial pressure reaches 67 mmHg against the 68 you just watched, and against 60 for a patient nobody treats. What it costs is the hemoglobin, which falls from 10.2 to 9.1 g/dL — the pressure was bought by diluting the thing that carries the oxygen, and the monitor shows the purchase and not the price. A learner watching only the pressure would rank that run as very nearly a success. One more thing, and it is unusual for this module: reaching for a product BEFORE the release is refused, and the refusal is remembered. A run that grabs blood early, is declined, and then does everything else perfectly still has its red-cell objective capped at partly met for the rest of the case. Almost everywhere else here a refusal costs nothing once heeded; this is the exception. This ends the example, not the evaluation.' };
  }
  if (patient.bloodProductsReleased) {
    return { id: 'transfuse', focus: 'actions', progress: 0.8,
      dispatch: { type: 'blood-product', payload: { productId: 'packed-red-blood-cells', units: 2 } },
      narration: 'Now the red cells, two fixed units. This is the action the third objective reads, and it reads it as hemoglobin and calculated oxygen delivery rather than as pressure — which is the distinction the whole lesson turns on. The units here are an abstraction: no specimen, no compatibility testing, no inventory, no local emergency-release policy.' };
  }
  if (patient.hemorrhageActive) {
    return { id: 'release', focus: 'actions', progress: 0.45,
      dispatch: { type: 'blood-bank-request', payload: {} },
      narration: 'Call the blood bank first — within 60 seconds of the bleeding being declared, and BEFORE reaching for any product. The order is not politeness. Ask for a product before the release and the engine declines it, and unlike almost every other refusal in this module that one is remembered: the objective it belongs to is capped for the rest of the case even if everything afterwards is perfect.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'Nothing is bleeding yet, and the bounded release is unavailable until something is. Every objective here is timed from that moment. Watch the pressure when it starts — and remember that the pressure is not the quantity this lesson is scored on.' };
}
