import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { NECROTIZING_INFECTION_SCORE_CANNOT_EXCLUDE } from './scenarios/necrotizing-infection-score-cannot-exclude';
import { NECROTIZING_INFECTION_FIXTURES } from './necrotizing-infection-fixtures';

export function necrotizingInfectionCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'infectious-disease' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== NECROTIZING_INFECTION_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || NECROTIZING_INFECTION_FIXTURES.contentVersion !== '0.1.0' || NECROTIZING_INFECTION_FIXTURES.seed !== 5411
    || JSON.stringify(scenario) !== JSON.stringify(NECROTIZING_INFECTION_SCORE_CANNOT_EXCLUDE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['necrotizing-infection-fixtures.ts binds seed 5411 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No infection, tissue, or operative model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['necrotizing-infection.ts advances the disease on its own authored clock whatever the learner records, because only an operation treats it and the operation happens after the rehearsal. The derived risk score rises from 3 to 11 across that transition, so the score becomes positive only after the interval in which acting on it mattered. Unrequested laboratory and limb findings remain private.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Dose-free choices independently record disproportionate pain, marking and timing the erythema border, urgent surgical review, bounded antimicrobial intent alongside rather than instead of surgery, the evidence boundary, and surveillance. Excluding on the score, delaying review for imaging, treating absent crepitus and bullae as reassurance, and continuing the failed oral course are each refused.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Recognition, a marked border, surgical review, bounded antimicrobial intent, the boundary review, surveillance, and a current full assessment permit handoff with the diagnosis unconfirmed. Instructor takeover bounds a run with no surgical review at six hours, or an unfinished session at twelve.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish reconciliation, the refusal to exclude on a score, surgical activation with a marked border, the sensitivity and timing evidence boundary, bounded intent with strict reassessment, and accountable handoff. Refused shortcuts remain visible, and no operative finding or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['necrotizing-infection-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
