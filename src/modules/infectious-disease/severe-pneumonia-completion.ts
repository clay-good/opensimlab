import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { SEVERE_PNEUMONIA_THE_SCORE_ANSWERED_ANOTHER_QUESTION } from './scenarios/severe-pneumonia-the-score-answered-another-question';
import { SEVERE_PNEUMONIA_FIXTURES } from './severe-pneumonia-fixtures';

export function severePneumoniaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'infectious-disease' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== SEVERE_PNEUMONIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || SEVERE_PNEUMONIA_FIXTURES.contentVersion !== '0.1.0' || SEVERE_PNEUMONIA_FIXTURES.seed !== 5623
    || JSON.stringify(scenario) !== JSON.stringify(SEVERE_PNEUMONIA_THE_SCORE_ANSWERED_ANOTHER_QUESTION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['severe-pneumonia-fixtures.ts binds seed 5623 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No respiratory, gas-exchange, or antimicrobial model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['severe-pneumonia.ts moves the oxygenation ratio from 171 to 92 while the inspired fraction rises from 0.35 to 0.60, so the saturation falls only two points while the lung gets much worse. The mortality score rises from 2 to 4 only after the deterioration, which is the point rather than a reward. Unrequested laboratory and respiratory findings remain private.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Dose-free choices independently record reconciliation of the two supplied instruments, recognition of the instrument-question mismatch, critical-care review requested while the patient is still on a ward trajectory, bounded escalation intent, the triage evidence boundary, and surveillance. Letting the mortality score settle the bed, waiting for deterioration, grading severity by the marker, and reading a saturation without its inspired fraction are each refused.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Reconciliation, mismatch recognition, critical-care review, bounded escalation intent, the boundary review, surveillance, and a current full assessment permit handoff with the level-of-care decision pending. Instructor takeover bounds a run with no critical-care review at 180 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish holding two correct instruments together, recognizing which answers the question in front of the learner, activation while the patient still looks like a ward admission, the triage evidence boundary, bounded intent with strict reassessment, and accountable handoff. Refused shortcuts remain visible, and neither escalation nor bed availability is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['severe-pneumonia-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
