import type { DelayedImmuneEventAction } from './delayed-immune-event';

export const DELAYED_IMMUNE_EVENT_FIXTURES = {
  scenarioId: 'delayed-immune-event-a-drug-that-stopped-months-ago', contentVersion: '0.1.0', seed: 5177,
  noAction: [],
  expert: [[0, 'record-the-completed-exposure'], [1, 'record-the-symptom-course'],
    [2, 'record-infection-evaluation-in-parallel'], [27010, 'escalate-to-the-treating-service'],
    [27011, 'record-bounded-treatment-intent'], [27012, 'review-boundaries'], [27013, 'reassess'],
    [63020, 'reassess'], [63021, 'handoff']],
  commonError: [[0, 'stopped-months-ago-so-not-the-drug'], [1, 'slow-the-gut-and-review-tomorrow'],
    [2, 'wait-for-stool-results-before-escalating'], [3, 'discharge-with-oral-rehydration'],
    [9000, 'check-observations']],
  recovery: [[0, 'stopped-months-ago-so-not-the-drug'], [1, 'wait-for-stool-results-before-escalating'],
    [2, 'record-the-completed-exposure'], [3, 'record-the-symptom-course'],
    [4, 'record-infection-evaluation-in-parallel'], [27020, 'escalate-to-the-treating-service'],
    [27021, 'record-bounded-treatment-intent'], [27022, 'review-boundaries'], [27023, 'reassess'],
    [63030, 'reassess'], [63031, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, DelayedImmuneEventAction])[];
  expert: readonly (readonly [number, DelayedImmuneEventAction])[];
  commonError: readonly (readonly [number, DelayedImmuneEventAction])[];
  recovery: readonly (readonly [number, DelayedImmuneEventAction])[];
};
