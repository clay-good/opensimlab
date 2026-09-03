import type { SevereAcidemiaAction } from './severe-acidemia';

/**
 * Reference transcripts for the severe-acidemia lesson.
 *
 * The common-error path is the one a pH of 7.09 invites: the severity is
 * recognised and the learner goes straight to stabilizing the ventilation,
 * without the compensation arithmetic that shows the respiratory half is a
 * second disorder rather than a lung doing its best. The recovery path skips
 * each intervening step in turn, is refused for both, and still completes from
 * the same positions.
 */
export const SEVERE_ACIDEMIA_FIXTURES = {
  scenarioId: 'severe-acidemia', contentVersion: '0.1.0', seed: 3941,
  noAction: [],
  expert: [
    [0, 'recognize-severe-acidemia'],
    [1, 'analyze-severe-acidemia-context'],
    [2, 'protect-severe-acidemia-ventilation'],
    [3, 'activate-severe-acidemia-cause-plan'],
    [4, 'reassess-severe-acidemia-trajectory'],
  ],
  commonError: [
    [0, 'recognize-severe-acidemia'],
    // Straight to ventilation, without the arithmetic that justifies it.
    [1, 'protect-severe-acidemia-ventilation'],
    [2, 'activate-severe-acidemia-cause-plan'],
  ],
  recovery: [
    // The analysis before the severity has been recognised.
    [0, 'analyze-severe-acidemia-context'],
    [1, 'recognize-severe-acidemia'],
    [2, 'analyze-severe-acidemia-context'],
    // The cause plan before the ventilation that buys time for it.
    [3, 'activate-severe-acidemia-cause-plan'],
    [4, 'protect-severe-acidemia-ventilation'],
    [5, 'activate-severe-acidemia-cause-plan'],
    [6, 'reassess-severe-acidemia-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SevereAcidemiaAction])[];
  expert: readonly (readonly [number, SevereAcidemiaAction])[];
  commonError: readonly (readonly [number, SevereAcidemiaAction])[];
  recovery: readonly (readonly [number, SevereAcidemiaAction])[];
};
