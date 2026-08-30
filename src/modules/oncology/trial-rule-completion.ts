import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { TRIAL_RULE_A_RULE_WRITTEN_FOR_A_DATABASE } from './scenarios/trial-rule-a-rule-written-for-a-database';
import { TRIAL_RULE_FIXTURES } from './trial-rule-fixtures';

export function trialRuleCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'oncology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== TRIAL_RULE_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || TRIAL_RULE_FIXTURES.contentVersion !== '0.1.0' || TRIAL_RULE_FIXTURES.seed !== 2814
    || JSON.stringify(scenario) !== JSON.stringify(TRIAL_RULE_A_RULE_WRITTEN_FOR_A_DATABASE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['trial-rule-fixtures.ts binds seed 2814 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No tumour-growth, response, or treatment-effect model is claimed, and no outcome follows from any choice.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['trial-rule.ts runs two authored transitions, and this is the only lesson in this module where what changes is neither the patient nor the pressure but the rule. At 20 minutes the cited criteria arrive and are narrower than they were quoted as being: their allowance is conditional on clinical stability, their working group calls them recommendations for data handling rather than patient management, and they are not validated. The treating team answers 40 minutes after it is called, takes ownership of continuing, stopping, a further line, and what she is told, reviews her within days rather than at the eight-week scan, and states that both errors are real. The document arrives whatever the learner did.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner records the trajectory and its rate rather than the scan alone, records what the criteria do and do not govern, calls the treating team, records bounded qualified-team treatment intent, and reviews the boundaries in both directions. Calling it pseudoprogression and continuing, stopping and telling her it failed, letting the scan alone decide, and booking an eight-week rescan are each refused, the first on the criterion’s own condition rather than on the phenomenon and the second as the opposite error rather than the safe one.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The recorded trajectory, the recorded scope of the criteria, the call to the treating team, bounded intent, the boundary review, and a current assessment permit handoff with the treatment decision open. Instructor takeover bounds a run with no escalation at 150 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Seven event-bound objectives distinguish a slope from a moment, a data-handling criterion from a management instruction, reaching the team that actually decides, refusing continuation and discontinuation as the same error, bounded qualified-team intent, reading two rates neither of which decides this patient, and handing off a direction rather than a report. Refused shortcuts remain visible, and no diagnosis, treatment effect, or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['trial-rule-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine, including the authored arrival of the document.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
