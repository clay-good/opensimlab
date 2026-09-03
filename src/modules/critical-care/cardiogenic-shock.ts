import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the cardiogenic-shock lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type CardiogenicShockSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['cardiogenicShockAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain
 * with no unordered lane and no time gate — the shape eighteen of the
 * nineteen engine-backed critical-care lessons share.
 *
 * The chain places the bridge between the phenotype and the cause control, and
 * that position is the argument. A vasopressor recorded before the phenotype is
 * a guess about a heart nobody has looked at; a device escalated before the
 * culprit vessel is opened is treating the consequence of an artery that is
 * still shut.
 */
export type CardiogenicShockProgress = Pick<CardiogenicShockSnapshot,
  'recognitionAtTick' | 'phenotypeAtTick' | 'bridgeAtTick'
  | 'causeControlAtTick' | 'reassessmentAtTick'>;

export const CARDIOGENIC_SHOCK_ACTIONS = [
  'recognize-cardiogenic-shock-trajectory',
  'review-cardiogenic-shock-cause-and-phenotype',
  'record-cardiogenic-shock-bridge',
  'escalate-cardiogenic-shock-cause-control',
  'reassess-cardiogenic-shock-trajectory',
] as const;

export type CardiogenicShockAction = (typeof CARDIOGENIC_SHOCK_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsCardiogenicShock(scenario: Scenario): boolean {
  return scenario.metadata.id === 'cardiogenic-shock'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'cardiogenic-shock').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'cardiogenic-shock-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CARDIOGENIC_SHOCK_ACTIONS.join('|');
}
