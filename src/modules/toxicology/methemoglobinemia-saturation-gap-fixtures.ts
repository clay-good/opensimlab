import type { MethemoglobinemiaAction } from './methemoglobinemia-saturation-gap';

/**
 * Reference transcripts for the methemoglobinemia lesson.
 *
 * The error path is the shortcut this bedside invites: the blood is brown and
 * the pattern is named, so reach straight for the antidote. It is an ordering
 * error rather than a treatment error, because this lesson delivers no
 * treatment — but the two steps it skips are the ones that stop the oxidant,
 * call the people who own her, and put the G6PD and serotonergic hazards on the
 * table before anybody commits. The recovery path starts from exactly that
 * refusal and still reaches a correct handoff in the same run.
 */
export const METHEMOGLOBINEMIA_FIXTURES = {
  scenarioId: 'methemoglobinemia-saturation-gap', contentVersion: '0.1.0', seed: 5271,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-methemoglobinemia-exposure-cyanosis-symptoms-pulse-ox-arterial-oxygen-and-whole-patient'],
    [1, 'recognize-toxicology-methemoglobinemia-dyshemoglobin-pattern-without-single-number-or-diagnostic-closure'],
    [2, 'activate-toxicology-methemoglobinemia-support-monitoring-source-control-poison-center-and-critical-care-ownership'],
    [3, 'review-toxicology-methemoglobinemia-supplied-cooximetry-and-methylene-blue-hazard-boundary'],
    [4, 'record-toxicology-methemoglobinemia-bounded-qualified-team-antidote-intent-and-strict-reassessment'],
    [5, 'handoff-toxicology-methemoglobinemia-exposure-rebound-hemolysis-serotonin-rescue-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-methemoglobinemia-exposure-cyanosis-symptoms-pulse-ox-arterial-oxygen-and-whole-patient'],
    [1, 'recognize-toxicology-methemoglobinemia-dyshemoglobin-pattern-without-single-number-or-diagnostic-closure'],
    [2, 'record-toxicology-methemoglobinemia-bounded-qualified-team-antidote-intent-and-strict-reassessment'],
    [3, 'handoff-toxicology-methemoglobinemia-exposure-rebound-hemolysis-serotonin-rescue-and-active-risk'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-methemoglobinemia-exposure-cyanosis-symptoms-pulse-ox-arterial-oxygen-and-whole-patient'],
    [1, 'recognize-toxicology-methemoglobinemia-dyshemoglobin-pattern-without-single-number-or-diagnostic-closure'],
    [2, 'record-toxicology-methemoglobinemia-bounded-qualified-team-antidote-intent-and-strict-reassessment'],
    [3, 'activate-toxicology-methemoglobinemia-support-monitoring-source-control-poison-center-and-critical-care-ownership'],
    [4, 'review-toxicology-methemoglobinemia-supplied-cooximetry-and-methylene-blue-hazard-boundary'],
    [5, 'record-toxicology-methemoglobinemia-bounded-qualified-team-antidote-intent-and-strict-reassessment'],
    [6, 'handoff-toxicology-methemoglobinemia-exposure-rebound-hemolysis-serotonin-rescue-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MethemoglobinemiaAction])[];
  expert: readonly (readonly [number, MethemoglobinemiaAction])[];
  commonError: readonly (readonly [number, MethemoglobinemiaAction])[];
  recovery: readonly (readonly [number, MethemoglobinemiaAction])[];
};
