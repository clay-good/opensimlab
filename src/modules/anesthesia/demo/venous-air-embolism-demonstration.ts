import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsVenousAirEmbolism } from '../venous-air-embolism-during-line-removal';

/**
 * What this worked example reads.
 *
 * The twenty-seventh observed-state demonstration in the anaesthesia module, and
 * the fourth to open with a beat that deliberately does nothing: the bounded
 * source-control action is refused before the scripted event, and every
 * objective is timed from it.
 */
export interface VenousAirEmbolismProgress {
  readonly severity: number;
  readonly helpRequestedAtTick: number | null;
  readonly entryControlled: boolean;
  readonly ventilatorDelivering: boolean;
  readonly inspiredOxygenFraction: number;
}

export const VENOUS_AIR_EMBOLISM_DEMONSTRATION_VERSION = '0.1.0';

export function supportsVenousAirEmbolismDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsVenousAirEmbolism(scenario);
}

export interface VenousAirEmbolismDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the treatment that is scored and the one that works.
 *
 * Read from the latest stage backwards, as the twenty-six before it are. Every
 * gate is a latched tick or a boolean that only turns on, so none can reverse.
 *
 * It removes nobody's line and predicts no outcome for any person.
 */
export function venousAirEmbolismDemonstrationStep(
  patient?: VenousAirEmbolismProgress,
): VenousAirEmbolismDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.entryControlled && patient.ventilatorDelivering
    && patient.inspiredOxygenFraction >= 1) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The capnogram is climbing back and the pressure with it. The comparison worth carrying away is between two runs that each look competent. A run that recognises the change, calls for help promptly, and turns the oxygen to 100% with active delivery — everything you just watched except the source control — earns the oxygenation objective and ends with an end-tidal carbon dioxide of 17 mmHg and a mean arterial pressure of 53. A run that does nothing at all ends at 16 and 55. The oxygen is scored and buys nothing measurable. Meanwhile the source control ALONE, one action scoring two of the four objectives, brings the pressure back to 92 and the carbon dioxide to 35 — very nearly this patient\'s starting numbers. Two more things worth naming. The saturation is not the instrument here: it sits between 91% and 100% on every path, including the one that does nothing, so a learner watching the oximeter sees almost no signal while the capnogram falls by twenty millimetres of mercury. And stopping the entry late still works — the run that closes the source at 80 seconds loses that objective permanently and recovers the patient anyway. This ends the example, not the evaluation.' };
  }
  if (patient.entryControlled) {
    return { id: 'oxygen', focus: 'actions', progress: 0.8,
      dispatch: { type: 'ventilator',
        payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
      narration: 'Now 100% oxygen with active breath delivery, inside 60 seconds. The reasoning is sound and worth keeping even though this bounded model will not show you its benefit: high inspired oxygen washes nitrogen out of the circulation and gives an air bubble somewhere to go. Do it because the physiology is right, not because the monitor will thank you.' };
  }
  if (patient.helpRequestedAtTick !== null) {
    return { id: 'stop-entry', focus: 'actions', progress: 0.55,
      dispatch: { type: 'control-venous-air-entry', payload: { method: 'stop-entry' } },
      narration: 'Stop further air entering — this is the action the patient actually responds to. Occlude the site, lower it below the heart, flood the field: the intent is what is recorded here rather than the technique. Everything else in this lesson treats the consequences of air that has already arrived; only this stops more of it, and the objective allows 30 seconds.' };
  }
  if (patient.severity > 0.05) {
    return { id: 'escalate', focus: 'actions', progress: 0.3,
      dispatch: { type: 'call-for-help', payload: { context: 'venous-air-embolism' } },
      narration: 'Call for help — 30 seconds is the window. The pattern to recognise is a capnogram that has fallen abruptly with the pressure while the saturation has barely moved, during or just after a line coming out. That combination is the diagnosis; waiting for the oximeter to agree is waiting for a number that will not change much.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'Nothing has happened yet, and this beat waits deliberately. Every objective here is timed from the moment the event begins, and the bounded source-control action is refused before then, so acting early records nothing. Watch the end-tidal carbon dioxide rather than the saturation.' };
}
