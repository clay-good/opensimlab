import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot, LearnerAction } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency persistent-VF lesson.
 *
 * Like its PEA sibling, this lesson has no assessment sidecar. It is scored
 * against the generic scripted-arrest mechanics the engine already runs, so the
 * state it reads is the shared `resuscitation` snapshot. Nothing was added to
 * the engine for it.
 */
export type PersistentVfSnapshot = EquipmentSnapshot['resuscitation'];

/**
 * Four recorded facts against four declared objectives.
 *
 * `lastDefibrillationEnergyJ` as well as the count, because the lesson's
 * counterfactual is a shock that was delivered at the wrong setting rather than
 * a shock that was not delivered.
 */
export type PersistentVfProgress = Pick<PersistentVfSnapshot,
  'cardiacArrestActive' | 'chestCompressionsActive' | 'chestCompressionSeconds'
  | 'arrestEpinephrineTotalMg' | 'defibrillationShockCount' | 'lastDefibrillationEnergyJ'
  | 'roscAtTick'>;

/**
 * The four controls this lesson drives.
 *
 * They are NOT the declared objective strings — none overlaps — so the identity
 * guard compares PERSISTENT_VF_OBJECTIVES instead. The fourth is a real button
 * on the same tray: the device offers 120, 150 and 200 J, and only one of them
 * is the setting this case declared.
 */
export const PERSISTENT_VF_ACTIONS = [
  'start-compressions', 'give-one-milligram-epinephrine',
  'deliver-declared-shock', 'deliver-under-energy-shock',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const PERSISTENT_VF_OBJECTIVES = [
  'resume-arrest-compressions',
  'give-arrest-epinephrine',
  'defibrillate-persistent-vf',
  'avoid-shocking-nonshockable-rhythm',
] as const;

export type PersistentVfAction = (typeof PERSISTENT_VF_ACTIONS)[number];

/**
 * What each control actually sends.
 *
 * One mapping, shared by the reference transcripts, the worked example and the
 * tests, so a payload cannot drift between what a fixture replays and what the
 * example demonstrates.
 */
export const PERSISTENT_VF_DISPATCH: Readonly<Record<PersistentVfAction, Omit<LearnerAction, 'tick'>>> = {
  'start-compressions': { type: 'chest-compressions', payload: { active: true } },
  'give-one-milligram-epinephrine': {
    type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 1 },
  },
  'deliver-declared-shock': {
    type: 'defibrillation', payload: { waveform: 'biphasic', energyJ: 200 },
  },
  'deliver-under-energy-shock': {
    type: 'defibrillation', payload: { waveform: 'biphasic', energyJ: 120 },
  },
};

/** The same identity guard the cockpit applies, so nothing reads a look-alike. */
export function supportsPersistentVfArrest(scenario: Scenario): boolean {
  return scenario.metadata.id === 'persistent-vf-arrest'
    && scenario.formulary.length === 0
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'ventricular-fibrillation').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative').length === 2
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PERSISTENT_VF_OBJECTIVES.join('|');
}
