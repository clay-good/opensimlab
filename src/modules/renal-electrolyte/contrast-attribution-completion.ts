import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_CONTRAST_ATTRIBUTION_LABEL } from './scenarios/contrast-attribution-a-label-that-stopped-the-search';
import { RENAL_CONTRAST_FIXTURES } from './contrast-attribution-fixtures';
import { RENAL_CONTRAST_DEMONSTRATION_VERSION } from './demo/renal-contrast-attribution-demonstration';

export function renalContrastAttributionCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_CONTRAST_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_CONTRAST_FIXTURES.contentVersion !== '0.1.0' || RENAL_CONTRAST_FIXTURES.seed !== 5023
    || RENAL_CONTRAST_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_CONTRAST_ATTRIBUTION_LABEL)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['contrast-attribution-fixtures.ts binds seed 5023 and content 0.1.0 to expert, incomplete-search, recovery, and no-action contrasts. No stochastic injury model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['contrast-attribution.ts changes the record rather than the patient: reviewing the alternatives opens the full observation and drug charts, which hold four hypotensive episodes rather than the two the summary showed. The creatinine rises whatever the learner does, so reasoning well is never rewarded with a better number.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Reading the written label, reviewing what it did not exclude, reviewing what a rise after an exposure shows, and withdrawing the exposures that are still running are four distinct recorded steps. Attributing the injury to contrast and closing the search are both refused with an explanation, and the refusals name no alternative cause.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The label review, the alternatives, the evidence review, withdrawn exposures, support ownership, monitoring, and a current full assessment once the charts are open permit handoff of an unresolved cause. Naming a cause and a falling creatinine are not gates. Instructor takeover bounds a run in which the label is never read at 30 minutes, or an unfinished session at 180 minutes.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish reading the attribution, reviewing what it left untouched, separating controlled comparison from a before-and-after rise, current reassessment, and handing over an open question. Refused shortcuts and the authored unexamined contrast remain available after later care.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['contrast-attribution-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_CONTRAST_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; prompts do not reveal the unopened chart before it is retrieved.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
