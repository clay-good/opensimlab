import type { DeferredStepAction } from './deferred-step';

export const DEFERRED_STEP_FIXTURES = {
  scenarioId: 'deferred-step-a-decision-attached-to-a-person', contentVersion: '0.1.0', seed: 4870,
  noAction: [],
  expert: [[0, 'record-the-injury-and-the-clock'], [1, 'record-the-step-that-is-waiting'],
    [2, 'record-what-the-interval-is-attached-to'], [3, 'escalate-to-the-team-that-can-prescribe'],
    [4, 'record-bounded-prescribing-intent'], [5, 'review-boundaries'], [6, 'reassess'],
    [4810, 'reassess'], [4811, 'handoff']],
  commonError: [[0, 'orthopaedics-will-give-them-when-they-review-her'],
    [1, 'she-is-stable-so-there-is-no-hurry'],
    [2, 'it-can-go-on-the-morning-drug-chart'],
    [3, 'wait-until-she-is-in-theatre-anyway'], [5200, 'check-observations']],
  recovery: [[0, 'orthopaedics-will-give-them-when-they-review-her'],
    [1, 'she-is-stable-so-there-is-no-hurry'], [2, 'record-the-injury-and-the-clock'],
    [3, 'record-the-step-that-is-waiting'], [4, 'record-what-the-interval-is-attached-to'],
    [5, 'escalate-to-the-team-that-can-prescribe'], [6, 'record-bounded-prescribing-intent'],
    [7, 'review-boundaries'], [8, 'reassess'],
    [4820, 'reassess'], [4821, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, DeferredStepAction])[];
  expert: readonly (readonly [number, DeferredStepAction])[];
  commonError: readonly (readonly [number, DeferredStepAction])[];
  recovery: readonly (readonly [number, DeferredStepAction])[];
};
