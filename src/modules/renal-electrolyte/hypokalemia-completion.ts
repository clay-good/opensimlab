import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES } from './scenarios/hypokalemia-magnesium-and-ongoing-losses';
import { RENAL_HYPOKALEMIA_FIXTURES } from './hypokalemia-fixtures';
import { RENAL_HYPOKALEMIA_DEMONSTRATION_VERSION } from './demo/renal-hypokalemia-demonstration';

export function renalHypokalemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_HYPOKALEMIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_HYPOKALEMIA_FIXTURES.contentVersion !== '0.1.0' || RENAL_HYPOKALEMIA_FIXTURES.seed !== 4951
    || RENAL_HYPOKALEMIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['hypokalemia-fixtures.ts binds seed 4951 and content 0.1.0 to expert, incomplete-care, recurrence/recovery, and no-action contrasts. No stochastic electrolyte or dose kinetics is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['hypokalemia.ts distinguishes individual replacement, paired response, continuing-loss recurrence, and later combined care. Requested potassium, ECG, and full findings retain independent timestamps; public clocks do not disclose unrequested magnesium or potassium.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Twelve dose-free choices separate potassium, magnesium, contributor review, delivered loss management, observations, monitoring, and support. Rapid-potassium and monitoring-closure choices are refused and retained without blocking later appropriate care.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Current-state continuing-care handoff or instructor takeover bounds practice without predicting arrhythmia, renal recovery, discharge, or safety. A current full recurrence assessment can support transfer of unresolved risk; normal electrolytes and a flawless history are not required.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish potassium replacement, magnesium, ongoing-loss management, observed partial versus combined response, and accountable handoff. Later improvement preserves earlier observed recurrence.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hypokalemia-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_HYPOKALEMIA_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; no hidden laboratory state is revealed by prompts.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
