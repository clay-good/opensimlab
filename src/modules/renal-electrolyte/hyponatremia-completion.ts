import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT } from './scenarios/hyponatremia-symptoms-and-reassessment';
import { RENAL_HYPONATREMIA_FIXTURES } from './hyponatremia-fixtures';
import { RENAL_HYPONATREMIA_DEMONSTRATION_VERSION } from './demo/renal-hyponatremia-demonstration';

export function renalHyponatremiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_HYPONATREMIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_HYPONATREMIA_FIXTURES.contentVersion !== '0.1.0' || RENAL_HYPONATREMIA_FIXTURES.seed !== 4961
    || RENAL_HYPONATREMIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['hyponatremia-fixtures.ts binds seed 4961 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No stochastic sodium or dose kinetics is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['hyponatremia.ts distinguishes initial rescue, first sodium response with persistent symptoms, and selected additional rescue. Headache, nausea, and confusion do not resolve when sodium rises. Partial sodium and neurologic observations retain independent timestamps.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Thirteen dose-free choices distinguish independent initial rescue, paired reassessment, selected additional rescue, neurologic investigation, context, monitoring, and support. Normalization, sodium-only recovery, and premature SIADH conclusions are refused and retained without blocking later appropriate care.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Current full later findings and continued-care ownership permit handoff, or instructor takeover bounds an unfinished run. The authored total rise of 6 mmol/L is not a clinical stop rule, symptom resolution, durable correction, or discharge clearance.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish symptom-led rescue, pretreatment diagnostic context, paired observations, persistent-symptom response, and accountable handoff. Earlier refused conclusions remain visible after later care.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hyponatremia-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_HYPONATREMIA_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; prompts do not reveal unrequested sodium or neurologic observations.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
