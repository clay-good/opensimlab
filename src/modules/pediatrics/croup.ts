import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the croup lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps — including the wrong turn they most recently
 * took.
 */
export type CroupSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['croupAssessment']>;

/**
 * The six recorded steps, plus the last unsupported choice.
 *
 * Unlike the first two lessons in this module, this engine case clears
 * `lastUnsupportedChoice` when a correct step is recorded, so a stale value
 * never reaches a later beat here.
 */
export type CroupProgress = Pick<CroupSnapshot,
  'patternAtTick' | 'severityAtTick' | 'treatmentIntentAtTick'
  | 'earlyResponseAtTick' | 'recurrenceAtTick' | 'handoffAtTick' | 'lastUnsupportedChoice'>;

export const CROUP_ACTIONS = [
  'reconcile-croup-whole-child-upper-airway-pattern',
  'review-croup-severity-and-alternative-red-flags',
  'record-croup-minimal-distress-support-and-qualified-treatment-intent',
  'review-croup-early-response',
  'review-croup-recurrence-and-preserve-airway-readiness',
  'handoff-croup-active-upper-airway-risk',
] as const;

/**
 * The four choices this lesson offers and refuses, at two separate moments.
 *
 * Two of them would upset a child whose airway narrows when she cries — a
 * bronchodilator for a noise that is not bronchospasm, and a neck film that
 * means a cold room and a flat table. The other two misread her: discharging
 * on the peak of a nebulized-epinephrine effect that wears off, and treating
 * a normal saturation as low risk when hypoxemia is a late finding above the
 * cords.
 */
export const CROUP_UNSUPPORTED_ACTIONS = [
  'select-croup-albuterol-for-stridor',
  'wait-for-croup-neck-radiograph',
  'discharge-croup-after-early-response',
  'treat-croup-normal-saturation-as-low-risk',
] as const;

export type CroupAction =
  (typeof CROUP_ACTIONS)[number] | (typeof CROUP_UNSUPPORTED_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * As throughout this module, the timeline targets carry a `-reassessment`
 * suffix that the scenario id does not.
 */
export function supportsCroup(scenario: Scenario): boolean {
  return scenario.metadata.id === 'croup'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'croup-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'croup-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CROUP_ACTIONS.join('|');
}
