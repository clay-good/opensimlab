import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_ESTIMATED_FILTRATION } from './scenarios/estimated-filtration-a-number-she-was-never-measured-by';
import { RENAL_ESTIMATE_FIXTURES } from './estimated-filtration-fixtures';
import { RENAL_ESTIMATE_DEMONSTRATION_VERSION } from './demo/renal-estimated-filtration-demonstration';

export function renalEstimatedFiltrationCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_ESTIMATE_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_ESTIMATE_FIXTURES.contentVersion !== '0.1.0' || RENAL_ESTIMATE_FIXTURES.seed !== 5041
    || RENAL_ESTIMATE_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_ESTIMATED_FILTRATION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['estimated-filtration-fixtures.ts binds seed 5041 and content 0.1.0 to expert, dose-on-the-number error, recovery, and no-action contrasts. No filtration model or equation is implemented.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['estimated-filtration.ts returns a second estimate of 38 against the first 68 and then stops. Every observation the engine can produce carries a null measured filtration rate, so the rehearsal never resolves the disagreement it creates; a learner waiting for the real number is meant to notice nobody supplies one.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Reading the estimate’s width, asking what it was generated from, requesting a differently generated marker, recording the disagreement, and placing the medicine decision with the qualified team are five distinct recorded steps. Reviewing the discordance before the marker returns is refused as premature. Dosing on the estimate and adopting whichever value suits the plan are refused with explanations that select no drug and no alternative.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The precision review, the generation review, the second marker and its recorded disagreement, the owned medicine decision, support, monitoring, and a current full assessment permit handoff of an unresolved question. An agreed number, a resolved discordance, and a measured filtration rate are not gates and do not exist. Instructor takeover bounds a run in which the estimate is never read and no marker requested at 30 minutes, or an unfinished session at 180 minutes.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish reading an estimate as an estimate, asking what generated it, treating disagreement as information, separating a repeated marker from a narrower answer, and handing on uncertainty as uncertainty. Refused shortcuts and the authored unreviewed contrast remain available after later care.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['estimated-filtration-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_ESTIMATE_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; prompts do not reveal the second estimate before it returns.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
