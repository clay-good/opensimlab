import type { MucusPluggingAction } from './mucus-plugging';

/**
 * Reference transcripts for the mucus-plugging lesson.
 *
 * The common-error path is the one visible secretion invites: oxygen and help
 * are arranged and the learner goes straight to suction, skipping the indicator
 * review that would have kept a migrated tube and a pneumothorax on the list.
 * The recovery path skips each intervening step in turn, is refused for both,
 * and still completes from the same positions.
 */
export const MUCUS_PLUGGING_FIXTURES = {
  scenarioId: 'mucus-plugging', contentVersion: '0.1.0', seed: 2806,
  noAction: [],
  expert: [
    [0, 'support-mucus-plugging-and-call-help'],
    [1, 'review-mucus-plugging-indicators'],
    [2, 'record-indicated-airway-suction-intent'],
    [3, 'reassess-mucus-plugging-response'],
    [4, 'escalate-persistent-mucus-plugging'],
  ],
  commonError: [
    [0, 'support-mucus-plugging-and-call-help'],
    // Straight to suction, because the secretion is right there.
    [1, 'record-indicated-airway-suction-intent'],
    [2, 'reassess-mucus-plugging-response'],
  ],
  recovery: [
    // The indicators before oxygen and help have been arranged.
    [0, 'review-mucus-plugging-indicators'],
    [1, 'support-mucus-plugging-and-call-help'],
    [2, 'review-mucus-plugging-indicators'],
    // The escalation before the response that justifies it.
    [3, 'escalate-persistent-mucus-plugging'],
    [4, 'record-indicated-airway-suction-intent'],
    [5, 'reassess-mucus-plugging-response'],
    [6, 'escalate-persistent-mucus-plugging'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MucusPluggingAction])[];
  expert: readonly (readonly [number, MucusPluggingAction])[];
  commonError: readonly (readonly [number, MucusPluggingAction])[];
  recovery: readonly (readonly [number, MucusPluggingAction])[];
};
