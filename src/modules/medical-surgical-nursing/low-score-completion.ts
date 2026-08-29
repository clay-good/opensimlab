import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE } from './scenarios/low-score-what-the-threshold-does-not-exclude';
import { LOW_SCORE_FIXTURES } from './low-score-fixtures';

export function lowScoreCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'medical-surgical-nursing' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== LOW_SCORE_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || LOW_SCORE_FIXTURES.contentVersion !== '0.1.0' || LOW_SCORE_FIXTURES.seed !== 8241
    || JSON.stringify(scenario) !== JSON.stringify(LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['low-score-fixtures.ts binds seed 8241 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No infection, host-response, or treatment model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['low-score.ts runs two authored transitions. The family states its concern more plainly at 20 minutes, with the observations and the score unchanged. The requested medical review arrives 90 minutes after it is requested, confirms that treatment was warranted at the time of the call, and reports that the score at that moment was still 2. Nothing arrives unrequested, because the failure being taught is that nobody called. The observations deliberately never drift: a rising score would trigger the threshold and turn this into an ordinary escalation drill.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner records the observations with the score as calculated, records what the score does and does not exclude, records the family report in its own words rather than converting it to a number, requests review on recorded concern rather than on a threshold, reviews the boundaries, and arranges increased observation. Deferring because the score is low, excluding infection on a normal temperature, substituting a more specific screening tool, and documenting without calling are each refused.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Recorded observations, recorded exclusions, the family report, escalation on concern, the boundary review, increased observation, and a current full assessment permit handoff with the diagnosis open. Instructor takeover bounds a run with no escalation at 180 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish recording a correctly calculated score, stating what it does not exclude, treating a family report as evidence, escalating on concern rather than threshold, the boundaries and their certainty, and accountable handoff. Refused shortcuts remain visible, and no diagnosis, organism, or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['low-score-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
