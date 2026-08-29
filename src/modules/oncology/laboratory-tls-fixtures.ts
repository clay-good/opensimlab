import type { LaboratoryTlsAction } from './laboratory-tls';

export const LABORATORY_TLS_FIXTURES = {
  scenarioId: 'laboratory-tls-a-syndrome-he-does-not-have-yet', contentVersion: '0.1.0', seed: 3958,
  noAction: [],
  expert: [[0, 'record-which-definition-is-met'], [1, 'record-what-crossed-and-when'],
    [2, 'record-the-crossing-risk'], [3, 'escalate-to-the-treating-team'],
    [4, 'record-bounded-monitoring-and-treatment-intent'], [5, 'review-boundaries'],
    [18010, 'reassess'], [36020, 'reassess'], [36021, 'handoff']],
  commonError: [[0, 'he-is-well-so-it-is-just-numbers'], [1, 'call-it-tumour-lysis-and-move-him-to-intensive-care'],
    [2, 'wait-for-the-next-set-before-telling-anyone'], [3, 'treat-the-potassium-and-stand-down'],
    [9000, 'check-the-bloods']],
  recovery: [[0, 'he-is-well-so-it-is-just-numbers'], [1, 'call-it-tumour-lysis-and-move-him-to-intensive-care'],
    [2, 'record-which-definition-is-met'], [3, 'record-what-crossed-and-when'],
    [4, 'record-the-crossing-risk'], [5, 'escalate-to-the-treating-team'],
    [6, 'record-bounded-monitoring-and-treatment-intent'], [7, 'review-boundaries'],
    [18020, 'reassess'], [36030, 'reassess'], [36031, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, LaboratoryTlsAction])[];
  expert: readonly (readonly [number, LaboratoryTlsAction])[];
  commonError: readonly (readonly [number, LaboratoryTlsAction])[];
  recovery: readonly (readonly [number, LaboratoryTlsAction])[];
};
