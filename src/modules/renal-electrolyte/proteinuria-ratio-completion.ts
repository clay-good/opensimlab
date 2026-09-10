import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_PROTEINURIA_RATIO } from './scenarios/proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not';
import { RENAL_PROTEINURIA_FIXTURES } from './proteinuria-ratio-fixtures';
import { RENAL_PROTEINURIA_DEMONSTRATION_VERSION } from './demo/renal-proteinuria-ratio-demonstration';

export function renalProteinuriaRatioCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_PROTEINURIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_PROTEINURIA_FIXTURES.contentVersion !== '0.1.0' || RENAL_PROTEINURIA_FIXTURES.seed !== 5077
    || RENAL_PROTEINURIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_PROTEINURIA_RATIO)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['proteinuria-ratio-fixtures.ts binds seed 5077 and content 0.1.0 to expert, progression-label error, recovery, and no-action contrasts. No excretion model is implemented.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['proteinuria-ratio.ts is the one lesson in this module where the missing measurement can actually be obtained: a matched first morning sample returns 189 mg/g against the 312 the case opens on. It narrows the question rather than closing it, and the engine says so — one matched value is not a timed collection and establishes no cause.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Comparing the rise against the reference change, reading the sampling conditions, checking the patient against the number, and requesting a matched repeat are four distinct recorded steps. Changing treatment on the supplied pair and recording the change as progression are refused with explanations that claim neither stability nor correctness of the current treatment.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The comparison, the sampling review, the clinical review, the matched repeat and its result, the owned decision, support, monitoring, and a current full assessment permit handoff of a narrowed question. A single settling number is not a gate and is not produced. Instructor takeover bounds a run in which the change is never compared and no repeat requested at 30 minutes, or an unfinished session at 180 minutes.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish comparing a change against measurement variation, reading sampling conditions, checking the patient against the number, obtaining the measurement that would answer the question, and handing on what the finding rests on. Refused shortcuts and the authored uncompared contrast remain available after later care.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['proteinuria-ratio-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_PROTEINURIA_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; prompts do not reveal the matched value before it returns.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
