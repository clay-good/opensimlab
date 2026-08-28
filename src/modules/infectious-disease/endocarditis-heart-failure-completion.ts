import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { ENDOCARDITIS_MECHANICAL_FAILURE_ON_A_SURGICAL_CLOCK } from './scenarios/endocarditis-mechanical-failure-on-a-surgical-clock';
import { ENDOCARDITIS_HEART_FAILURE_FIXTURES } from './endocarditis-heart-failure-fixtures';

export function endocarditisHeartFailureCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'infectious-disease' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== ENDOCARDITIS_HEART_FAILURE_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || ENDOCARDITIS_HEART_FAILURE_FIXTURES.contentVersion !== '0.1.0' || ENDOCARDITIS_HEART_FAILURE_FIXTURES.seed !== 5519
    || JSON.stringify(scenario) !== JSON.stringify(ENDOCARDITIS_MECHANICAL_FAILURE_ON_A_SURGICAL_CLOCK)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['endocarditis-heart-failure-fixtures.ts binds seed 5519 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No valve, haemodynamic, or antimicrobial model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['endocarditis-heart-failure.ts drives the infection and the valve in opposite directions: the C-reactive protein falls from 180 to 128 mg/L and cultures stay clear while oxygen requirement, respiratory rate, and lactate all worsen. The pulse pressure narrows from 42 to 18 mmHg rather than widening, because acute severe regurgitation gives a ventricle no time to dilate. Unrequested laboratory and perfusion findings remain private.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Dose-free choices independently record recognition of mechanical failure, activation of the endocarditis team and a surgical centre, bounded surgical-referral intent, the evidence boundary, and surveillance. Reading falling markers as an improving patient, excluding regurgitation on a narrow pulse pressure, treating vegetation size as a standalone trigger, and deferring to tomorrow are each refused.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Recognition, team activation, bounded referral intent, the boundary review, surveillance, and a current full assessment permit handoff with the surgical decision pending. Instructor takeover bounds a run with no team activation or referral at 90 minutes, or an unfinished session at six hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish reconciliation of breathlessness with a responding infection, recognition of mechanical rather than antimicrobial failure, team and surgical-centre activation, the acute-regurgitation and timing boundary, bounded referral with strict reassessment, and accountable handoff. Refused shortcuts remain visible, and neither operability nor survival is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['endocarditis-heart-failure-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
