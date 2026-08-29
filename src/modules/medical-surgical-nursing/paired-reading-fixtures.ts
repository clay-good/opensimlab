import type { PairedReadingAction } from './paired-reading';

export const PAIRED_READING_FIXTURES = {
  scenarioId: 'paired-reading-a-number-wrong-in-one-direction', contentVersion: '0.1.0', seed: 4726,
  noAction: [],
  expert: [[0, 'record-the-oximeter-reading'], [1, 'review-boundaries'], [2, 'monitor'],
    [18010, 'record-the-paired-values'], [18011, 'record-what-the-gap-is-not'],
    [18012, 'escalate-on-the-arterial-value'], [18013, 'reassess'],
    [45020, 'reassess'], [45021, 'handoff']],
  commonError: [[0, 'reposition-the-probe'], [1, 'warm-the-hand'],
    [2, 'trust-the-oximeter-trend'], [3, 'the-device-standard-was-fixed'], [9000, 'check-oximeter']],
  recovery: [[0, 'reposition-the-probe'], [1, 'trust-the-oximeter-trend'],
    [2, 'record-the-oximeter-reading'], [3, 'review-boundaries'], [4, 'monitor'],
    [18020, 'record-the-paired-values'], [18021, 'record-what-the-gap-is-not'],
    [18022, 'escalate-on-the-arterial-value'], [18023, 'reassess'],
    [45030, 'reassess'], [45031, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PairedReadingAction])[];
  expert: readonly (readonly [number, PairedReadingAction])[];
  commonError: readonly (readonly [number, PairedReadingAction])[];
  recovery: readonly (readonly [number, PairedReadingAction])[];
};
