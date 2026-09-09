import type { RisingRequirementAction } from './rising-requirement';

export const RISING_REQUIREMENT_FIXTURES = {
  scenarioId: 'rising-requirement-a-number-that-under-calls', contentVersion: '0.1.0', seed: 4219,
  noAction: [],
  expert: [[0, 'record-the-injury-and-the-clock'], [1, 'record-the-rising-requirement'],
    [2, 'record-what-one-pressure-cannot-decide'], [3, 'escalate-to-the-surgical-team'],
    [4, 'record-bounded-decompression-intent'], [5, 'review-boundaries'], [6, 'reassess'],
    [18010, 'reassess'], [18011, 'handoff']],
  commonError: [[0, 'pulses-are-present-so-perfusion-is-fine'],
    [1, 'the-pressure-was-below-the-threshold'],
    [2, 'increase-analgesia-and-review-in-the-morning'],
    [3, 'wait-for-a-repeat-pressure-before-calling'], [9000, 'check-observations']],
  recovery: [[0, 'the-pressure-was-below-the-threshold'],
    [1, 'wait-for-a-repeat-pressure-before-calling'], [2, 'record-the-injury-and-the-clock'],
    [3, 'record-the-rising-requirement'], [4, 'record-what-one-pressure-cannot-decide'],
    [5, 'escalate-to-the-surgical-team'], [6, 'record-bounded-decompression-intent'],
    [7, 'review-boundaries'], [8, 'reassess'],
    [18020, 'reassess'], [18021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RisingRequirementAction])[];
  expert: readonly (readonly [number, RisingRequirementAction])[];
  commonError: readonly (readonly [number, RisingRequirementAction])[];
  recovery: readonly (readonly [number, RisingRequirementAction])[];
};
