import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the uterine-rupture lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type UterineRuptureSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsUterineRuptureAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no monitoring interpreted, no anesthesia, birth, repair or
 * hysterectomy selected — which are constants rather than observations.
 */
export type UterineRuptureProgress = Pick<UterineRuptureSnapshot,
  'supportAtTick' | 'contextAtTick' | 'uncertaintyAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const UTERINE_RUPTURE_ACTIONS = [
  'activate-obstetrics-suspected-uterine-rupture-category-one-surgery-anesthesia-blood-newborn-and-support-response',
  'reconcile-obstetrics-suspected-uterine-rupture-scar-pain-fetal-heart-station-activity-bleeding-and-whole-person',
  'review-obstetrics-suspected-uterine-rupture-multisignal-nonclassic-triad-and-alternative-cause-boundaries',
  'review-obstetrics-suspected-uterine-rupture-parallel-maternal-fetal-surgical-hemorrhage-fertility-and-communication-readiness',
  'review-obstetrics-suspected-uterine-rupture-fixed-worsening-and-laparotomy-start-report',
  'handoff-obstetrics-suspected-uterine-rupture-maternal-fetal-hemorrhage-surgery-newborn-fertility-support-and-outcome-risk',
] as const;

export type UterineRuptureAction = (typeof UTERINE_RUPTURE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsUterineRupture(scenario: Scenario): boolean {
  return scenario.metadata.id === 'suspected-uterine-rupture-recognition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'suspected-uterine-rupture-recognition-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'suspected-uterine-rupture-recognition-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === UTERINE_RUPTURE_ACTIONS.join('|');
}
