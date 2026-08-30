import type { InheritedUrgencyAction } from './inherited-urgency';

export const INHERITED_URGENCY_FIXTURES = {
  scenarioId: 'inherited-urgency-an-emergency-that-mostly-is-not-one', contentVersion: '0.1.0', seed: 2806,
  noAction: [],
  expert: [[0, 'record-the-findings-that-would-make-it-an-emergency'], [1, 'record-that-the-tissue-decides-the-treatment'],
    [2, 'secure-the-diagnostic-pathway'], [3, 'record-bounded-treatment-intent'],
    [4, 'review-boundaries'], [40010, 'reassess'], [40011, 'handoff']],
  commonError: [[0, 'the-swelling-alone-makes-it-an-emergency'], [1, 'start-radiotherapy-tonight-before-the-biopsy'],
    [2, 'send-him-home-to-await-the-biopsy'], [3, 'treat-the-distended-veins-with-a-diuretic'],
    [9000, 'check-observations']],
  recovery: [[0, 'the-swelling-alone-makes-it-an-emergency'], [1, 'start-radiotherapy-tonight-before-the-biopsy'],
    [2, 'record-the-findings-that-would-make-it-an-emergency'], [3, 'record-that-the-tissue-decides-the-treatment'],
    [4, 'secure-the-diagnostic-pathway'], [5, 'record-bounded-treatment-intent'],
    [6, 'review-boundaries'], [40020, 'reassess'], [40021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, InheritedUrgencyAction])[];
  expert: readonly (readonly [number, InheritedUrgencyAction])[];
  commonError: readonly (readonly [number, InheritedUrgencyAction])[];
  recovery: readonly (readonly [number, InheritedUrgencyAction])[];
};
