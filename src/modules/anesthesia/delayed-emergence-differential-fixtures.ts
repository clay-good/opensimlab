import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the delayed-emergence lesson.
 *
 * Six bounded choices and an order the engine enforces: support the patient,
 * reconcile the exposures, check the metabolic causes, examine, and then decide.
 * Nothing can be taken out of turn — a test drives a path that opens with the
 * examination and shows it refused.
 *
 * The counterfactual is the refusal being heeded. The error path reaches
 * straight for the examination and the escalation, is refused twice, and stops.
 * The recovery path makes the identical opening and then works through the
 * sequence properly, meeting all five.
 *
 * A third variant is measured in the tests rather than shipped as a fixture, and
 * it is the sharpest thing here: a path that completes the ENTIRE workup — all
 * four investigative steps, including finding the new asymmetric arm response
 * and gaze preference — and then continues routine recovery observation meets
 * four of the five objectives. The workup is not the decision, and a learner can
 * find the sign and still not act on it.
 */

const CHOOSE = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'delayed-emergence-assessment', payload: { action } });

/** Straight to the answer, and refused twice for it. */
const reachedForTheEnd: readonly LearnerAction[] = [
  CHOOSE(300, 'perform-focused-neurologic-exam'),
  CHOOSE(600, 'urgent-neurologic-evaluation'),
];

/** The sequence the engine will accept, in the only order it accepts it. */
const orderedWorkup = (start: number): readonly LearnerAction[] => [
  CHOOSE(start, 'review-support'),
  CHOOSE(start + 300, 'review-exposure-and-block'),
  CHOOSE(start + 600, 'check-metabolic-causes'),
  CHOOSE(start + 900, 'perform-focused-neurologic-exam'),
];

export const DELAYED_EMERGENCE_FIXTURES = {
  scenarioId: 'delayed-emergence-differential', contentVersion: '0.1.0',
  seed: 5544, ticks: 3600,

  /** Nothing is chosen at all. She stays where she is, unexamined. */
  noAction: [] as readonly LearnerAction[],

  /** Support, reconcile, check, examine, escalate. */
  expert: [
    ...orderedWorkup(300),
    CHOOSE(1500, 'urgent-neurologic-evaluation'),
  ] as readonly LearnerAction[],

  /** The answer reached for first, refused, and not followed up. */
  commonError: reachedForTheEnd,

  /** The identical opening, refused, and then the sequence done properly. */
  recovery: [
    ...reachedForTheEnd,
    ...orderedWorkup(900),
    CHOOSE(2100, 'urgent-neurologic-evaluation'),
  ] as readonly LearnerAction[],
} as const;
