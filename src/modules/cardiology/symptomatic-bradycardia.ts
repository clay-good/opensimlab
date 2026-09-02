import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the symptomatic sinus-bradycardia
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type SymptomaticBradycardiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['symptomaticBradycardiaAssessment']>;

/**
 * Five recorded steps against five declared objectives, and no time gates.
 *
 * The shape that makes this lesson different from its cardiology siblings is
 * the unordered pair in the middle: reviewing reversible context and
 * correlating the ambulatory record may happen in either order, but the
 * pacing evaluation refuses until both have landed. The engine enforces that
 * with a single combined guard rather than a chain, so a learner who does
 * them the other way round is not corrected for it.
 *
 * `hemodynamicallyStable` is a fixed `true`, `mechanismProven` a fixed
 * `false` — sinus-node dysfunction is never diagnosed here — and
 * `treatmentDelivered` stays `false`.
 */
export type SymptomaticBradycardiaProgress = Pick<SymptomaticBradycardiaSnapshot,
  'stabilityAtTick' | 'contextAtTick' | 'correlationAtTick'
  | 'pacingEvaluationAtTick' | 'handoffAtTick'>;

export const SYMPTOMATIC_BRADYCARDIA_ACTIONS = [
  'reconcile-symptomatic-bradycardia-stability',
  'review-symptomatic-bradycardia-context',
  'correlate-symptomatic-bradycardia-record',
  'record-symptomatic-bradycardia-pacing-evaluation',
  'handoff-symptomatic-bradycardia-plan',
] as const;

export type SymptomaticBradycardiaAction = (typeof SYMPTOMATIC_BRADYCARDIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. Here the action ids and the objective ids are the same five
 * strings in the same order, which is not true of every cardiology lesson.
 */
export function supportsSymptomaticBradycardia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'symptomatic-sinus-bradycardia-reassessment'
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'sinus-bradycardia').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'symptomatic-sinus-bradycardia-reassessment').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'symptomatic-sinus-bradycardia-reassessment-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === SYMPTOMATIC_BRADYCARDIA_ACTIONS.join('|');
}
