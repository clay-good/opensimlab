import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { COUNTED_RATE_A_NUMBER_NOBODY_COUNTED } from './scenarios/counted-rate-a-number-nobody-counted';
import { COUNTED_RATE_FIXTURES } from './counted-rate-fixtures';

export function countedRateCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'medical-surgical-nursing' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== COUNTED_RATE_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || COUNTED_RATE_FIXTURES.contentVersion !== '0.1.0' || COUNTED_RATE_FIXTURES.seed !== 9153
    || JSON.stringify(scenario) !== JSON.stringify(COUNTED_RATE_A_NUMBER_NOBODY_COUNTED)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['counted-rate-fixtures.ts binds seed 9153 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No respiratory or physiological model is claimed; the counted rate is authored.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['counted-rate.ts runs one authored transition. The requested medical review arrives 60 minutes after it is requested, counts independently, reaches the same rate, and records that the charted column gave no indication of it. Nothing arrives unrequested. The charted entries never change, because they are a record of what was written rather than of what was measured, and the patient never changes either: only what is known changes.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner reviews the charted trend, counts for a full minute, records the discrepancy without reconciling it, escalates on the counted value, reviews the boundaries, and arranges increased observation with counting rather than estimation. Reading the flat trend as stability, charting a monitor-derived value as a counted one, anchoring to the previous entry, and amending another clinician\u2019s earlier entries are each refused. Recording a discrepancy or escalating before anything has been counted is refused as premature rather than accepted.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['A reviewed trend, a counted rate, a recorded discrepancy, escalation on the counted value, the boundary review, increased observation, and a current full assessment permit handoff with the cause open. Instructor takeover bounds a run with no escalation at 150 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish reading a trend as a distribution, counting for a full minute, recording a discrepancy rather than resolving it, escalating on the counted value, the boundaries and their certainty, and accountable handoff. Refused shortcuts remain visible, and no cause or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['counted-rate-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
