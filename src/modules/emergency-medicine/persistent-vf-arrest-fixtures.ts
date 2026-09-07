import type { PersistentVfAction } from './persistent-vf-arrest';

/**
 * Reference transcripts for the emergency persistent-VF lesson.
 *
 * Every path starts at tick 1. The rhythm is a tick-0 timeline event, so the
 * arrest is not active until the engine has stepped once.
 *
 * The engine converts this bounded case on three conditions together: the
 * declared 200 J, an accepted 1 mg arrest dose, and compressions within the
 * last ten seconds. Any shock missing one of them is delivered and does not
 * convert. That is the whole lesson, so both wrong paths here are shocks that
 * were given rather than shocks that were withheld.
 *
 * The common-error path is the energy: compressions and the dose are right, and
 * the device is set to 120 J because the rhythm has already survived two shocks
 * and more effort feels like the answer. The recovery path is the order: the
 * shock before the drug, delivered, not converting, and then the same shock
 * again once the condition it was missing exists.
 */
export const PERSISTENT_VF_FIXTURES = {
  scenarioId: 'persistent-vf-arrest', contentVersion: '0.1.0', seed: 8215,
  noAction: [],
  expert: [
    [1, 'start-compressions'],
    [2, 'give-one-milligram-epinephrine'],
    [3, 'deliver-declared-shock'],
  ],
  commonError: [
    [1, 'start-compressions'],
    [2, 'give-one-milligram-epinephrine'],
    // The device set below the setting this case declared.
    [3, 'deliver-under-energy-shock'],
  ],
  recovery: [
    [1, 'start-compressions'],
    // The shock before the dose one of its conditions names.
    [2, 'deliver-declared-shock'],
    [3, 'give-one-milligram-epinephrine'],
    [4, 'deliver-declared-shock'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PersistentVfAction])[];
  expert: readonly (readonly [number, PersistentVfAction])[];
  commonError: readonly (readonly [number, PersistentVfAction])[];
  recovery: readonly (readonly [number, PersistentVfAction])[];
};
