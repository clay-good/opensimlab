import type { ProxyScaleAction } from './proxy-scale';

export const PROXY_SCALE_FIXTURES = {
  scenarioId: 'proxy-scale-a-number-without-a-standard', contentVersion: '0.1.0', seed: 6482,
  noAction: [],
  expert: [[0, 'attempt-self-report'], [1, 'record-the-observed-behaviours'],
    [2, 'record-what-the-score-is-not'], [3, 'review-boundaries'], [4, 'monitor'],
    [12010, 'seek-the-proxy-history'], [12011, 'record-analgesic-intent'], [12012, 'reassess'],
    [39020, 'reassess'], [39021, 'handoff']],
  commonError: [[0, 'read-four-as-four-out-of-ten'], [1, 'vitals-confirm-the-pain'],
    [2, 'zero-would-mean-comfortable'], [3, 'wait-until-they-ask'], [9000, 'check-behaviours']],
  recovery: [[0, 'read-four-as-four-out-of-ten'], [1, 'wait-until-they-ask'],
    [2, 'attempt-self-report'], [3, 'record-the-observed-behaviours'],
    [4, 'record-what-the-score-is-not'], [5, 'review-boundaries'], [6, 'monitor'],
    [12020, 'seek-the-proxy-history'], [12021, 'record-analgesic-intent'], [12022, 'reassess'],
    [39030, 'reassess'], [39031, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ProxyScaleAction])[];
  expert: readonly (readonly [number, ProxyScaleAction])[];
  commonError: readonly (readonly [number, ProxyScaleAction])[];
  recovery: readonly (readonly [number, ProxyScaleAction])[];
};
