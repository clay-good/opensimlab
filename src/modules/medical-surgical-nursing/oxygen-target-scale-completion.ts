import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { OXYGEN_TARGET_SCALE_A_SCORE_THAT_SHOULD_BE_LOWER } from './scenarios/oxygen-target-scale-a-score-that-should-be-lower';
import { OXYGEN_TARGET_SCALE_FIXTURES } from './oxygen-target-scale-fixtures';

export function oxygenTargetScaleCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'medical-surgical-nursing' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== OXYGEN_TARGET_SCALE_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || OXYGEN_TARGET_SCALE_FIXTURES.contentVersion !== '0.1.0' || OXYGEN_TARGET_SCALE_FIXTURES.seed !== 5307
    || JSON.stringify(scenario) !== JSON.stringify(OXYGEN_TARGET_SCALE_A_SCORE_THAT_SHOULD_BE_LOWER)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['oxygen-target-scale-fixtures.ts binds seed 5307 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No respiratory, gas-exchange, or oxygen-delivery model is claimed; the observation, the prescription, and the chart are authored.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['oxygen-target-scale.ts runs two authored transitions. At 10 minutes a colleague reads the score off the chart and offers to put oxygen on her, which is the harm the guideline names arriving as a helpful offer. If the documented decision is taken to the qualified team, they review 18 minutes later, confirm the decision and the prescribed range, record that the wrong chart was in use, and record that a corrected score is not a statement that she is well. The saturation never moves, because a drifting number would let a learner treat the drift as the answer.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner reads the prescription and the chart, records that they disagree, rescores on the prescribed scale, states what the rescore does and does not change, takes the documented decision to the qualified team, reviews the boundaries, and arranges observation on the corrected chart. Raising the inspired oxygen to lift the saturation, assuming the diagnosis sets the scale, reading the lower score as improvement, and carrying the higher of the two scales are each refused. Recording a mismatch before both documents are read, and rescoring before the mismatch is recorded, are refused as premature.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Both documents read, a recorded mismatch, a rescore on the prescribed scale, the stated consequences, a confirmation request, the boundary review, observation on the corrected chart, and a current full assessment permit handoff. Instructor takeover bounds a run with no confirmation request at 90 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish reading both documents before calling them mismatched, recalculating against the prescribed range, stating that only the score changed, routing the scale decision to a competent decision maker, the guideline and trial evidence with its stated limits, and handing over a corrected score as a corrected score. Refused shortcuts remain visible, and no cause, trajectory, or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['oxygen-target-scale-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
