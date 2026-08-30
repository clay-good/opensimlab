import type { SilentInteractionAction } from './silent-interaction';

export const SILENT_INTERACTION_FIXTURES = {
  scenarioId: 'silent-interaction-a-harm-with-nothing-to-find', contentVersion: '0.1.0', seed: 2822,
  noAction: [],
  expert: [[0, 'reconcile-what-she-is-actually-taking'], [1, 'record-the-interaction-and-its-direction'],
    [2, 'escalate-to-the-treating-team-now'], [3, 'record-bounded-treatment-intent'],
    [4, 'review-boundaries'], [40010, 'reassess'], [40011, 'handoff']],
  commonError: [[0, 'nothing-is-wrong-so-there-is-nothing-to-do'], [1, 'the-interaction-is-only-theoretical'],
    [2, 'write-it-in-the-notes-and-move-on'], [3, 'tell-her-to-stop-the-acid-tablets-today'],
    [9000, 'check-observations']],
  recovery: [[0, 'nothing-is-wrong-so-there-is-nothing-to-do'], [1, 'write-it-in-the-notes-and-move-on'],
    [2, 'reconcile-what-she-is-actually-taking'], [3, 'record-the-interaction-and-its-direction'],
    [4, 'escalate-to-the-treating-team-now'], [5, 'record-bounded-treatment-intent'],
    [6, 'review-boundaries'], [40020, 'reassess'], [40021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SilentInteractionAction])[];
  expert: readonly (readonly [number, SilentInteractionAction])[];
  commonError: readonly (readonly [number, SilentInteractionAction])[];
  recovery: readonly (readonly [number, SilentInteractionAction])[];
};
