import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the minor-stroke lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type MinorStrokeSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyMinorStrokeAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no score
 * calculated, no disability adjudicated, no mimic excluded, and in particular
 * no thrombolysis or antiplatelet eligibility determined — which are constants
 * rather than observations.
 */
export type MinorStrokeProgress = Pick<MinorStrokeSnapshot,
  'trajectoryAtTick' | 'threatsAtTick' | 'boundaryAtTick'
  | 'intentAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const MINOR_STROKE_ACTIONS = [
  'reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient',
  'review-neurology-minor-stroke-imaging-mimics-and-immediate-threats',
  'recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone',
  'record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent',
  'review-neurology-minor-stroke-later-neurologic-trajectory',
  'handoff-neurology-minor-stroke-etiology-recurrence-and-secondary-prevention-risk',
] as const;

export type MinorStrokeAction = (typeof MINOR_STROKE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Unlike the hyperthermic toxicology lessons this one declares no
 * `rhythm-change` event, because nothing about the rhythm is the teaching. Two
 * narratives carry the whole lesson, and that is required by name rather than
 * tolerated.
 */
export function supportsMinorStroke(scenario: Scenario): boolean {
  return scenario.metadata.id === 'minor-nondisabling-acute-ischemic-stroke'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'minor-nondisabling-acute-ischemic-stroke-reassessment').length === 1
    && scenario.timeline.filter((event) => event.target === 'minor-nondisabling-acute-ischemic-stroke-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MINOR_STROKE_ACTIONS.join('|');
}
