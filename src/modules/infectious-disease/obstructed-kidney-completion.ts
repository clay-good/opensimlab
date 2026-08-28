import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { OBSTRUCTED_INFECTED_KIDNEY_DECOMPRESSION } from './scenarios/obstructed-infected-kidney-decompression';
import { OBSTRUCTED_KIDNEY_FIXTURES } from './obstructed-kidney-fixtures';

export function obstructedKidneyCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'infectious-disease' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== OBSTRUCTED_KIDNEY_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || OBSTRUCTED_KIDNEY_FIXTURES.contentVersion !== '0.1.0' || OBSTRUCTED_KIDNEY_FIXTURES.seed !== 5203
    || JSON.stringify(scenario) !== JSON.stringify(OBSTRUCTED_INFECTED_KIDNEY_DECOMPRESSION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['obstructed-kidney-fixtures.ts binds seed 5203 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No infection, drainage, or kidney-recovery model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['obstructed-kidney.ts separates a six-hour untreated deterioration on appropriate antimicrobials from a six-hour post-decompression assessment. The decompressed state improves observations and lactate while the C-reactive protein keeps rising, so marker direction cannot be used as the success signal. Unrequested laboratory and observation findings remain private.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Dose-free choices independently record obstruction recognition, urology and interventional-radiology activation, culture sampling, bounded decompression intent, deferral of definitive stone treatment, boundary review, and surveillance. Continuing antimicrobials alone, waiting for a marker trend, declaring one drainage modality correct, and treating the stone during active infection are refused.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Recognition, activation, cultures, bounded decompression intent, stone deferral, boundary review, surveillance, and a current full assessment permit unresolved-infection handoff. No modality, drain time, or organism is required. Instructor takeover bounds a run with no urology activation or decompression intent at two hours, or an unfinished session at 24 hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish reconciliation, recognition of an undrained source, activation with timing owned by the receiving team, the timing and modality evidence boundary, bounded intent with a deferred stone decision, and accountable handoff. Refused shortcuts remain visible after later care, and neither cure nor kidney recovery is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['obstructed-kidney-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
