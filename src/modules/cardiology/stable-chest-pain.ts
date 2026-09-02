import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the stable-chest-pain lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type StableChestPainSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['stableChestPainAssessment']>;

/**
 * The five recorded steps.
 *
 * Cardiology is shaped differently from the modules given evidence before it.
 * There are five steps rather than six, no handoff, and no time gate anywhere:
 * this is an outpatient evaluation rather than a deteriorating patient, and
 * what the engine enforces is only the order of reasoning — trajectory before
 * characterization, characterization before likelihood, likelihood before
 * testing, testing before the safety net. Nothing here can be rushed because
 * nothing here is racing.
 *
 * Three fixed fields carry the lesson. `clinicalLikelihood` is the literal
 * string 'not-very-low', which is the only estimate the lesson ever makes;
 * `exactScoreCalculated` and `testPerformed` are both fixed `false`.
 */
export type StableChestPainProgress = Pick<StableChestPainSnapshot,
  'stabilityAtTick' | 'patternAtTick' | 'likelihoodAtTick'
  | 'testingAtTick' | 'safetyNetAtTick'>;

export const STABLE_CHEST_PAIN_ACTIONS = [
  'verify-stable-chest-pain-trajectory',
  'characterize-stable-chest-pain-pattern',
  'estimate-stable-chest-pain-clinical-likelihood',
  'record-stable-chest-pain-testing-intent',
  'safety-net-stable-chest-pain-follow-up',
] as const;

export type StableChestPainAction = (typeof STABLE_CHEST_PAIN_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. Five objectives rather than six, which is why this lesson can
 * satisfy the shared observable-objectives cap the pediatrics lessons could
 * not.
 */
export function supportsStableChestPain(scenario: Scenario): boolean {
  return scenario.metadata.id === 'stable-chest-pain-evaluation'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'stable-chest-pain-evaluation').length === 1
    && scenario.timeline.filter((event) => event.target === 'stable-chest-pain-evaluation-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === STABLE_CHEST_PAIN_ACTIONS.join('|');
}
