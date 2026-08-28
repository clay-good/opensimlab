import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { FEBRILE_NEUTROPENIA_BLIND_EXAMINATION } from './scenarios/febrile-neutropenia-blind-examination';
import { FEBRILE_NEUTROPENIA_FIXTURES } from './febrile-neutropenia-fixtures';

export function febrileNeutropeniaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'infectious-disease' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== FEBRILE_NEUTROPENIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || FEBRILE_NEUTROPENIA_FIXTURES.contentVersion !== '0.1.0' || FEBRILE_NEUTROPENIA_FIXTURES.seed !== 5307
    || JSON.stringify(scenario) !== JSON.stringify(FEBRILE_NEUTROPENIA_BLIND_EXAMINATION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['febrile-neutropenia-fixtures.ts binds seed 5307 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No marrow, host-response, or antimicrobial model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['febrile-neutropenia.ts contrasts an untreated state in which temperature falls and the white cell count stays flat with a treated state in which observations settle while the C-reactive protein keeps climbing. Both directions of the naive heuristic are therefore wrong, and neutropenia persists in both. Unrequested laboratory and observation findings remain private.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Dose-free choices independently record recognition, pathway activation with the arrival clock, peripheral and line cultures, bounded empiric intent per local protocol, the timing and score boundary review, and surveillance. Treating the modest marker as reassurance, deferring therapy on a low-risk score, waiting for a localizing sign, and reading the flat white cell count as evidence against infection are each refused.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Recognition, activation, cultures, bounded intent, boundary review, surveillance, and a current full assessment permit handoff with neutropenia continuing and no source identified. Instructor takeover bounds a run with no pathway activation or intent at 300 minutes, or an unfinished session at 12 hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish reconciliation, recognition despite a blind examination, pathway and culture activation, the timing and risk-score boundary, bounded intent with strict reassessment, and accountable handoff. Refused shortcuts remain visible after later care, and neither a source nor marrow recovery is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['febrile-neutropenia-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
