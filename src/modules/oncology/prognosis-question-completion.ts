import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { PROGNOSIS_QUESTION_A_NUMBER_HE_ASKED_FOR } from './scenarios/prognosis-question-a-number-he-asked-for';
import { PROGNOSIS_QUESTION_FIXTURES } from './prognosis-question-fixtures';

export function prognosisQuestionCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'oncology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== PROGNOSIS_QUESTION_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || PROGNOSIS_QUESTION_FIXTURES.contentVersion !== '0.1.0' || PROGNOSIS_QUESTION_FIXTURES.seed !== 4826
    || JSON.stringify(scenario) !== JSON.stringify(PROGNOSIS_QUESTION_A_NUMBER_HE_ASKED_FOR)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['prognosis-question-fixtures.ts binds seed 4826 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No survival, disease, or treatment-response model is claimed, and no prognosis is computed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['prognosis-question.ts runs two authored transitions, the second of which is produced by what the learner actually said. At 20 minutes he asks again and gives the reason: a wedding in four months and a decision about whether to book anything. Thirty minutes after an answer is given he repeats it back to his daughter, and what he repeats is all three scenarios and the direction of the error if both were given, or the best case alone if the direction was not. Nothing is repeated back if nothing was answered.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner asks what he wants the number for before answering, records the question in his own words, checks what he believes the treatment is for, answers with a typical figure and a worse and better case, states which way the estimate is likely to be wrong, and reviews the boundaries. Giving one number, saying nobody can know, reassuring him and moving on, and answering before asking are each refused. Two ordering constraints hold the shape: an answer cannot precede establishing what he wants, and the direction of the error cannot precede the estimate it qualifies.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The established purpose, the recorded question, the checked belief, the scenario answer, the stated direction, the boundary review, and a current assessment of what was said permit handoff with the prognosis open. Instructor takeover bounds a run in which no answer was ever given at 180 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Seven event-bound objectives distinguish the question behind the question, recording it in his words, the belief the answer would otherwise land on, scenarios rather than a number, the direction of the estimating error, the certainty of the cited cohorts, and handing off what he took from it rather than what was said to him. Refused shortcuts remain visible, and no prognosis or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['prognosis-question-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine, including the contrast between the two readbacks.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
