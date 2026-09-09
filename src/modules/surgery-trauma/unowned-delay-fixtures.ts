import type { UnownedDelayAction } from './unowned-delay';

export const UNOWNED_DELAY_FIXTURES = {
  scenarioId: 'unowned-delay-a-wait-that-nobody-decided', contentVersion: '0.1.0', seed: 7304,
  noAction: [],
  expert: [[0, 'record-the-fracture-and-the-clock'], [1, 'record-what-each-delay-was-for'],
    [2, 'record-what-is-still-being-waited-for'], [3, 'escalate-to-the-team-that-owns-the-list'],
    [4, 'record-bounded-scheduling-intent'], [5, 'review-boundaries'], [6, 'reassess'],
    [7210, 'reassess'], [7211, 'handoff']],
  commonError: [[0, 'she-is-not-fit-until-the-echo-is-done'],
    [1, 'the-list-is-full-so-it-is-out-of-our-hands'],
    [2, 'one-more-night-will-not-make-a-difference'],
    [3, 'keep-her-fasted-in-case-a-slot-appears'], [6500, 'check-observations']],
  recovery: [[0, 'she-is-not-fit-until-the-echo-is-done'],
    [1, 'one-more-night-will-not-make-a-difference'], [2, 'record-the-fracture-and-the-clock'],
    [3, 'record-what-each-delay-was-for'], [4, 'record-what-is-still-being-waited-for'],
    [5, 'escalate-to-the-team-that-owns-the-list'], [6, 'record-bounded-scheduling-intent'],
    [7, 'review-boundaries'], [8, 'reassess'],
    [7220, 'reassess'], [7221, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, UnownedDelayAction])[];
  expert: readonly (readonly [number, UnownedDelayAction])[];
  commonError: readonly (readonly [number, UnownedDelayAction])[];
  recovery: readonly (readonly [number, UnownedDelayAction])[];
};
