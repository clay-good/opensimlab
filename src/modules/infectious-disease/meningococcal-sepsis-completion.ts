import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION } from './scenarios/meningococcal-sepsis-recognition-and-escalation';
import { MENINGOCOCCAL_SEPSIS_FIXTURES } from './meningococcal-sepsis-fixtures';

export function meningococcalSepsisCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'infectious-disease' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== MENINGOCOCCAL_SEPSIS_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || MENINGOCOCCAL_SEPSIS_FIXTURES.contentVersion !== '0.1.0' || MENINGOCOCCAL_SEPSIS_FIXTURES.seed !== 5101
    || JSON.stringify(scenario) !== JSON.stringify(MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['meningococcal-sepsis-fixtures.ts binds seed 5101 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No stochastic infection or host-response model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['meningococcal-sepsis.ts separates an untreated ten-minute deterioration from the one-hour review after recorded intent. The two states are distinct: the untreated contrast worsens perfusion and conscious level, while the reviewed state shows an inadequate response with a risen C-reactive protein that is deliberately not treatment failure. Unrequested laboratory and perfusion findings remain private.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Dose-free choices independently record rash recognition, senior telephone ownership, sampling, bounded antimicrobial intent, bounded fluid and critical-care intent, boundary review, and surveillance. Consultant attendance in person is a distinct escalation from telephone ownership. Excluding sepsis on markers, excluding meningococcal disease on MenACWY vaccination, and delaying transfer for antimicrobials are refused.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Rash recognition, senior ownership, sampling, both bounded intents, boundary review, surveillance, and a current full assessment permit unresolved-shock handoff. Consultant attendance is gated only once the authored one-hour review has fired. Instructor takeover bounds a run with no intent or senior ownership at 30 minutes, or an unfinished session at 180 minutes.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish reconciliation, non-closure on a single marker or on vaccination, activation, the timing and fluid-ceiling boundary, bounded intent with consultant attendance, and accountable handoff. Refused shortcuts remain visible after later care, and neither survival nor source control is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['meningococcal-sepsis-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This launch slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
