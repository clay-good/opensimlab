import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the right-ventricular infarction
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type RightVentricularInfarctionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['rightVentricularInfarctionAssessment']>;

/**
 * Five recorded steps against five declared objectives, an unordered pair, and
 * one time gate — and the pair is doing something none of the other cardiology
 * lessons asks of it.
 *
 * After the trajectory is reconciled, the RV phenotype review and the
 * reperfusion-readiness lane are both available in either order. The support
 * guardrails then require the phenotype, and the handoff requires reperfusion
 * and support together. So the reperfusion lane is never a prerequisite for
 * anything except the ending: a learner can go phenotype, support, reperfusion
 * and finish, and the structure makes the point the lesson exists for — the
 * right-sided thinking runs alongside reperfusion and can never be a reason to
 * delay it.
 *
 * `initialPulsePresent` is a fixed `true`, and every one of the twelve
 * restraint flags — including `nitrateSelected`, `diureticSelected`,
 * `blindFluidLoading` and `pciPerformed` — stays `false`.
 */
export type RightVentricularInfarctionProgress = Pick<RightVentricularInfarctionSnapshot,
  'reconciledAtTick' | 'phenotypeAtTick' | 'reperfusionAtTick'
  | 'supportAtTick' | 'handoffAtTick'>;

export const RIGHT_VENTRICULAR_INFARCTION_ACTIONS = [
  'reconcile-right-ventricular-infarction',
  'review-right-ventricular-infarction-phenotype',
  'preserve-right-ventricular-infarction-reperfusion',
  'record-right-ventricular-infarction-support',
  'handoff-right-ventricular-infarction',
] as const;

export type RightVentricularInfarctionAction = (typeof RIGHT_VENTRICULAR_INFARCTION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. As in the tamponade lesson there is no rhythm-change event: two
 * narratives share the lesson target and a third carries the boundary.
 */
export function supportsRightVentricularInfarction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'right-ventricular-infarction'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'right-ventricular-infarction').length === 2
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'right-ventricular-infarction-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === RIGHT_VENTRICULAR_INFARCTION_ACTIONS.join('|');
}
