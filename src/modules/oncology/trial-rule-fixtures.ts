import type { TrialRuleAction } from './trial-rule';

export const TRIAL_RULE_FIXTURES = {
  scenarioId: 'trial-rule-a-rule-written-for-a-database', contentVersion: '0.1.0', seed: 2814,
  noAction: [],
  expert: [[0, 'record-the-clinical-trajectory-not-just-the-scan'], [1, 'escalate-to-the-treating-team-now'],
    [2, 'record-what-the-criteria-do-and-do-not-govern'], [3, 'record-bounded-treatment-intent'],
    [4, 'review-boundaries'], [40010, 'reassess'], [40011, 'handoff']],
  commonError: [[0, 'the-scan-alone-decides'], [1, 'call-it-pseudoprogression-and-continue'],
    [2, 'rescan-in-eight-weeks-and-review-then'], [3, 'stop-the-immunotherapy-and-tell-her-it-failed'],
    [9000, 'check-observations']],
  recovery: [[0, 'the-scan-alone-decides'], [1, 'call-it-pseudoprogression-and-continue'],
    [2, 'record-the-clinical-trajectory-not-just-the-scan'], [3, 'escalate-to-the-treating-team-now'],
    [4, 'record-what-the-criteria-do-and-do-not-govern'], [5, 'record-bounded-treatment-intent'],
    [6, 'review-boundaries'], [40020, 'reassess'], [40021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, TrialRuleAction])[];
  expert: readonly (readonly [number, TrialRuleAction])[];
  commonError: readonly (readonly [number, TrialRuleAction])[];
  recovery: readonly (readonly [number, TrialRuleAction])[];
};
