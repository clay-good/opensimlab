import type { NecrotizingInfectionAction } from './necrotizing-infection';

export const NECROTIZING_INFECTION_FIXTURES = {
  scenarioId: 'necrotizing-infection-score-cannot-exclude', contentVersion: '0.1.0', seed: 5411,
  noAction: [],
  expert: [[0, 'recognize-disproportionate-pain'], [1, 'mark-the-margin'], [2, 'call-surgery'],
    [3, 'record-antimicrobial-intent'], [4, 'review-boundaries'], [5, 'monitor'],
    [3001, 'reassess'], [144005, 'reassess'], [144006, 'handoff']],
  commonError: [[0, 'score-excludes'], [1, 'absent-crepitus-excludes'], [2, 'wait-for-imaging'],
    [3, 'continue-oral-antibiotics'], [9000, 'check-labs']],
  recovery: [[0, 'score-excludes'], [1, 'wait-for-imaging'], [2, 'recognize-disproportionate-pain'],
    [3, 'mark-the-margin'], [4, 'call-surgery'], [5, 'record-antimicrobial-intent'],
    [6, 'review-boundaries'], [7, 'monitor'], [3002, 'reassess'], [144007, 'reassess'], [144008, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NecrotizingInfectionAction])[];
  expert: readonly (readonly [number, NecrotizingInfectionAction])[];
  commonError: readonly (readonly [number, NecrotizingInfectionAction])[];
  recovery: readonly (readonly [number, NecrotizingInfectionAction])[];
};
