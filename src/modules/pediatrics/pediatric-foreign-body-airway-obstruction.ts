import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the foreign-body airway lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricFbaoSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricForeignBodyAirwayObstructionAssessment']>;

/**
 * The six recorded steps, which are shaped unlike anything else in the module.
 *
 * This engine case authors no refusable choice and its steps are a strict line,
 * but the line is a deterioration ladder with a time gate at every rung rather
 * than one checkpoint at the end. Effective cough, then severe-but-responsive,
 * then unresponsive: three separate elapsed-time gates before the handoff's
 * fourth. The learner is walked down that ladder and the gates are what stop
 * them from arriving at the bottom before the child does.
 *
 * Two fields deserve care. `severeResponsivePulsePresent` is true at the
 * middle rung, and at the bottom `unresponsivePulseStatusUnavailable` becomes
 * true — pulse status is deliberately not supplied. So `pulseLossProven` and
 * `cardiacArrestDeclared` stay `false` throughout: the lesson never lets an
 * unresponsive child with an ECG trace be called an arrest.
 */
export type PediatricFbaoProgress = Pick<PediatricFbaoSnapshot,
  'reconciledAtTick' | 'effectiveCoughAtTick' | 'severeResponsiveAtTick'
  | 'responsivePathwayAtTick' | 'unresponsivePathwayAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_FBAO_ACTIONS = [
  'reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child',
  'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance',
  'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition',
  'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway',
  'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway',
  'handoff-pediatric-foreign-body-airway-obstruction-active-risk',
] as const;

export type PediatricFbaoAction = (typeof PEDIATRIC_FBAO_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. One narrative on the main target and one boundary, all narrative.
 */
export function supportsPediatricFbao(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-foreign-body-airway-obstruction'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-foreign-body-airway-obstruction-reassessment').length === 1
    && scenario.timeline.filter((event) => event.target === 'pediatric-foreign-body-airway-obstruction-reassessment-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_FBAO_ACTIONS.join('|');
}
