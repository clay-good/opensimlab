import type { KnownLabelAction } from './known-label';

export const KNOWN_LABEL_FIXTURES = {
  scenarioId: 'known-label-an-explanation-that-excludes-nothing', contentVersion: '0.1.0', seed: 3628,
  noAction: [],
  expert: [[0, 'record-the-label-and-what-it-explains'], [1, 'record-what-has-changed-according-to-someone-who-knows-him'],
    [2, 'record-what-the-label-cannot-exclude'], [3, 'escalate-to-the-surgical-team'],
    [4, 'record-bounded-adjustment-intent'], [5, 'review-boundaries'], [6, 'reassess'],
    [21010, 'reassess'], [21011, 'handoff']],
  commonError: [[0, 'this-is-his-baseline-behaviour'],
    [1, 'the-notes-say-chronic-constipation'],
    [2, 'he-cannot-tell-us-where-it-hurts-so-we-cannot-assess-him'],
    [3, 'give-him-something-for-his-bowels-and-review'], [9000, 'check-observations']],
  recovery: [[0, 'this-is-his-baseline-behaviour'],
    [1, 'the-notes-say-chronic-constipation'], [2, 'record-the-label-and-what-it-explains'],
    [3, 'record-what-has-changed-according-to-someone-who-knows-him'], [4, 'record-what-the-label-cannot-exclude'],
    [5, 'escalate-to-the-surgical-team'], [6, 'record-bounded-adjustment-intent'],
    [7, 'review-boundaries'], [8, 'reassess'],
    [21020, 'reassess'], [21021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, KnownLabelAction])[];
  expert: readonly (readonly [number, KnownLabelAction])[];
  commonError: readonly (readonly [number, KnownLabelAction])[];
  recovery: readonly (readonly [number, KnownLabelAction])[];
};
