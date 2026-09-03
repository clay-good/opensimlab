import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the severe-acidemia lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type SevereAcidemiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['severeAcidemiaAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The analysis step is the one that carries the lesson. A pH of 7.09 invites a
 * treatment, and the expected-compensation arithmetic is what turns it into a
 * diagnosis: bicarbonate 14 predicts a PaCO2 near 29, the actual is 48, and
 * that gap is a second disorder rather than a failing lung doing its best. The
 * engine refuses every stabilization choice until that has been established.
 */
export type SevereAcidemiaProgress = Pick<SevereAcidemiaSnapshot,
  'recognitionAtTick' | 'analysisAtTick' | 'ventilationAtTick'
  | 'causePlanAtTick' | 'reassessmentAtTick'>;

export const SEVERE_ACIDEMIA_ACTIONS = [
  'recognize-severe-acidemia',
  'analyze-severe-acidemia-context',
  'protect-severe-acidemia-ventilation',
  'activate-severe-acidemia-cause-plan',
  'reassess-severe-acidemia-trajectory',
] as const;

export type SevereAcidemiaAction = (typeof SEVERE_ACIDEMIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsSevereAcidemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'severe-acidemia'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'severe-acidemia').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'severe-acidemia-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === SEVERE_ACIDEMIA_ACTIONS.join('|');
}
