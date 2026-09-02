import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the support-selection lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps — including, uniquely in this module, the
 * wrong turn they most recently took.
 */
export type NoninvasiveVentilationSelectionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['noninvasiveVentilationSelectionAssessment']>;

/**
 * The six recorded steps, plus the last unsupported device choice.
 *
 * `lastUnsupportedChoice` is not a step — it is how the engine reports that
 * CPAP alone or high-flow nasal oxygen alone was just offered and refused,
 * with the patient unchanged. The tutor reads it so it can answer the choice
 * that was actually made.
 */
export type NoninvasiveVentilationSelectionProgress = Pick<NoninvasiveVentilationSelectionSnapshot,
  'trajectoryAtTick' | 'suitabilityAtTick' | 'selectionAtTick'
  | 'responseAtTick' | 'failureGuardsAtTick' | 'handoffAtTick' | 'lastUnsupportedChoice'>;

export const NIV_SELECTION_ACTIONS = [
  'reconcile-noninvasive-ventilation-selection-treatment-and-trajectory',
  'review-noninvasive-ventilation-selection-suitability-and-rescue-readiness',
  'select-bilevel-noninvasive-ventilation',
  'review-noninvasive-ventilation-selection-early-response',
  'review-noninvasive-ventilation-selection-failure-guards',
  'handoff-noninvasive-ventilation-selection-reassessment',
] as const;

/**
 * The two support goals this lesson offers and refuses.
 *
 * They are not objectives and they are not mistakes of sequence. They are
 * clinically wrong answers to a question the lesson deliberately asks.
 */
export const NIV_SELECTION_UNSUPPORTED_ACTIONS = [
  'select-cpap-alone',
  'select-high-flow-nasal-oxygen-alone',
] as const;

export type NoninvasiveVentilationSelectionAction =
  (typeof NIV_SELECTION_ACTIONS)[number] | (typeof NIV_SELECTION_UNSUPPORTED_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsNoninvasiveVentilationSelection(scenario: Scenario): boolean {
  return scenario.metadata.id === 'noninvasive-ventilation-selection'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'noninvasive-ventilation-selection').length === 3
    && scenario.timeline.filter((event) => event.target === 'noninvasive-ventilation-selection-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === NIV_SELECTION_ACTIONS.join('|');
}
