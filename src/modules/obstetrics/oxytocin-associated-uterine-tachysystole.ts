import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the oxytocin-tachysystole lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type OxytocinTachysystoleSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsOxytocinTachysystoleAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined or palpated, no infusion operated, no position changed, no oxygen
 * or fluid delivered, no birth planned — which are constants rather than
 * observations.
 */
export type OxytocinTachysystoleProgress = Pick<OxytocinTachysystoleSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const OXYTOCIN_TACHYSYSTOLE_ACTIONS = [
  'activate-obstetrics-oxytocin-tachysystole-qualified-obstetric-fetal-and-support-response',
  'reconcile-obstetrics-oxytocin-tachysystole-infusion-contraction-fetal-maternal-and-whole-person-context',
  'recognize-obstetrics-oxytocin-tachysystole-with-fetal-heart-deterioration-without-single-trace-closure',
  'review-obstetrics-oxytocin-tachysystole-qualified-source-stop-position-cause-and-birth-readiness',
  'review-obstetrics-oxytocin-tachysystole-fixed-six-minute-qualified-recovery-report',
  'handoff-obstetrics-oxytocin-tachysystole-recurrence-fetal-birth-medication-maternal-and-outcome-risk',
] as const;

export type OxytocinTachysystoleAction = (typeof OXYTOCIN_TACHYSYSTOLE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsOxytocinTachysystole(scenario: Scenario): boolean {
  return scenario.metadata.id === 'oxytocin-associated-uterine-tachysystole'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'oxytocin-associated-uterine-tachysystole-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'oxytocin-associated-uterine-tachysystole-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === OXYTOCIN_TACHYSYSTOLE_ACTIONS.join('|');
}
