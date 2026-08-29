import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RARE_EARLY_MYOCARDITIS_A_BASE_RATE_IS_NOT_A_THRESHOLD } from './scenarios/rare-early-myocarditis-a-base-rate-is-not-a-threshold';
import { RARE_EARLY_MYOCARDITIS_FIXTURES } from './rare-early-myocarditis-fixtures';

export function rareEarlyMyocarditisCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'oncology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RARE_EARLY_MYOCARDITIS_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RARE_EARLY_MYOCARDITIS_FIXTURES.contentVersion !== '0.1.0' || RARE_EARLY_MYOCARDITIS_FIXTURES.seed !== 5604
    || JSON.stringify(scenario) !== JSON.stringify(RARE_EARLY_MYOCARDITIS_A_BASE_RATE_IS_NOT_A_THRESHOLD)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['rare-early-myocarditis-fixtures.ts binds seed 5604 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No myocardial, conduction, or immune model is claimed, and no individualized risk is computed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['rare-early-myocarditis.ts runs two authored transitions, one of them conditional on the learner having looked. Twenty-five minutes after monitoring is arranged the conduction progresses to intermittent Mobitz type I without symptoms; where monitoring was not arranged it does not appear at all, which is the honest consequence of not arranging it rather than a hidden state. Both teams answer 60 minutes after both are contacted, take joint ownership, and record that neither owns it alone.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner records the exposure interval against the described onset, records what is present that does not sound cardiac, arranges continuous rhythm monitoring with its reason, contacts both teams together, records bounded qualified-team treatment intent, and reviews the boundaries. Setting it aside as too rare, discounting the troponin, deferring the repeat by a week, and running the coronary pathway and stopping there are each refused, the last for stopping rather than for considering.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The recorded interval, the recorded non-cardiac findings, arranged monitoring, contact with both teams, bounded intent, the boundary review, and a current assessment including the rhythm permit handoff with the diagnosis open. Instructor takeover bounds a run with no escalation at 180 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Seven event-bound objectives distinguish the exposure interval as a finding, the symptoms that do not sound cardiac, monitoring what can move unobserved, escalating to both teams rather than one, refusing rarity as a reason, the certainty of a referral-centre series, and handing off a problem neither team owns alone. Refused shortcuts remain visible, and no diagnosis or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['rare-early-myocarditis-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine, including the contrast between a monitored and an unmonitored run.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
