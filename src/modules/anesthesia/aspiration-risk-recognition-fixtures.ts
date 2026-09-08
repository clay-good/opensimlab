import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the aspiration-risk lesson.
 *
 * Five bounded choices — a cue review, two classifications and two dispositions
 * — with the order enforced by the engine: nothing can be classified before the
 * cues are reviewed, and no disposition chosen before a classification.
 *
 * The counterfactual isolates the disposition. The error and the recovery are
 * identical for their first two actions — review the cues, then call an
 * escalating GLP-1 dose with active symptoms a routine fasting risk — and differ
 * only in the third: proceed on the day, or defer and replan.
 *
 * Deferring after the wrong classification earns partial credit on that one
 * objective and nothing else. The fourth objective is the reason: it is not
 * earned by an action at all.
 */

const CHOOSE = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'aspiration-risk-assessment', payload: { action } });

/** Reviewed, and then the pattern called ordinary. */
const calledItRoutine: readonly LearnerAction[] = [
  CHOOSE(300, 'review-cues'),
  CHOOSE(600, 'classify-routine'),
];

export const ASPIRATION_RISK_FIXTURES = {
  scenarioId: 'aspiration-risk-recognition', contentVersion: '0.1.0',
  seed: 7180, ticks: 3600,

  /** Nothing is chosen at all. The list is never opened. */
  noAction: [] as readonly LearnerAction[],

  /** Cues together, the pattern named, and an elective case moved. */
  expert: [
    CHOOSE(300, 'review-cues'),
    CHOOSE(600, 'classify-elevated'),
    CHOOSE(900, 'defer-and-replan'),
  ] as readonly LearnerAction[],

  /** The pattern called ordinary, and the list proceeding on the day. */
  commonError: [...calledItRoutine, CHOOSE(900, 'proceed-routine')] as readonly LearnerAction[],

  /** The identical misreading, and the cautious disposition anyway. */
  recovery: [...calledItRoutine, CHOOSE(900, 'defer-and-replan')] as readonly LearnerAction[],
} as const;
