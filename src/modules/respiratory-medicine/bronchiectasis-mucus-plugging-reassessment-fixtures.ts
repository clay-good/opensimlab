import type { BronchiectasisMucusPluggingAction } from './bronchiectasis-mucus-plugging-reassessment';

/**
 * Reference transcripts for the mucus-plugging lesson.
 *
 * The error path is the one a confident CT invites: skip the clearance intent
 * and go straight to reviewing a response that nobody has produced yet. It is
 * an ordering error rather than a treatment error, because this lesson
 * performs no clearance. What it skips is the respiratory-physiotherapy review
 * and the supported trial — the thing that actually moves the secretions.
 */
export const BRONCHIECTASIS_MUCUS_PLUGGING_FIXTURES = {
  scenarioId: 'bronchiectasis-mucus-plugging-reassessment', contentVersion: '0.1.0', seed: 7412,
  noAction: [],
  expert: [
    [0, 'reconcile-bronchiectasis-mucus-plugging-trajectory'],
    [1, 'review-bronchiectasis-mucus-plugging-evidence-and-alternatives'],
    [2, 'record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent'],
    [3, 'review-bronchiectasis-mucus-plugging-later-response'],
    [4, 'escalate-bronchiectasis-mucus-plugging-persistent-collapse'],
    [5, 'handoff-bronchiectasis-mucus-plugging-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-bronchiectasis-mucus-plugging-trajectory'],
    [1, 'review-bronchiectasis-mucus-plugging-evidence-and-alternatives'],
    [2, 'review-bronchiectasis-mucus-plugging-later-response'],
  ],
  recovery: [
    [0, 'reconcile-bronchiectasis-mucus-plugging-trajectory'],
    [1, 'review-bronchiectasis-mucus-plugging-evidence-and-alternatives'],
    [2, 'review-bronchiectasis-mucus-plugging-later-response'],
    [3, 'record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent'],
    [4, 'review-bronchiectasis-mucus-plugging-later-response'],
    [5, 'escalate-bronchiectasis-mucus-plugging-persistent-collapse'],
    [6, 'handoff-bronchiectasis-mucus-plugging-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, BronchiectasisMucusPluggingAction])[];
  expert: readonly (readonly [number, BronchiectasisMucusPluggingAction])[];
  commonError: readonly (readonly [number, BronchiectasisMucusPluggingAction])[];
  recovery: readonly (readonly [number, BronchiectasisMucusPluggingAction])[];
};
