import type { QuietChestAction } from './quiet-chest';

export const QUIET_CHEST_FIXTURES = {
  scenarioId: 'quiet-chest-an-injury-whose-severity-is-not-yet-visible', contentVersion: '0.1.0', seed: 8419,
  noAction: [],
  expert: [[0, 'record-the-fall-and-what-was-broken'], [1, 'record-what-comfortable-at-rest-measures'],
    [2, 'record-what-the-count-predicts'], [3, 'escalate-to-the-admitting-team'],
    [4, 'record-bounded-admission-intent'], [5, 'review-boundaries'], [6, 'reassess'],
    [18010, 'reassess'], [18011, 'handoff']],
  commonError: [[0, 'her-numbers-are-normal-so-she-can-go-home'],
    [1, 'there-is-no-pneumothorax-on-the-film'],
    [2, 'she-says-the-pain-is-manageable'],
    [3, 'send-her-home-with-tablets-and-review-in-a-week'], [9500, 'check-observations']],
  recovery: [[0, 'her-numbers-are-normal-so-she-can-go-home'],
    [1, 'she-says-the-pain-is-manageable'], [2, 'record-the-fall-and-what-was-broken'],
    [3, 'record-what-comfortable-at-rest-measures'], [4, 'record-what-the-count-predicts'],
    [5, 'escalate-to-the-admitting-team'], [6, 'record-bounded-admission-intent'],
    [7, 'review-boundaries'], [8, 'reassess'],
    [18020, 'reassess'], [18021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, QuietChestAction])[];
  expert: readonly (readonly [number, QuietChestAction])[];
  commonError: readonly (readonly [number, QuietChestAction])[];
  recovery: readonly (readonly [number, QuietChestAction])[];
};
