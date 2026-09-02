import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the autonomic-dysreflexia lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type DysreflexiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyAutonomicDysreflexiaAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no catheter
 * manipulated, no bowel care performed, no drug selected, and in particular no
 * sole cause proven — which are constants rather than observations. This is the
 * one lesson in the module where the learner physically changes something, and
 * `externalTubingKinkReleased` is the whole of it.
 */
export type DysreflexiaProgress = Pick<DysreflexiaSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'triggerAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const DYSREFLEXIA_ACTIONS = [
  'reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient',
  'recognize-neurology-autonomic-dysreflexia-pattern-without-closing-alternatives-or-definitive-diagnosis',
  'activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership',
  'review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role',
  'reassess-neurology-autonomic-dysreflexia-strict-pressure-pulse-symptom-and-trigger-transition',
  'handoff-neurology-autonomic-dysreflexia-baseline-triggers-recurrence-complications-prevention-and-active-risk',
] as const;

export type DysreflexiaAction = (typeof DYSREFLEXIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Three narratives carry this lesson, because the baseline-relative pattern and
 * the trigger boundary each need one of their own. That shape is required by
 * name rather than tolerated.
 */
export function supportsDysreflexia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'autonomic-dysreflexia-authored-trigger'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'autonomic-dysreflexia-authored-trigger-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'autonomic-dysreflexia-authored-trigger-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DYSREFLEXIA_ACTIONS.join('|');
}
