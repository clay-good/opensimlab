import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsPersistentVfCardiacArrest } from '../persistent-vf-cardiac-arrest';

/**
 * What this worked example reads.
 *
 * The thirty-sixth observed-state demonstration in the anaesthesia module, and
 * the eleventh to open with a beat that deliberately does nothing: every bounded
 * arrest action is refused until the scripted rhythm change fires.
 *
 * Emergency medicine has a demonstration of the same shape for its own
 * `persistent-vf-arrest` lesson. This is a separate one because that lesson's
 * guard checks its own scenario id, so neither can drive the other.
 */
export interface PersistentVfCardiacArrestProgress {
  readonly arrestActive: boolean;
  readonly compressionsActive: boolean;
  readonly arrestEpinephrineTotalMg: number;
  readonly defibrillationShockCount: number;
  readonly roscAtTick: number | null;
}

export const PERSISTENT_VF_CARDIAC_ARREST_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPersistentVfCardiacArrestDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsPersistentVfCardiacArrest(scenario);
}

export interface PersistentVfCardiacArrestDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the shock that only works with everything else.
 *
 * Read from the latest stage backwards, as the thirty-five before it are. Every
 * gate is a latch or a cumulative count, so none can walk backwards.
 *
 * It resuscitates nobody and predicts no outcome for any person.
 */
export function persistentVfCardiacArrestDemonstrationStep(
  patient?: PersistentVfCardiacArrestProgress,
): PersistentVfCardiacArrestDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.roscAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'An organized rhythm, and the arrest is over. Two things are worth carrying away. The shock is conjunctive rather than sufficient: it converts only with the declared 200 J exactly, 1 mg of epinephrine already given, and compressions recently running. Change any one of those and the shock is still delivered and still counted — 360 J with everything else right does not convert, and neither does 200 J with no epinephrine — which is the difference between a shock being given and a shock working. And the fourth objective, the one about not shocking a non-shockable rhythm, CANNOT BE FAILED in this lesson. The rhythm is ventricular fibrillation for the whole arrest, and once the arrest ends the engine refuses defibrillation outright rather than scoring it, so a run that fires six shocks earns that objective and so does a run that does nothing at all. It is a real principle recorded against a scenario that cannot test it. Limits: every action here is a screen proxy, and there is no post-arrest care in this model at all. This ends the example, not the evaluation.' };
  }
  if (patient.arrestEpinephrineTotalMg >= 1 && patient.compressionsActive) {
    return { id: 'shock', focus: 'actions', progress: 0.85,
      dispatch: { type: 'defibrillation', payload: { waveform: 'biphasic', energyJ: 200 } },
      narration: 'Now defibrillate at 200 J, biphasic. Everything the conversion needs is in place: compressions running, the epinephrine given, the declared energy selected. That conjunction is the lesson — a shock into a fibrillating heart that has had no compressions and no drug is still a shock, and this model will deliver it and leave the rhythm exactly where it was.' };
  }
  if (patient.compressionsActive) {
    return { id: 'epinephrine', focus: 'actions', progress: 0.6,
      dispatch: { type: 'cardiac-arrest-epinephrine', payload: { doseMg: 1, route: 'iv' } },
      narration: 'Give 1 mg of epinephrine intravenously while the compressions run — the dose is exact here, and the engine accepts one milligram and refuses anything else. Giving it during compressions rather than during a pause is the part worth keeping: the circulation that carries it is the one you are providing.' };
  }
  if (patient.arrestActive) {
    return { id: 'compressions', focus: 'actions', progress: 0.3,
      dispatch: { type: 'chest-compressions', payload: { active: true } },
      narration: 'Start compressions — the objective allows 20 seconds from the rhythm change. Start them before reaching for the defibrillator rather than after: the conversion this case is built around requires compressions to have been running recently, so stopping them to prepare a shock is the one thing that reliably makes the shock fail.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'No arrest is running yet, and every bounded arrest action is refused until one is. Nothing to do. Watch the rhythm.' };
}
