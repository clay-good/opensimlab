import type { MeningococcalSepsisAction } from './meningococcal-sepsis';

export const MENINGOCOCCAL_SEPSIS_FIXTURES = {
  scenarioId: 'meningococcal-sepsis-recognition-and-escalation', contentVersion: '0.1.0', seed: 5101,
  noAction: [],
  expert: [[0, 'recognize-rash'], [1, 'call-senior'], [2, 'request-bloods'],
    [3, 'record-antimicrobial-intent'], [4, 'record-fluid-intent'], [5, 'review-boundaries'],
    [6, 'monitor'], [3001, 'reassess'], [36005, 'reassess'], [36006, 'escalate-consultant'],
    [36007, 'reassess'], [36008, 'handoff']],
  commonError: [[0, 'normal-markers-exclude'], [1, 'vaccination-excludes'],
    [2, 'delay-transfer-for-antibiotics'], [9000, 'check-labs']],
  recovery: [[0, 'normal-markers-exclude'], [1, 'vaccination-excludes'], [2, 'recognize-rash'],
    [3, 'call-senior'], [4, 'request-bloods'], [5, 'record-antimicrobial-intent'],
    [6, 'record-fluid-intent'], [7, 'review-boundaries'], [8, 'monitor'], [3002, 'reassess'],
    [36007, 'reassess'], [36008, 'escalate-consultant'], [36009, 'reassess'], [36010, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MeningococcalSepsisAction])[];
  expert: readonly (readonly [number, MeningococcalSepsisAction])[];
  commonError: readonly (readonly [number, MeningococcalSepsisAction])[];
  recovery: readonly (readonly [number, MeningococcalSepsisAction])[];
};
