/**
 * The nursing lessons mapped to the NCSBN Clinical Judgment Measurement Model
 * (framework-mapping-expansion → NCJMM mapping for nursing).
 *
 * The six step names are NCSBN's own short names, taken from the 2026 NCLEX-RN
 * Test Plan; every description below is this project's wording, because the
 * document's text is copyrighted. The mapping is this project's reading, not
 * NCSBN's, and NCSBN has not reviewed or endorsed it.
 *
 * Every nursing objective begins with one of six verbs, and each verb names the
 * kind of judgment the objective records. The mapping is made at that level and
 * stated as a convention, so it is falsifiable: open the lesson, read the
 * objective, and check the verb against the step.
 */
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { Scenario } from '@anesthesia/scenarios/types';

export const NCSBN_NCJMM: FrameworkRecord = {
  id: 'ncsbn-ncjmm',
  name: 'Clinical Judgment Measurement Model, layer 3',
  shortLabel: 'NCJMM',
  body: 'National Council of State Boards of Nursing',
  version: 'As stated in the NCLEX-RN Test Plan effective April 2026',
  url: 'https://www.nclex.com/files/2026_RN_Test%20Plan_English-F.pdf',
  appliesTo: 'Prelicensure registered nursing students and the programs that prepare them',
  fidelity: 'verbatim',
  note: 'Step names as listed under "Clinical Judgment" in the 2026 NCLEX-RN Test Plan (PDF page 8). '
    + 'Descriptions are this project\'s summary. Mapping these lessons to the model is this project\'s '
    + 'reading; NCSBN has not reviewed or endorsed it, and it says nothing about examination readiness.',
  recordedOn: '2026-10-19',
  reviewBy: '2028-10-19',
  domains: [
    { id: 'recognize-cues', label: 'Recognize cues', description: 'Pick out the information that matters from what is available.' },
    { id: 'analyze-cues', label: 'Analyze cues', description: 'Connect that information to what is happening to this patient.' },
    { id: 'prioritize-hypotheses', label: 'Prioritize hypotheses', description: 'Weigh competing explanations by urgency, likelihood, and risk.' },
    { id: 'generate-solutions', label: 'Generate solutions', description: 'Decide what outcome is wanted and what would reach it.' },
    { id: 'take-action', label: 'Take action', description: 'Carry out what addresses the highest priority.' },
    { id: 'evaluate-outcomes', label: 'Evaluate outcomes', description: 'Compare what happened with what was expected.' },
  ],
};

export type NcjmmStep = 'recognize-cues' | 'analyze-cues' | 'prioritize-hypotheses'
  | 'generate-solutions' | 'take-action' | 'evaluate-outcomes';

/** The convention: an objective's leading verb names the judgment it records. */
export const NCJMM_BY_VERB: Readonly<Record<string, readonly NcjmmStep[]>> = {
  reconcile: ['recognize-cues'],
  recognize: ['analyze-cues'],
  record: ['analyze-cues'],
  review: ['prioritize-hypotheses'],
  activate: ['generate-solutions', 'take-action'],
  handoff: ['take-action'],
};

/**
 * Why a step is not exercised, stated rather than left as a gap. These lessons
 * end before any outcome exists, by design: each stops at the decision.
 */
export const NCJMM_NOT_EXERCISED_REASON: Readonly<Partial<Record<NcjmmStep, string>>> = {
  'evaluate-outcomes': 'No nursing lesson runs long enough to compare an outcome with an expectation; '
    + 'each ends at the decision, and none predicts what happens next.',
};

export interface NcjmmMapping {
  readonly scenarioId: string;
  readonly objectiveId: string;
  readonly steps: readonly NcjmmStep[];
  /** What the debrief records for this objective: the evidence the mapping rests on. */
  readonly evidence: string;
}

/** Every nursing objective's mapping, or an error naming an objective the convention cannot place. */
export function ncjmmMappings(scenarios: readonly Scenario[]): NcjmmMapping[] {
  return scenarios.flatMap((scenario) => scenario.metadata.objectives.map((objective) => {
    const verb = objective.id.split('-')[0] ?? '';
    const steps = NCJMM_BY_VERB[verb];
    if (steps === undefined) throw new Error(`${scenario.metadata.id}:${objective.id} begins with "${verb}", which the NCJMM convention does not place`);
    return { scenarioId: scenario.metadata.id, objectiveId: objective.id, steps, evidence: objective.measure };
  }));
}
