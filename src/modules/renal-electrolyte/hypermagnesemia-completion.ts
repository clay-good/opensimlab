import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL } from './scenarios/hypermagnesemia-antagonism-and-removal';
import { RENAL_HYPERMAGNESEMIA_FIXTURES } from './hypermagnesemia-fixtures';
import { RENAL_HYPERMAGNESEMIA_DEMONSTRATION_VERSION } from './demo/renal-hypermagnesemia-demonstration';

export function renalHypermagnesemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_HYPERMAGNESEMIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_HYPERMAGNESEMIA_FIXTURES.contentVersion !== '0.1.0' || RENAL_HYPERMAGNESEMIA_FIXTURES.seed !== 4999
    || RENAL_HYPERMAGNESEMIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['hypermagnesemia-fixtures.ts binds seed 4999 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No stochastic magnesium kinetics is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['hypermagnesemia.ts separates breathing support, temporary calcium antagonism, clinical recurrence as its benefit ends, and qualified removal response. Calcium does not lower magnesium or restore reflexes. Residual weakness and respiratory-support needs persist after removal; unrequested magnesium and neuromuscular findings remain private.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Dose-free choices independently provide breathing support, calcium antagonism, and qualified removal without administrative or repeat-test prerequisites. Stopping exposure, context review, monitoring, support, partial checks, and full reassessment remain distinct. Qualified repeat calcium requires fresh clinical review; routine diuresis and equating antagonism with clearance are refused.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Stopped exposure, breathing and specialist support, context, monitoring, delivered removal, and current full findings after calcium or removal response permit unresolved-risk handoff. Observed removal response does not require unnecessary late calcium or every earlier panel. Instructor takeover bounds a run with no breathing support, calcium, or removal at 30 minutes, or an unfinished session at 180 minutes.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish urgent support, exposure and kidney context, delivered removal and its observed response, current reassessment, and accountable handoff. Refused shortcuts and observed clinical recurrence remain available after later care; supported respiratory values do not prove spontaneous recovery.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hypermagnesemia-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_HYPERMAGNESEMIA_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; prompts do not reveal unrequested magnesium, neuromuscular findings, or latent removal response.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
