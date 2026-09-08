import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the extubation-readiness lesson.
 *
 * Six bounded choices with the order enforced: four reviews — quantitative
 * recovery, awake airway protection, spontaneous gas exchange, and airway risk
 * with a rescue plan — and then a decision.
 *
 * The counterfactual is the refusal being heeded. The error path reaches
 * straight for the decision, is refused, and stops. The recovery makes the
 * identical opening and then works through the four reviews properly.
 *
 * The reading this lesson is really for is measured in the tests rather than
 * shipped as a fixture: a path that completes every review and then continues
 * support meets four of the five objectives. Over-caution is an error here, and
 * that is only true because of the numbers. The same complete workup in the
 * emergence-with-residual-blockade lesson, at a ratio of 0.72, makes deferring
 * correct. Nothing about the sequence tells you which patient you have — the
 * checkpoints do.
 */

const CHOOSE = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'extubation-readiness-assessment', payload: { action } });

/** Straight to the decision, and refused for it. */
const decidedFirst: readonly LearnerAction[] = [
  CHOOSE(300, 'ready-for-planned-awake-extubation'),
];

/** The four reviews, in the only order the engine accepts them. */
const reviews = (start: number): readonly LearnerAction[] => [
  CHOOSE(start, 'review-quantitative-recovery'),
  CHOOSE(start + 300, 'review-awake-airway-protection'),
  CHOOSE(start + 600, 'review-spontaneous-gas-exchange'),
  CHOOSE(start + 900, 'review-airway-risk-and-rescue'),
];

export const EXTUBATION_READINESS_FIXTURES = {
  scenarioId: 'extubation-readiness', contentVersion: '0.1.0',
  seed: 9021, ticks: 3000,

  /** Nothing is chosen at all. He stays intubated, unassessed. */
  noAction: [] as readonly LearnerAction[],

  /** Four reviews, then readiness — without simulating tube removal. */
  expert: [
    ...reviews(300),
    CHOOSE(1500, 'ready-for-planned-awake-extubation'),
  ] as readonly LearnerAction[],

  /** The decision reached for first, refused, and not followed up. */
  commonError: decidedFirst,

  /** The identical opening, refused, and then the reviews done properly. */
  recovery: [
    ...decidedFirst,
    ...reviews(600),
    CHOOSE(1800, 'ready-for-planned-awake-extubation'),
  ] as readonly LearnerAction[],
} as const;
