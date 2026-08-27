import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND } from './scenarios/hyperkalemia-cardioprotection-and-rebound';
import { RENAL_HYPERKALEMIA_FIXTURES } from './hyperkalemia-fixtures';
import { RENAL_HYPERKALEMIA_DEMONSTRATION_VERSION } from './demo/renal-hyperkalemia-demonstration';

export function renalHyperkalemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_HYPERKALEMIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_HYPERKALEMIA_FIXTURES.contentVersion !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Seed 4941 binds fixed expert, incomplete-care, rebound/recovery, and no-action contrasts. No stochastic potassium or dose kinetics is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['Temporary ECG protection, shifting, delivered-removal response, and rebound differ. Partial observations retain independent timestamps; clocks do not disclose unrequested potassium or glucose.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Thirteen dose-free choices separate calcium, shifting, planning, delivered elimination, observations, and ownership. ECG-based closure and glucose-monitoring closure are refused and retained.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Current-state continuing-care handoff or instructor takeover bounds practice without predicting arrhythmia, kidney recovery, discharge, or safety. Earlier mistakes do not bar later handoff.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound findings distinguish transient cardiac protection, redistribution, delivered care, partial observations, and continued ownership. Rebound history persists after later response.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hyperkalemia-fixtures.ts binds exact-content pathways; real-engine replay checks compare complete frames, not merely final potassium.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_HYPERKALEMIA_DEMONSTRATION_VERSION} use ordinary actions. Unassisted mode remains silent without private state mutation.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
