import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsEarlyMalignantHyperthermia } from '../early-malignant-hyperthermia';

/**
 * What this worked example reads.
 *
 * The twelfth observed-state demonstration in the anaesthesia module, and the
 * only one that has to CAUSE the crisis it then treats. The trigger here is
 * latent — rigidity appears on genuine end-tidal volatile exposure rather than
 * at a scheduled tick — so an example that skipped the maintenance beat would
 * sit in an uneventful anaesthetic forever with nothing to demonstrate.
 *
 * Its ordering fact is the dantrolene total, which only rises. The rigidity
 * fraction cannot sequence anything: it climbs before treatment and falls after
 * it, so a beat gated on "is he rigid" fires again on the way back down.
 */
export interface MalignantHyperthermiaProgress {
  readonly sevofluranePercent: number;
  readonly inspiredOxygenFraction: number;
  readonly freshGasFlowLPerMin: number;
  readonly tidalVolumeMl: number;
  readonly respiratoryRateBpm: number;
  readonly ventilatorDelivering: boolean;
  /** Above zero only once the latent trigger has actually fired. */
  readonly muscleRigidityFraction: number;
  readonly etco2MmHg: number;
  readonly coreTemperatureC: number;
  /** Latches on the accepted 2.5 mg/kg bolus and does not fall. */
  readonly dantroleneTotalMg: number;
}

export const MALIGNANT_HYPERTHERMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMalignantHyperthermiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsEarlyMalignantHyperthermia(scenario);
}

export interface MalignantHyperthermiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/** Everything the rescue objective reads, in one accepted action. */
const RESCUE_SETTINGS = {
  sevofluranePercent: 0, fio2: 1, freshGasFlowLPerMin: 15,
  tidalVolumeMl: 600, respiratoryRateBpm: 24, delivering: true, mode: 'volume-control',
} as const;

/**
 * The worked example for the crisis the anaesthetist starts.
 *
 * Read from the latest stage backwards, as the eleven before it are. Only the
 * dantrolene total orders the later beats, because it is the one quantity here
 * that cannot go back down.
 *
 * It gives no real drug, triggers nothing in anyone, and predicts no outcome.
 */
export function malignantHyperthermiaDemonstrationStep(
  patient?: MalignantHyperthermiaProgress,
): MalignantHyperthermiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.dantroleneTotalMg > 0) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `Trigger off, minute ventilation more than doubled, ${patient.dantroleneTotalMg.toFixed(0)} mg of dantrolene in, and the core temperature at ${patient.coreTemperatureC.toFixed(1)}°C. That last number is the one to argue with. It is barely above where he started, and if you had been waiting for a fever to tell you what was happening you would still be waiting — temperature is a late sign here and the objective deliberately does not ask for it. What told you was the carbon dioxide climbing against a ventilator that had not changed, the tachycardia, and the rigidity. One more caveat about what you have just watched: this example treated so fast that there was very little to reverse, which flatters the reassessment. A run that recognises this a minute later shows the carbon dioxide actually falling, because there was somewhere for it to fall from. This ends the example, not the evaluation.` };
  }
  if (patient.muscleRigidityFraction > 0) {
    if (patient.sevofluranePercent > 0 || patient.inspiredOxygenFraction < 0.95
      || patient.freshGasFlowLPerMin < 10
      || patient.tidalVolumeMl * patient.respiratoryRateBpm < 12_000
      || !patient.ventilatorDelivering) {
      return { id: 'rescue', focus: 'actions', progress: 0.6,
        dispatch: { type: 'ventilator', payload: { ...RESCUE_SETTINGS } },
        narration: `Rigidity with end-tidal carbon dioxide at ${patient.etco2MmHg.toFixed(0)} mmHg and a ventilator nobody has touched. Four things at once, and the objective reads all four: vaporizer to zero, oxygen to 100%, fresh gas to 15 L/min, and minute ventilation more than doubled. Turning the vaporizer off is not enough on its own — the circle is full of the agent, and the flow is what washes it out.` };
    }
    return { id: 'dantrolene', focus: 'actions', progress: 0.85,
      dispatch: { type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 } },
      narration: 'Dantrolene, 2.5 mg/kg intravenously. The engine will accept this dose and no other, which is a teaching bound rather than a dosing claim — what is being demonstrated is that it goes in early, on a pattern rather than on a diagnosis, and that the reconstitution nobody has time for is the reason to have asked for help before you needed the drug.' };
  }
  if (patient.sevofluranePercent > 0) {
    return { id: 'maintaining', focus: 'monitor', progress: 0.3,
      narration: `Sevoflurane running at ${patient.sevofluranePercent.toFixed(1)}% on a low-flow circle, which is an ordinary maintenance and is also, in this patient, the trigger. Nothing on the monitor is wrong yet. Watch the end-tidal carbon dioxide against a ventilator that is not changing — that divergence is the first thing that will move, and it will move before the temperature does.` };
  }
  return { id: 'induce', focus: 'actions', progress: 0.12,
    dispatch: { type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12, freshGasFlowLPerMin: 2, sevofluranePercent: 2 } },
    narration: 'Start the volatile maintenance: 2% sevoflurane, 2 L/min, ventilating. This is the beat that makes this example unlike every other one in the module, because it is the beat that causes what follows. A twenty-four-year-old with an unremarkable history and no family history anyone asked about — the crisis in this lesson is latent, and it is waiting for exactly this.' };
}
