import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_HYPERNATREMIA_WATER_ACCESS_AND_LOSSES } from './scenarios/hypernatremia-water-access-and-losses';
import { RENAL_HYPERNATREMIA_FIXTURES } from './hypernatremia-fixtures';
import { RENAL_HYPERNATREMIA_DEMONSTRATION_VERSION } from './demo/renal-hypernatremia-demonstration';

export function renalHypernatremiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_HYPERNATREMIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_HYPERNATREMIA_FIXTURES.contentVersion !== '0.1.0' || RENAL_HYPERNATREMIA_FIXTURES.seed !== 4973
    || RENAL_HYPERNATREMIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_HYPERNATREMIA_WATER_ACCESS_AND_LOSSES)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['hypernatremia-fixtures.ts binds seed 4973 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No stochastic sodium or fluid kinetics is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['hypernatremia.ts separates circulation restoration, partial water response, uncovered ongoing-loss recurrence, and later combined-care response. A better blood pressure does not correct sodium; diarrhea, thirst, and fatigue persist. Unrequested sodium and urine findings remain private.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Dose-free choices distinguish qualified circulation care, individualized water replacement, continuing-loss care, safe assisted access, monitoring, context, support, and partial or full reassessment. Administrative review and assisted access do not gate biochemical treatment response; later care does not erase earlier mistakes or observed recurrence.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Delivered care, current full findings after a water response, and continuing-care ownership permit handoff, including observed recurrence while the loss-care response remains pending. Instructor takeover bounds a run without volume care at 60 minutes or an unfinished session at 600 minutes. Normal sodium, resolved diarrhea, flawless history, and completion of every older panel are not handoff requirements.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish circulation support, access and loss context, separate replacement and access decisions, current reassessment, and accountable unresolved-risk handoff. Refused shortcuts and historically observed recurrence remain available after later care.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hypernatremia-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_HYPERNATREMIA_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; prompts do not reveal unrequested sodium, urine findings, or latent recurrence.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
