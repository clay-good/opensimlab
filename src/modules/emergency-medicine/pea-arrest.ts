import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot, LearnerAction } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency PEA-arrest lesson.
 *
 * Unlike the other emergency-medicine lessons, this one has no assessment
 * sidecar of its own. It is scored against the generic scripted-arrest
 * mechanics the engine already runs — compressions, one bounded arrest dose of
 * epinephrine, and the shock this rhythm must not receive — so the state it
 * reads is the shared `resuscitation` snapshot rather than a per-lesson record.
 * Nothing new was added to the engine for it.
 */
export type PeaArrestSnapshot = EquipmentSnapshot['resuscitation'];

/**
 * Three recorded facts against three declared objectives.
 *
 * `chestCompressionSeconds` rather than `chestCompressionsActive` alone,
 * because compressions can be paused: a lesson that asked only whether they are
 * running right now would forget that they ever started.
 */
export type PeaArrestProgress = Pick<PeaArrestSnapshot,
  'cardiacArrestActive' | 'chestCompressionsActive' | 'chestCompressionSeconds'
  | 'arrestEpinephrineTotalMg' | 'defibrillationShockCount'>;

/**
 * The three controls this lesson drives.
 *
 * They are NOT the declared objective strings — none overlaps — so the identity
 * guard compares PEA_ARREST_OBJECTIVES instead. The third is here because the
 * lesson's whole point is that it is available and wrong: the common-error
 * transcript delivers it.
 */
export const PEA_ARREST_ACTIONS = [
  'start-compressions', 'give-one-milligram-epinephrine', 'deliver-biphasic-shock',
] as const;

/** The three declared objectives, in order, as the scenario states them. */
export const PEA_ARREST_OBJECTIVES = [
  'resume-arrest-compressions',
  'give-arrest-epinephrine',
  'avoid-shocking-nonshockable-rhythm',
] as const;

export type PeaArrestAction = (typeof PEA_ARREST_ACTIONS)[number];

/**
 * What each control actually sends.
 *
 * One mapping, shared by the reference transcripts, the worked example and the
 * tests, so a payload cannot drift between what a fixture replays and what the
 * example demonstrates.
 */
export const PEA_ARREST_DISPATCH: Readonly<Record<PeaArrestAction, Omit<LearnerAction, 'tick'>>> = {
  'start-compressions': { type: 'chest-compressions', payload: { active: true } },
  'give-one-milligram-epinephrine': {
    type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 1 },
  },
  'deliver-biphasic-shock': {
    type: 'defibrillation', payload: { waveform: 'biphasic', energyJ: 200 },
  },
};

/** The same identity guard the cockpit applies, so nothing reads a look-alike. */
export function supportsPeaArrest(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pea-arrest'
    && scenario.formulary.length === 0
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'pea').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEA_ARREST_OBJECTIVES.join('|');
}
