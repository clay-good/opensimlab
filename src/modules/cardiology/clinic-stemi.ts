import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the clinic-STEMI lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type ClinicStemiSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['clinicStemiAssessment']>;

/**
 * The five recorded steps.
 *
 * Five steps and no handoff-to-nowhere, as in the stable-chest-pain lesson,
 * but the shape between them is different: the transfer activation and the
 * danger screen are unordered against each other, and the bridge refuses until
 * both are recorded. One time gate sits before the reassessment and handoff.
 *
 * The declared objective order lists the danger screen before the activation
 * while the tray offers the activation first. That is not an inconsistency —
 * it is the lesson's argument, which is that the call goes out while the
 * screening happens rather than after it.
 *
 * `pciCapableSetting` is a fixed `false`: this is a clinic, and everything the
 * lesson refuses follows from that. `biomarkerDelayUsed` and
 * `downstreamTherapySelected` stay `false` throughout.
 */
export type ClinicStemiProgress = Pick<ClinicStemiSnapshot,
  'patternAtTick' | 'dangerAtTick' | 'transferAtTick' | 'bridgeAtTick' | 'handoffAtTick'>;

export const CLINIC_STEMI_ACTIONS = [
  'reconcile-clinic-stemi-pattern',
  'screen-clinic-stemi-danger',
  'activate-clinic-stemi-transfer',
  'record-clinic-stemi-bridge',
  'reassess-clinic-stemi-handoff',
] as const;

export type ClinicStemiAction = (typeof CLINIC_STEMI_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsClinicStemi(scenario: Scenario): boolean {
  return scenario.metadata.id === 'stemi-recognition-and-first-actions'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'stemi-recognition-and-first-actions').length === 1
    && scenario.timeline.filter((event) => event.target === 'stemi-recognition-and-first-actions-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CLINIC_STEMI_ACTIONS.join('|');
}
